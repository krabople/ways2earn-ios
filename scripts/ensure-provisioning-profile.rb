require "base64"
require "fileutils"
require "json"
require "net/http"
require "openssl"
require "time"
require "uri"

KEY_ID = ENV.fetch("APPSTORE_KEY_ID")
ISSUER_ID = ENV.fetch("APPSTORE_ISSUER_ID")
PRIVATE_KEY = ENV.fetch("APPSTORE_PRIVATE_KEY")
BUNDLE_ID = ENV.fetch("APP_BUNDLE_ID", "com.krabople.ways2earn")
PROFILE_NAME = ENV.fetch("PROFILE_NAME", "Ways2Earn App Store")

def base64url(value) = Base64.urlsafe_encode64(value).delete("=")
def fixed_width(value) = [value.to_i.to_s(16).rjust(64, "0")].pack("H*")

def token
  now = Time.now.to_i
  header = base64url({ alg: "ES256", kid: KEY_ID, typ: "JWT" }.to_json)
  payload = base64url({ iss: ISSUER_ID, iat: now, exp: now + 900, aud: "appstoreconnect-v1" }.to_json)
  unsigned = "#{header}.#{payload}"
  key = OpenSSL::PKey.read(PRIVATE_KEY)
  signature = key.dsa_sign_asn1(OpenSSL::Digest::SHA256.digest(unsigned))
  parts = OpenSSL::ASN1.decode(signature).value
  "#{unsigned}.#{base64url(parts.map { |part| fixed_width(part.value) }.join)}"
end

def request(method, path, body = nil)
  uri = URI("https://api.appstoreconnect.apple.com#{path}")
  klass = { get: Net::HTTP::Get, post: Net::HTTP::Post }.fetch(method)
  req = klass.new(uri)
  req["Authorization"] = "Bearer #{token}"
  req["Content-Type"] = "application/json"
  req.body = JSON.generate(body) if body
  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(req) }
  unless response.code.to_i.between?(200, 299)
    warn response.body
    abort "App Store Connect request failed: #{method.upcase} #{path} returned #{response.code}"
  end
  response.body.empty? ? {} : JSON.parse(response.body)
end

def normalise_serial(value)
  value.to_s.delete(":").sub(/\A0+/, "").upcase
end

p12 = OpenSSL::PKCS12.new(
  Base64.decode64(ENV.fetch("BUILD_CERTIFICATE_BASE64")),
  ENV.fetch("P12_PASSWORD")
)
certificate_serial = normalise_serial(p12.certificate.serial.to_i.to_s(16))

bundle = request(
  :get,
  "/v1/bundleIds?filter[identifier]=#{URI.encode_www_form_component(BUNDLE_ID)}"
).fetch("data").first
abort "Bundle ID #{BUNDLE_ID} is not registered." unless bundle

certificates = request(:get, "/v1/certificates?limit=200").fetch("data")
certificate = certificates.find do |item|
  attributes = item.fetch("attributes")
  normalise_serial(attributes["serialNumber"]) == certificate_serial &&
    Time.parse(attributes.fetch("expirationDate")) > Time.now
end
abort "The imported Apple distribution certificate was not found in the developer account." unless certificate

profiles = request(
  :get,
  "/v1/profiles?filter[name]=#{URI.encode_www_form_component(PROFILE_NAME)}&limit=200"
).fetch("data")
profile = profiles.find do |item|
  attributes = item.fetch("attributes")
  attributes["profileState"] == "ACTIVE" &&
    attributes["profileType"] == "IOS_APP_STORE" &&
    Time.parse(attributes.fetch("expirationDate")) > Time.now
end

unless profile
  profile = request(:post, "/v1/profiles", {
    data: {
      type: "profiles",
      attributes: { name: PROFILE_NAME, profileType: "IOS_APP_STORE" },
      relationships: {
        bundleId: { data: { type: "bundleIds", id: bundle.fetch("id") } },
        certificates: {
          data: [{ type: "certificates", id: certificate.fetch("id") }]
        }
      }
    }
  }).fetch("data")
  puts "Created provisioning profile #{PROFILE_NAME}."
end

attributes = profile.fetch("attributes")
output_dir = File.expand_path(
  ENV.fetch("PROFILE_OUTPUT_DIR", "~/Library/MobileDevice/Provisioning Profiles")
)
FileUtils.mkdir_p(output_dir)
profile_path = File.join(output_dir, "#{attributes.fetch('uuid')}.mobileprovision")
File.binwrite(profile_path, Base64.decode64(attributes.fetch("profileContent")))
puts "Installed provisioning profile #{attributes.fetch('name')} (#{attributes.fetch('uuid')})."

if ENV["GITHUB_OUTPUT"]
  File.open(ENV.fetch("GITHUB_OUTPUT"), "a") do |output|
    output.puts "profile_name=#{attributes.fetch('name')}"
    output.puts "profile_uuid=#{attributes.fetch('uuid')}"
    output.puts "profile_path=#{profile_path}"
  end
end
