/** One policy for pages and APIs; production requires an explicit allowlist. */
export function adminEmailAllowed(
  email: string,
  configured = process.env.ADMIN_EMAILS || '',
  mode = process.env.NODE_ENV,
) {
  const allowed = configured
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.length
    ? allowed.includes(email.trim().toLowerCase())
    : mode === 'development';
}
