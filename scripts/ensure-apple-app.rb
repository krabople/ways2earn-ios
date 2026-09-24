require "base64"
require "json"
require "net/http"
require "openssl"
require "uri"

KEY_ID = ENV.fetch("APPSTORE_KEY_ID")
ISSUER_ID = ENV.fetch("APPSTORE_ISSUER_ID")
PRIVATE_KEY = ENV.fetch("APPSTORE_PRIVATE_KEY")
BUNDLE_ID = ENV.fetch("APP_BUNDLE_ID", "com.krabople.ways2earn")

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

bundle = request(:get, "/v1/bundleIds?filter[identifier]=#{URI.encode_www_form_component(BUNDLE_ID)}").fetch("data").first
unless bundle
  bundle = request(:post, "/v1/bundleIds", {
    data: {
      type: "bundleIds",
      attributes: { identifier: BUNDLE_ID, name: "Ways2Earn", platform: "IOS" }
    }
  }).fetch("data")
  puts "Registered bundle ID #{BUNDLE_ID}."
end

capabilities = request(:get, "/v1/bundleIds/#{bundle.fetch('id')}/bundleIdCapabilities").fetch("data")
unless capabilities.any? { |item| item.dig("attributes", "capabilityType") == "PUSH_NOTIFICATIONS" }
  request(:post, "/v1/bundleIdCapabilities", {
    data: {
      type: "bundleIdCapabilities",
      attributes: { capabilityType: "PUSH_NOTIFICATIONS", settings: [] },
      relationships: { bundleId: { data: { type: "bundleIds", id: bundle.fetch("id") } } }
    }
  })
  puts "Enabled push notifications for #{BUNDLE_ID}."
end

apps = request(:get, "/v1/apps?filter[bundleId]=#{URI.encode_www_form_component(BUNDLE_ID)}").fetch("data")
if apps.empty?
  app = request(:post, "/v1/apps", {
    data: {
      type: "apps",
      attributes: {
        bundleId: BUNDLE_ID,
        name: "Ways2Earn",
        primaryLocale: "en-GB",
        sku: "ways2earn-ios-2026"
      }
    }
  }).fetch("data")
  puts "Created App Store Connect record #{app.fetch('id')}."
else
  puts "App Store Connect record already exists: #{apps.first.fetch('id')}."
end
