// Run: node tests/admin-password.mjs
//
// These cover the failure that made production sign-in impossible while every
// local sign-in worked. Cloudflare Workers caps PBKDF2 at 100,000 iterations
// and throws NotSupportedError above it; Node has no such cap. A hash built at
// 600,000 therefore verified on this machine and made deriveBits throw inside
// the Worker, which the route's catch reported as a generic 500 with no clue
// as to the cause. Nothing in the suite covered the iteration count, so
// nothing caught it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const uri = (text) =>
  'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const compile = (text) =>
  ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

const { hashPassword, verifyPassword, passwordIterations } = await import(
  uri(compile(fs.readFileSync('lib/admin-password.ts', 'utf8')))
);

// The cap is the whole point of this file, so state it as a literal rather
// than importing the value and asserting it equals itself.
const WORKERS_MAX_PBKDF2_ITERATIONS = 100000;

assert.ok(
  passwordIterations <= WORKERS_MAX_PBKDF2_ITERATIONS,
  `hashes are generated at ${passwordIterations} iterations, which Cloudflare Workers refuses`,
);

const encoded = await hashPassword('a-correct-horse-battery-staple');
const parts = /^pbkdf2:(\d+):([a-f0-9]{32}):([a-f0-9]{64})$/.exec(encoded);
assert.ok(parts, `hash is not in the expected format: ${encoded}`);
assert.ok(
  Number(parts[1]) <= WORKERS_MAX_PBKDF2_ITERATIONS,
  'a new hash records an iteration count the Worker cannot compute',
);

assert.equal(
  await verifyPassword('a-correct-horse-battery-staple', encoded),
  true,
);
assert.equal(await verifyPassword('the-wrong-password', encoded), false);

// Two hashes of one password differ, so the salt is actually random.
const again = await hashPassword('a-correct-horse-battery-staple');
assert.notEqual(again, encoded, 'the salt is not random');
assert.equal(
  await verifyPassword('a-correct-horse-battery-staple', again),
  true,
);

// A hash above the cap must be refused rather than attempted. Left unchecked,
// deriveBits throws inside the Worker and the user is told to try again.
const overCap = encoded.replace(/^pbkdf2:\d+:/, 'pbkdf2:600000:');
assert.equal(
  await verifyPassword('a-correct-horse-battery-staple', overCap),
  false,
  'a hash above the Workers cap was accepted; it would throw in production',
);

// Malformed input must be rejected on shape, never by throwing.
for (const bad of [
  '',
  'pbkdf2:100000:short:short',
  'not-a-hash',
  `${encoded}\n`, // a trailing newline from a shell pipe
  `${encoded} `,
  'pbkdf2:100:' + parts[2] + ':' + parts[3], // implausibly few iterations
]) {
  assert.equal(
    await verifyPassword('a-correct-horse-battery-staple', bad),
    false,
    `accepted a malformed hash: ${JSON.stringify(bad)}`,
  );
}

// The deployed script must refuse to ship a hash the runtime cannot compute.
const pusher = fs.readFileSync('scripts/push-admin-secrets.mjs', 'utf8');
assert.match(
  pusher,
  /WORKERS_MAX_ITERATIONS\s*=\s*100000/,
  'push-admin-secrets.mjs no longer checks the iteration cap',
);

console.log('admin-password: all checks passed');
