import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

/**
 * Who the operator is, as they wish to be addressed.
 *
 * The name was written into the source in two places, and both said Adeyinka.
 * The dashboard greeted the wrong person on every visit, and correcting it
 * meant an edit and a deploy. That is the same failure as the published build
 * price and the Lead Scout run limit: a value that belongs to the business,
 * kept in the code.
 */
export type WorkspaceProfile = {
  displayName: string;
  fullName: string;
};

export const displayNameLimit = 60;
export const fullNameLimit = 120;

/**
 * Never throws. This is read while rendering the admin shell, and a settings
 * table that is unreachable, or a migration that has not run yet, must not be
 * able to take down every page behind it. The caller falls back to whatever it
 * knew before.
 */
export async function workspaceProfile(
  ownerId: string,
): Promise<WorkspaceProfile | null> {
  if (!ownerId) return null;
  try {
    const result = await getDb().execute(
      sql`SELECT display_name, full_name FROM workspace_settings WHERE owner_id=${ownerId}`,
    );
    const row = result.rows[0];
    if (!row) return null;
    // Checked rather than coerced: a driver returns these as unknown, and
    // String() on an unexpected object yields "[object Object]", which would be
    // rendered as somebody's name.
    const text = (value: unknown) =>
      typeof value === 'string' ? value.trim() : '';
    const displayName = text(row.display_name);
    const fullName = text(row.full_name);
    if (!displayName && !fullName) return null;
    return { displayName, fullName };
  } catch {
    return null;
  }
}

/**
 * The name to greet someone by. Prefers the first word of a full name, because
 * "Bishop" is what you say and "Bishop Tewogbade" is what you file under.
 * Falls back through the signed-in identity, and finally to the local part of
 * an email address, which is ugly but is at least the right person.
 */
export function greetingName(
  profile: WorkspaceProfile | null,
  fallbackFullName: string | null,
  fallbackDisplayName: string,
): string {
  const candidates = [
    profile?.fullName?.split(' ')[0],
    profile?.displayName,
    fallbackFullName?.split(' ')[0],
    fallbackDisplayName.split('@')[0],
  ];
  for (const candidate of candidates) {
    const value = (candidate || '').trim();
    if (value) return value;
  }
  return 'there';
}

export function cleanName(value: unknown, limit: number): string {
  return (typeof value === 'string' ? value : '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}
