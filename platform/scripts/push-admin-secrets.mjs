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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const WORKER = 'sites-project';
const KEYS = ['ADMIN_EMAILS', 'ADMIN_OWNER_ID', 'ADMIN_PASSWORD_HASH'];
const HASH_SHAPE = /^pbkdf2:(\d{4,6}):[a-f0-9]{32}:[a-f0-9]{64}$/;
const WORKERS_MAX_ITERATIONS = 100000;

if (!fs.existsSync('.env')) {
  throw new Error('Run this from the platform directory, where .env lives.');
}

const env = fs.readFileSync('.env', 'utf8');
const payload = {};

for (const key of KEYS) {
  const match = env.match(new RegExp('^' + key + '=(.*)$', 'm'));
  if (!match) throw new Error(`${key} is not set in .env`);

  let value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  if (!value) throw new Error(`${key} is empty in .env`);
  if (/\s/.test(value)) throw new Error(`${key} contains whitespace`);
  payload[key] = value;
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

console.log(
  'Done. Check with: node node_modules/wrangler/bin/wrangler.js secret list --name ' +
    WORKER,
);
