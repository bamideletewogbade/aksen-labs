// Sets up the shared secret between the heartbeat timer and the Worker.
//
// Run from the platform directory:  node scripts/configure-automation.mjs
//
// It generates a new random secret, writes it to .env for local runs, uploads
// it to the deployed Worker, and writes the values GitHub needs to a local
// file. To rotate, run it again and repeat the paste.
//
// The secret is never printed to the terminal. The first version of this script
// did print it, and the value then ended up in an assistant's context the next
// time anyone read the terminal to check whether the upload worked. A file you
// open yourself has no such audience. It is named with a .env prefix so the
// existing .env* rule in .gitignore already covers it.
//
// Three things this exists to get right, two learned the hard way on the admin
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
  // The wrangler entry file, run directly. `npx wrangler` triggers a package
  // resolution that has already once emptied node_modules/.bin mid-task, and
  // no shell means no quoting rules to get wrong on Windows.
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
  fs.rmSync(file, { force: true });
}

const TICK_URL =
  'https://sites-project.bishoptewogbade.workers.dev/api/automation/tick';
const handoff = '.env.automation-github-secrets';

fs.writeFileSync(
  handoff,
  `Paste these two into the repository secrets, then delete this file.
https://github.com/bamideletewogbade/aksen-labs/settings/secrets/actions

AUTOMATION_SECRET
${secret}

AUTOMATION_TICK_URL
${TICK_URL}
`,
);

console.log(`
Uploaded ${KEY} to the ${WORKER} Worker.

The two values GitHub needs are in ${handoff}, deliberately not on screen.
Open it, paste both at the link inside, then delete it. Run this script again
to rotate, which replaces the Worker secret and this file together.
`);
