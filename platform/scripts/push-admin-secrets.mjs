// Copies the admin configuration from .env to the deployed Worker.
//
// Run from the platform directory:  node scripts/push-admin-secrets.mjs
//
// It never asks for, reads or stores a plaintext password. The salted hash
// already in .env is what moves across, so production accepts exactly the
// password that already works locally.
//
// Two details this exists to get right:
//
// 1. .env wraps values in quotes and dotenv strips them. wrangler does not, so
//    the quotes are stripped here. Without this, production stores the literal
//    'local_seedy' with quotes and every admin query filters on an owner id
//    that matches no row, leaving the workspace looking empty.
//
// 2. verifyPassword gates on an anchored pattern, and in JavaScript $ matches
//    the end of the string, not the position before a trailing newline. A hash
//    piped through a shell arrives with one appended and fails that test, so
//    every login reads as a wrong password with nothing logged to say why.
//    secret bulk sends exact JSON values, and the shape is checked below
//    before anything is uploaded.
//
// 3. Cloudflare Workers caps PBKDF2 at 100,000 iterations and throws
//    NotSupportedError above it. A hash generated under Node at a higher count
//    verifies locally and fails every production login with a generic 500, so
//    the iteration count is checked here rather than discovered in the logs.
//
// 4. This uploaded to a Worker named 'sites-project', which is the package
//    name, not the Worker serving the site. Every secret this script has ever
//    pushed went to a Worker nothing routes to, while aksen-labs ran with none
//    at all: getDb() threw on the missing DATABASE_URL, withRequestLog turned
//    that into a generic 500, and admin sign-in read as a rejected password.
//    The name is a deployment fact, so it is overridable rather than assumed.
//
// 5. DATABASE_URL is required, not optional. Without it every route that
//    touches the database fails, which is most of them, and the public pages
//    still render because the blog falls back to static posts. A site that
//    looks fine while nothing can sign in is the worst version of this bug.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Override for a rename or a second environment:
//   node scripts/push-admin-secrets.mjs --name some-worker
const nameFlag = process.argv.indexOf('--name');
const WORKER =
  nameFlag !== -1 && process.argv[nameFlag + 1]
    ? process.argv[nameFlag + 1]
    : process.env.WORKER_NAME || 'aksen-labs';

const KEYS = [
  'ADMIN_EMAILS',
  'ADMIN_OWNER_ID',
  'ADMIN_PASSWORD_HASH',
  'DATABASE_URL',
];
// Pushed when .env has them, skipped with a note when it does not, because a
// workspace that signs in but cannot draft or send is only half deployed.
const OPTIONAL_KEYS = [
  'OPENROUTER_API_KEY',
  'AUTOMATION_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];
const HASH_SHAPE = /^pbkdf2:(\d{4,6}):[a-f0-9]{32}:[a-f0-9]{64}$/;
const WORKERS_MAX_ITERATIONS = 100000;

if (!fs.existsSync('.env')) {
  throw new Error('Run this from the platform directory, where .env lives.');
}

const env = fs.readFileSync('.env', 'utf8');
const payload = {};
const skipped = [];

function read(key) {
  const match = env.match(new RegExp('^' + key + '=(.*)$', 'm'));
  if (!match) return undefined;
  let value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

for (const key of KEYS) {
  const value = read(key);
  if (value === undefined) throw new Error(`${key} is not set in .env`);
  if (!value) throw new Error(`${key} is empty in .env`);
  if (/\s/.test(value)) throw new Error(`${key} contains whitespace`);
  payload[key] = value;
}

for (const key of OPTIONAL_KEYS) {
  const value = read(key);
  // RESEND_FROM_EMAIL is an address, so it is the one optional value that may
  // legitimately be absent from .env while present on the Worker already.
  if (!value) {
    skipped.push(key);
    continue;
  }
  if (/\s/.test(value)) throw new Error(`${key} contains whitespace`);
  payload[key] = value;
}

// A malformed connection string is accepted by wrangler and fails at the first
// query, which puts the diagnosis back where this whole exercise started.
let databaseHost;
try {
  const parsed = new URL(payload.DATABASE_URL);
  if (!/^postgres(ql)?:$/.test(parsed.protocol))
    throw new Error('not a postgres URL');
  databaseHost = parsed.host;
} catch {
  throw new Error(
    'DATABASE_URL is not a valid postgres connection string. Expected ' +
      'postgresql://user:password@host/db, which is the pooled Neon URL.',
  );
}

const shape = HASH_SHAPE.exec(payload.ADMIN_PASSWORD_HASH);
if (!shape) {
  throw new Error(
    'ADMIN_PASSWORD_HASH does not match the shape verifyPassword accepts. ' +
      'Regenerate it with: node scripts/configure-admin.mjs',
  );
}
const iterations = Number(shape[1]);
if (iterations > WORKERS_MAX_ITERATIONS) {
  throw new Error(
    `ADMIN_PASSWORD_HASH uses ${iterations} PBKDF2 iterations. Cloudflare ` +
      `Workers refuses anything above ${WORKERS_MAX_ITERATIONS} and throws ` +
      'NotSupportedError, so this hash would verify locally and fail every ' +
      'production login with a generic 500. Regenerate it with: ' +
      'node scripts/configure-admin.mjs',
  );
}

// Shape only. The hash and the address itself stay out of the terminal.
console.log('About to upload to the Worker "' + WORKER + '":');
console.log('  ADMIN_OWNER_ID       ' + payload.ADMIN_OWNER_ID);
console.log(
  '  ADMIN_EMAILS         ' +
    payload.ADMIN_EMAILS.replace(/^(.).*(@.*)$/, '$1***$2'),
);
console.log(
  '  ADMIN_PASSWORD_HASH  valid pbkdf2 hash, ' +
    payload.ADMIN_PASSWORD_HASH.length +
    ` chars, ${iterations} iterations, no plaintext involved`,
);
// Host only. The credentials in the connection string stay out of the terminal
// and out of any scrollback that gets pasted into a chat later.
console.log('  DATABASE_URL         postgres at ' + databaseHost);
for (const key of OPTIONAL_KEYS) {
  if (payload[key]) console.log(`  ${key.padEnd(20)} present, value hidden`);
}
if (skipped.length) {
  console.log('');
  console.log('Not in .env, so not uploaded: ' + skipped.join(', '));
  console.log(
    'Cloudflare will not read a secret value back, so anything already on ' +
      'another Worker has to be re-entered from wherever you keep it.',
  );
}

const file = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), 'aksen-')),
  's.json',
);
try {
  fs.writeFileSync(file, JSON.stringify(payload), { mode: 0o600 });
  execFileSync(
    process.execPath,
    [
      'node_modules/wrangler/bin/wrangler.js',
      'secret',
      'bulk',
      file,
      '--name',
      WORKER,
    ],
    { stdio: 'inherit' },
  );
} finally {
  // The hash must not outlive the upload on disk.
  fs.rmSync(path.dirname(file), { recursive: true, force: true });
}

// Read the Worker back rather than trusting the upload. The failure this
// script exists to prevent was invisible precisely because nobody looked.
let live = [];
try {
  const listed = execFileSync(
    process.execPath,
    [
      'node_modules/wrangler/bin/wrangler.js',
      'secret',
      'list',
      '--name',
      WORKER,
    ],
    { encoding: 'utf8' },
  );
  live = [...listed.matchAll(/"name":\s*"([^"]+)"/g)].map((m) => m[1]);
} catch {
  console.log('\nUploaded, but could not read the Worker back to confirm.');
}

if (live.length) {
  const missing = KEYS.filter((key) => !live.includes(key));
  console.log('');
  console.log(`"${WORKER}" now holds: ${live.join(', ')}`);
  console.log(
    missing.length
      ? 'STILL MISSING and required: ' + missing.join(', ')
      : 'Every required secret is present.',
  );
  console.log(
    'A Worker only picks these up on its next deploy, so redeploy before testing sign-in.',
  );
}
