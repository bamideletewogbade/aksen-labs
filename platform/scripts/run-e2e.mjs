// Run: pnpm e2e
//
// Starts a dev server, signs itself in, opens every admin screen in a real
// browser, then puts everything back.
//
// Signing in is done by writing a session row rather than by typing a password
// into the login form. The password is a real secret that would have to be read
// out of .env and typed into a field on every run, and the thing under test is
// the twenty-two screens behind the door, not the door. tests/admin-password.mjs
// already covers the door, and covers it better than a browser could.
//
// On the database, read RUNNING-LOCALLY.md first: .env points at live Neon, so
// by default this run is looking at real business records. See the guard below.
import { spawn } from 'node:child_process';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env');

const hex = (bytes) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
const sha256 = async (text) =>
  hex(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
    ),
  );

// A branch of the live database, made once in the Neon console and pasted into
// .env, is the whole difference between a suite that can click things and one
// that can only look. Without it this stays read-only, and says so, because the
// alternative is a test run that approves a real request from a real person.
const isolated = Boolean(process.env.E2E_DATABASE_URL);
const databaseUrl = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Neither E2E_DATABASE_URL nor DATABASE_URL is set.');
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD_HASH || !process.env.ADMIN_OWNER_ID) {
  console.error('ADMIN_PASSWORD_HASH and ADMIN_OWNER_ID must be set in .env.');
  process.exit(1);
}

console.log(
  isolated
    ? 'database: E2E_DATABASE_URL (isolated)'
    : 'database: DATABASE_URL — LIVE RECORDS, read-only pass only.\n' +
        '          Set E2E_DATABASE_URL to a Neon branch to cover write paths.',
);

const client = neon(databaseUrl);
const token = hex(crypto.getRandomValues(new Uint8Array(32)));
const tokenHash = await sha256(token);
// Must match lib/admin-session.ts sessionVersion(), or the session is ignored
// and every screen bounces to /login.
const configVersion = await sha256(
  `${process.env.ADMIN_PASSWORD_HASH || ''}:${process.env.ADMIN_EMAILS || ''}`,
);
const email = (process.env.ADMIN_EMAILS || '').split(',')[0].trim();

let server;
const cleanup = async () => {
  if (server && !server.killed) server.kill();
  await client
    .query('DELETE FROM admin_sessions WHERE token_hash=$1', [tokenHash])
    .catch(() => null);
};
process.on('SIGINT', async () => {
  await cleanup();
  process.exit(130);
});

try {
  await client.query(
    `INSERT INTO admin_sessions (token_hash, owner_id, email, config_version, expires_at)
     VALUES ($1, $2, $3, $4, now() + interval '1 hour')`,
    [tokenHash, process.env.ADMIN_OWNER_ID, email, configVersion],
  );

  // vinext reads .env itself, so DATABASE_URL is passed explicitly here to be
  // sure the server and the session above are looking at the same database.
  // If it loses that argument the smoke run bounces to /login and says so,
  // which is the failure mode this ordering is chosen to produce.
  // Called directly rather than through `pnpm dev`: RUNNING-LOCALLY.md warns
  // that going via pnpm can trigger a reinstall, and a reinstall in the middle
  // of a test run empties node_modules/.bin.
  server = spawn('node', ['node_modules/vinext/dist/cli.js', 'dev'], {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  const base = await new Promise((resolve, reject) => {
    // The first start bundles dependencies and looks stuck for about 30s.
    const giveUp = setTimeout(
      () => reject(new Error('the dev server did not start within 120s')),
      120000,
    );
    let output = '';
    const watch = (chunk) => {
      output += chunk;
      const found = /https?:\/\/localhost:(\d+)/.exec(output);
      if (found) {
        clearTimeout(giveUp);
        resolve(`http://localhost:${found[1]}`);
      }
    };
    server.stdout.on('data', watch);
    server.stderr.on('data', watch);
    server.on('exit', (code) => {
      clearTimeout(giveUp);
      reject(new Error(`the dev server exited with ${code}:\n${output}`));
    });
  });
  console.log(`server:   ${base}\n`);

  const code = await new Promise((resolve) => {
    const smoke = spawn(process.execPath, ['tests/e2e/admin-smoke.mjs'], {
      env: { ...process.env, BASE_URL: base, ADMIN_TOKEN: token },
      stdio: 'inherit',
    });
    smoke.on('close', resolve);
  });

  await cleanup();
  process.exit(code);
} catch (error) {
  console.error(error.message);
  await cleanup();
  process.exit(1);
}
