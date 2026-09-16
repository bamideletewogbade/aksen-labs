import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { boundedJson } from '@/lib/bounded-json';
import { verifyPassword, digestToken } from '@/lib/admin-password';
import {
  ADMIN_COOKIE,
  sessionToken,
  sessionVersion,
} from '@/lib/admin-session';
import { withRequestLog } from '@/lib/request-log';
async function post(request: Request) {
  const origin = request.headers.get('origin');
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  const cookie = (value: string, age: number) =>
    `${ADMIN_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${secure}`;
  // Every branch below needs the database, and getDb() throws when the URL is
  // absent. Thrown, that becomes withRequestLog's generic "could not be
  // completed", which is why a Worker deployed with no secrets at all looked
  // like a rejected password: the 503 below never ran, because this line threw
  // first. Named as configuration here, and kept distinguishable from the
  // ADMIN_* check further down so the two can be told apart from the outside.
  if (!process.env.DATABASE_URL)
    return Response.json(
      { error: 'Admin sign-in is unavailable: storage is not configured.' },
      { status: 503 },
    );
  const db = getDb();
  if (new URL(request.url).searchParams.get('action') === 'logout') {
    const token = sessionToken(request.headers.get('cookie'));
    if (token)
      await db.execute(
        sql`DELETE FROM admin_sessions WHERE token_hash=${await digestToken(token)}`,
      );
    return new Response(null, {
      status: 303,
      headers: {
        Location: '/login',
        'Set-Cookie': cookie('', 0),
        'Cache-Control': 'no-store',
      },
    });
  }
  let body;
  try {
    body = await boundedJson(request, 2048);
  } catch {
    return Response.json(
      { error: 'Enter your email and password.' },
      { status: 400 },
    );
  }
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const configured = process.env.ADMIN_EMAILS?.trim().toLowerCase();
  if (
    !process.env.ADMIN_PASSWORD_HASH ||
    !configured ||
    !process.env.ADMIN_OWNER_ID
  )
    return Response.json(
      { error: 'Admin sign-in is not configured.' },
      { status: 503 },
    );
  const bucket = `admin-login-${Math.floor(Date.now() / 900000)}`;
  const allowance = await db.execute(
    sql`INSERT INTO workspace_demo_usage(bucket,requests) VALUES(${bucket},1) ON CONFLICT(bucket) DO UPDATE SET requests=workspace_demo_usage.requests+1 WHERE workspace_demo_usage.requests<10 RETURNING requests`,
  );
  if (!allowance.rows.length)
    return Response.json(
      { error: 'Too many attempts. Try again in 15 minutes.' },
      { status: 429, headers: { 'Retry-After': '900' } },
    );
  const valid = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);
  if (!valid || email !== configured)
    return Response.json(
      { error: 'Email or password is incorrect.' },
      { status: 401 },
    );
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
  const hash = await digestToken(token);
  const owner = process.env.ADMIN_OWNER_ID;
  const version = await sessionVersion();
  await db.execute(
    sql`WITH saved AS (INSERT INTO admin_sessions(token_hash,owner_id,email,config_version,expires_at) VALUES(${hash},${owner},${email},${version},now()+interval '8 hours') RETURNING owner_id) INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id) SELECT ${crypto.randomUUID()},owner_id,'user','admin.signed_in','admin',owner_id FROM saved`,
  );
  return Response.json(
    { next: '/admin' },
    {
      headers: {
        'Set-Cookie': cookie(token, 28800),
        'Cache-Control': 'no-store',
      },
    },
  );
}
export const POST = withRequestLog('/api/session', post);
