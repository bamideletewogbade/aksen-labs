// Run: pnpm test          every file in tests/
//      pnpm test lead     only files whose name contains "lead"
//
// The suite is plain node scripts with no framework, which is a good trade at
// this size: a test is a file you can read top to bottom and run on its own.
// What it lacked was a way to run all of them, so the answer to "is the suite
// green" was a loop somebody typed from memory, and in practice nobody did.
//
// Serial on purpose. Several files open a Neon connection, and running them at
// once made the pool refuse roughly a fifth of them with a bare "fetch failed",
// which reads exactly like a broken test and is not one.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const filter = process.argv[2];
const files = fs
  .readdirSync('tests')
  .filter((name) => name.endsWith('.mjs'))
  .filter((name) => !filter || name.includes(filter))
  .sort();

if (files.length === 0) {
  console.error(
    filter ? `No test matches "${filter}".` : 'No tests found in tests/.',
  );
  process.exit(1);
}

const run = (file) =>
  new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join('tests', file)], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let output = '';
    child.stdout.on('data', (chunk) => (output += chunk));
    child.stderr.on('data', (chunk) => (output += chunk));
    child.on('close', (code) => resolve({ code, output }));
  });

// A cold Neon endpoint refuses the first connection and accepts the next one.
// Retried once, and only for that, so a test that genuinely fails is reported
// the first time rather than being given two chances to pass by accident.
const transient = (result) =>
  result.code !== 0 && /Error connecting to database/.test(result.output);

const failed = [];
const started = Date.now();

for (const file of files) {
  let result = await run(file);
  let note = '';
  if (transient(result)) {
    await new Promise((wake) => setTimeout(wake, 1500));
    result = await run(file);
    if (result.code === 0) note = ' (retried: database was cold)';
  }
  if (result.code === 0) {
    console.log(`  ok   ${file}${note}`);
  } else {
    console.log(`  FAIL ${file}`);
    failed.push({ file, output: result.output.trimEnd() });
  }
}

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(`\n${files.length - failed.length}/${files.length} in ${seconds}s`);

for (const { file, output } of failed) {
  console.log(`\n--- ${file} ---\n${output}`);
}

process.exit(failed.length === 0 ? 0 : 1);
