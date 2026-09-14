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
    // The name was written in here as a literal, so every page addressed the
    // same person regardless of who signed in. The session knows the email and
    // nothing more; the name belongs to the profile, which Settings can change
    // without a deploy. Callers resolve it through greetingName.
    const email = String(result.rows[0].email);
    return {
      userId: String(result.rows[0].owner_id),
      email,
      displayName: email,
      fullName: null,
    };
  } catch {
    return null;
  }
}
