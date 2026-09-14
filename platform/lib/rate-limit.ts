import { sql } from 'drizzle-orm';
import { getDb } from '@/db';

/** Allowances reset on the hour. */
export function currentHour() {
  return new Date().toISOString().slice(0, 13);
}

// Cloudflare sets cf-connecting-ip at the edge, so a caller cannot forge it.
// The address is hashed: allowance keys never hold an address. Callers we cannot
// tell apart share one deliberately small bucket rather than going unlimited.
export async function visitorKey(request: Request) {
  const address = (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    ''
  ).trim();
  if (!address) return 'unidentified';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(address),
  );
  return Array.from(new Uint8Array(digest).slice(0, 8))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// Reserves one unit before the expensive work runs. The row is only updated
// while it is under the limit, so concurrent requests cannot overshoot it.
export async function reserve(
  db: ReturnType<typeof getDb>,
  bucket: string,
  limit: number,
) {
  const reserved = await db.execute(
    sql`INSERT INTO workspace_demo_usage(bucket,requests) VALUES(${bucket},1) ON CONFLICT(bucket) DO UPDATE SET requests=workspace_demo_usage.requests+1 WHERE workspace_demo_usage.requests<${limit} RETURNING requests`,
  );
  return reserved.rows.length > 0;
}
