// Sets up the shared secret between the heartbeat timer and the Worker.
//
// Run from the platform directory:  node scripts/configure-automation.mjs
//
// It generates a new random secret, writes it to .env for local runs, uploads
// it to the deployed Worker, and prints it once so it can be pasted into the
// GitHub repository secret the workflow reads. Nothing else ever needs to know
// it, and nothing prints it again: to rotate, run this and repeat the paste.
//
// Two things this exists to get right, both learned the hard way on the admin
// secrets:
//
// 1. .env wraps values in quotes and dotenv strips them. wrangler does not, so
//    a quoted value uploads with the quotes still attached and never matches.
//    `wrangler secret bulk` takes exact JSON values, which sidesteps both that
//    and the trailing newline a shell pipe would append.
//
// 2. The endpoint compares the secret in constant time against an exact string.
//    Any stray whitespace is a mismatch that reads as "Not authorized" with
//    nothing in the logs explaining which side is wrong.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const WORKER = 'sites-project';
const KEY = 'AUTOMATION_SECRET';

if (!fs.existsSync('.env'))
  throw new Error('Run this from the platform directory, where .env lives.');

const secret = crypto.randomBytes(32).toString('base64url');

// Replace the line if it is already there, otherwise append. Rewriting the file
// wholesale would lose every other secret in it.
const env = fs.readFileSync('.env', 'utf8');
const line = `${KEY}="${secret}"`;
const updated = new RegExp(`^${KEY}=.*$`, 'm').test(env)
  ? env.replace(new RegExp(`^${KEY}=.*$`, 'm'), line)
  : `${env.endsWith('\n') ? env : env + '\n'}${line}\n`;
fs.writeFileSync('.env', updated);
console.log(`Wrote ${KEY} to .env`);

const file = path.join(os.tmpdir(), `automation-secret-${Date.now()}.json`);
fs.writeFileSync(file, JSON.stringify({ [KEY]: secret }));
try {
  execFileSync('npx', ['wrangler', 'secret', 'bulk', file, '--name', WORKER], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
} finally {
  fs.rmSync(file, { force: true });
}

console.log(`
Uploaded ${KEY} to the ${WORKER} Worker.

Two repository secrets finish the wiring, at
https://github.com/bamideletewogbade/aksen-labs/settings/secrets/actions

  AUTOMATION_SECRET      ${secret}
  AUTOMATION_TICK_URL    https://sites-project.bishoptewogbade.workers.dev/api/automation/tick

That value is printed once. Run this script again to rotate it, and paste the
new one into the same place.
`);
