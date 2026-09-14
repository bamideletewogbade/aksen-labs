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
export async function hashPassword(
  password: string,
  salt = crypto.getRandomValues(new Uint8Array(16)),
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 },
    key,
    256,
  );
  return `pbkdf2:600000:${hex(salt)}:${hex(new Uint8Array(hash))}`;
}
export async function verifyPassword(password: string, encoded: string) {
  if (
    !/^pbkdf2:600000:[a-f0-9]{32}:[a-f0-9]{64}$/.test(encoded) ||
    password.length > 200
  )
    return false;
  const actual = await hashPassword(password, unhex(encoded.split(':')[2]));
  let different = 0;
  for (let i = 0; i < actual.length; i++)
    different |= actual.charCodeAt(i) ^ encoded.charCodeAt(i);
  return different === 0;
}
