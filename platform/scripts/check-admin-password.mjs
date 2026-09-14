// Answers one question: does a password match the hash currently in .env?
//
// Run from the platform directory:
//   node scripts/check-admin-password.mjs
// then type the password and press Enter, Ctrl+Z, Enter. Or pipe it:
//   $s = Read-Host "password" -AsSecureString; [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)) | node scripts/check-admin-password.mjs
//
// This separates two failures that look identical at the sign-in form: a
// password that is not what you think it is, and a production secret that is
// out of step with .env. Nothing is written, uploaded or stored, and the
// password is not echoed.
import fs from 'node:fs';
import ts from 'typescript';

const code = ts.transpileModule(
  fs.readFileSync('lib/admin-password.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { verifyPassword } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);

const env = fs.readFileSync('.env', 'utf8');
const match = env.match(/^ADMIN_PASSWORD_HASH=(.*)$/m);
if (!match) throw new Error('ADMIN_PASSWORD_HASH is not set in .env');
let encoded = match[1].trim();
if (
  (encoded.startsWith('"') && encoded.endsWith('"')) ||
  (encoded.startsWith("'") && encoded.endsWith("'"))
) {
  encoded = encoded.slice(1, -1);
}

let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/[\r\n]+$/, '');
if (!password) throw new Error('No password was supplied on standard input.');

const iterations = /^pbkdf2:(\d+):/.exec(encoded)?.[1] ?? 'unknown';
const ok = await verifyPassword(password, encoded);

console.log(`hash in .env  : ${iterations} iterations`);
console.log(`password match: ${ok ? 'YES' : 'NO'}`);
console.log(
  ok
    ? 'This password is the one .env expects. If sign-in still fails, production is out of step: run scripts/push-admin-secrets.mjs and do not run configure-admin.mjs afterwards.'
    : 'This password is NOT the one .env expects. Set it again with scripts/configure-admin.mjs, then run scripts/push-admin-secrets.mjs, in that order.',
);
