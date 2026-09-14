const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (value: string) =>
  Uint8Array.from(value.match(/.{2}/g) || [], (b) => parseInt(b, 16));
export async function digestToken(token: string) {
  return hex(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)),
    ),
  );
}
// Cloudflare Workers caps PBKDF2 at 100,000 iterations and throws
// NotSupportedError above it. This ran at 600,000, which Node accepts, so
// every login worked locally and none ever worked in production: deriveBits
// threw before the password was even compared, and the route's catch turned
// that into a generic "could not be completed" with no hint of the cause.
//
// OWASP asks for more than this for PBKDF2-SHA-256. The runtime will not
// provide it, so the remaining defence is the sign-in rate limit of ten
// attempts per fifteen minutes, and a password long enough that iteration
// count is not what stands between an attacker and the account.
export const passwordIterations = 100000;

// Read from the hash rather than assumed, so a stored value always says how it
// was produced and a future change does not silently invalidate old hashes.
const ENCODED = /^pbkdf2:(\d{4,6}):([a-f0-9]{32}):([a-f0-9]{64})$/;

export async function hashPassword(
  password: string,
  salt = crypto.getRandomValues(new Uint8Array(16)),
  iterations = passwordIterations,
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  );
  return `pbkdf2:${iterations}:${hex(salt)}:${hex(new Uint8Array(hash))}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const parts = ENCODED.exec(encoded);
  if (!parts || password.length > 200) return false;
  const iterations = Number(parts[1]);
  // Above the cap deriveBits would throw rather than return a wrong answer,
  // which is how this failure stayed invisible. Refuse it here instead.
  if (iterations > passwordIterations || iterations < 10000) return false;
  const actual = await hashPassword(password, unhex(parts[2]), iterations);
  let different = 0;
  for (let i = 0; i < actual.length; i++)
    different |= actual.charCodeAt(i) ^ encoded.charCodeAt(i);
  return different === 0 && actual.length === encoded.length;
}
