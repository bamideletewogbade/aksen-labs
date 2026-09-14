import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { digestToken } from './admin-password';
export const ADMIN_COOKIE = 'aksen_admin';
export function sessionToken(cookie: string | null) {
  const tokens = (cookie || '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.startsWith(ADMIN_COOKIE + '='));
  const token =
    tokens.length === 1 ? tokens[0].slice(ADMIN_COOKIE.length + 1) : '';
  return /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function sessionVersion() {
  return digestToken(
    (process.env.ADMIN_PASSWORD_HASH || '') +
      ':' +
      (process.env.ADMIN_EMAILS || ''),
  );
}
export async function adminSessionUser(cookie: string | null) {
  const token = sessionToken(cookie);
  if (!token || !process.env.ADMIN_PASSWORD_HASH) return null;
  try {
    const result = await getDb().execute(
      sql`SELECT owner_id,email FROM admin_sessions WHERE token_hash=${await digestToken(token)} AND expires_at>now() AND config_version=${await sessionVersion()}`,
    );
    if (!result.rows.length) return null;
    return {
      userId: String(result.rows[0].owner_id),
      email: String(result.rows[0].email),
      displayName: 'Adeyinka',
      fullName: 'Adeyinka',
    };
  } catch {
    return null;
  }
}
