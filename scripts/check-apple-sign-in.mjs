import { readFileSync } from 'node:fs';
import { createPrivateKey, sign } from 'node:crypto';

const keyId = process.env.ASC_KEY_ID;
const issuerId = process.env.ASC_ISSUER_ID;
const keyPath = process.env.ASC_KEY_PATH;
if (!keyId || !issuerId || !keyPath) throw new Error('ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_PATH are required.');

const base64url = value => Buffer.from(value).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const header = base64url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
const payload = base64url(JSON.stringify({ iss: issuerId, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' }));
const unsigned = `${header}.${payload}`;
const privateKey = createPrivateKey(readFileSync(keyPath));
const signature = sign('sha256', Buffer.from(unsigned), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
const token = `${unsigned}.${signature}`;

async function call(method, path, body) {
  const response = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Apple API returned ${response.status} for ${path}`);
  return response.json();
}
const get = path => call('GET', path);

const bundles = await get('/v1/bundleIds?filter%5Bidentifier%5D=com.krabople.ways2earn');
const bundle = bundles.data?.[0];
if (!bundle) throw new Error('Ways2Earn App ID was not found.');
const capabilities = await get(`/v1/bundleIds/${bundle.id}/bundleIdCapabilities`);
let types = capabilities.data?.map(item => item.attributes?.capabilityType) ?? [];
if (process.argv.includes('--enable') && !types.includes('APPLE_ID_AUTH')) {
  await call('POST', '/v1/bundleIdCapabilities', {
    data: {
      type: 'bundleIdCapabilities',
      attributes: { capabilityType: 'APPLE_ID_AUTH', settings: [{ key: 'APPLE_ID_AUTH_APP_CONSENT', options: [{ key: 'PRIMARY_APP_CONSENT' }] }] },
      relationships: { bundleId: { data: { type: 'bundleIds', id: bundle.id } } },
    },
  });
  types = (await get(`/v1/bundleIds/${bundle.id}/bundleIdCapabilities`)).data?.map(item => item.attributes?.capabilityType) ?? [];
}
console.log(JSON.stringify({ bundleId: bundle.id, capabilities: types }));
