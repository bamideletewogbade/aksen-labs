import fs from 'node:fs';
import ts from 'typescript';
import { neon } from '@neondatabase/serverless';
const code = ts.transpileModule(
  fs.readFileSync('lib/admin-password.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { hashPassword } = await import(
  'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
);
let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/[\r\n]+$/, '');
if (!password || password.length > 200)
  throw new Error('Provide the password through standard input.');
process.loadEnvFile('.env');
const q = neon(process.env.DATABASE_URL);
await q.transaction(
  fs
    .readFileSync('db/admin-session-migration.sql', 'utf8')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => q.query(s)),
);
const settings = {
  ADMIN_EMAILS: 'bishoptewogbade@gmail.com',
  ADMIN_OWNER_ID: 'local_seedy',
  ADMIN_PASSWORD_HASH: await hashPassword(password),
};
let env = fs.readFileSync('.env', 'utf8');
for (const [key, value] of Object.entries(settings)) {
  const line = key + '=' + JSON.stringify(value);
  const pattern = new RegExp('^' + key + '=.*$', 'm');
  env = pattern.test(env)
    ? env.replace(pattern, () => line)
    : env.trimEnd() + '\n' + line + '\n';
}
fs.writeFileSync('.env', env);
console.log(
  'Admin email and salted password hash configured. Existing workspace identity retained. No plaintext password saved.',
);
