// Query checks use transaction-local tables. No business records are edited.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { neon } from '@neondatabase/serverless';
import { PgDialect } from 'drizzle-orm/pg-core';

const require = createRequire(import.meta.url);
const captured = [];
globalThis.__dailyWorkTestDb = {
  execute(query) {
    captured.push(query);
    return Promise.resolve({ rows: [] });
  },
};
let source = ts.transpileModule(
  readFileSync('lib/daily-work-data.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
source = source.replace(
  /import\s*\{\s*getDb\s*\}\s*from\s*['"]@\/db['"];?/,
  'const getDb = () => globalThis.__dailyWorkTestDb;',
);
source = source.replace(
  /from ['"]drizzle-orm['"]/g,
  `from '${pathToFileURL(require.resolve('drizzle-orm')).href}'`,
);
source = source.replace(
  /from ['"]@\/([^'"]+)['"]/g,
  (_, path) => `from '${pathToFileURL(resolve(`${path}.ts`)).href}'`,
);
const { dailyWork } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
await dailyWork('owner', '2026-10-10');
delete globalThis.__dailyWorkTestDb;
assert.equal(captured.length, 4);

process.loadEnvFile('.env');
const client = neon(process.env.E2E_DATABASE_URL || process.env.DATABASE_URL);
const dialect = new PgDialect();
const setup = [
  'CREATE TEMP TABLE opportunities(id text,company text,name text,status text,next_action text,follow_up_at date,owner_id text,created_at timestamptz DEFAULT now()) ON COMMIT DROP',
  'CREATE TEMP TABLE projects(id text PRIMARY KEY,name text,stage text,health text,progress int,next_gate text,owner_id text,updated_at timestamptz DEFAULT now()) ON COMMIT DROP',
  'CREATE TEMP TABLE project_items(project_id text,status text,due_at timestamptz) ON COMMIT DROP',
  'CREATE TEMP TABLE business_workspaces(id text PRIMARY KEY,owner_id text,name text) ON COMMIT DROP',
  'CREATE TEMP TABLE business_financials(id text,business_id text,kind text,status text,number text,currency text,total_minor int,paid_minor int,details jsonb,created_at timestamptz DEFAULT now()) ON COMMIT DROP',
  `INSERT INTO opportunities(id,company,name,status,next_action,follow_up_at,owner_id) VALUES
    ('open','Demo','Person','qualified','Call','2026-10-09','owner'),
    ('unassigned','Demo','Person','new','Review',NULL,NULL),
    ('closed','Demo','Person','won','Done','2026-01-01','owner'),
    ('private','Private','Other','new','Review','2026-01-01','other')`,
  `INSERT INTO projects(id,name,stage,health,progress,next_gate,owner_id) VALUES
    ('active','Demo','delivery','on_track',100,'Client review','owner'),
    ('accepted','Demo care','accepted','on_track',100,'Handover','owner'),
    ('closed','Old','closed','on_track',100,'Done','owner'),
    ('private','Private','delivery','on_track',0,'Private','other')`,
  `INSERT INTO project_items VALUES ('active','done','2026-01-01'),('active','blocked','2026-10-08'),('active','open','2026-10-12')`,
  `INSERT INTO business_workspaces VALUES ('client','owner','Demo'),('foreign','other','Private')`,
  `INSERT INTO business_financials(id,business_id,kind,status,number,currency,total_minor,paid_minor,details,created_at) VALUES
    ('receipt','client','receipt','issued','R-1','GHS',60000,60000,'{}','2025-01-01'),
    ('draft-receipt','client','receipt','draft','R-2','GHS',999,999,'{}',now()),
    ('void-receipt','client','receipt','void','R-3','GHS',999,999,'{}',now()),
    ('invoice','client','invoice','issued','I-1','GHS',100000,60000,'{"dueDate":"2026-10-09"}',now()),
    ('fully-paid-issued','client','invoice','issued','I-2','GHS',1000,1000,'{}',now()),
    ('paid','client','invoice','paid','I-3','GHS',60000,60000,'{}',now()),
    ('draft','client','invoice','draft','I-4','GHS',999,0,'{}',now()),
    ('void','client','invoice','void','I-5','GHS',999,0,'{}',now()),
    ('estimate','client','proforma','issued','P-1','GHS',999,0,'{}',now()),
    ('usd','client','receipt','issued','R-4','USD',2500,2500,'{}',now()),
    ('foreign','foreign','receipt','issued','PRIVATE','GHS',990000,990000,'{}',now())`,
].map((sql) => client.query(sql));
const results = await client.transaction([
  ...setup,
  ...captured.map((query) => {
    const compiled = dialect.sqlToQuery(query);
    return client.query(compiled.sql, compiled.params);
  }),
]);
const [leads, projects, totals, invoices] = results.slice(-4);
assert.equal(leads.length, 2);
assert.equal(leads[0].due_count, 1);
assert.ok(!leads.some((row) => row.id === 'private'));
assert.equal(projects.length, 2);
const active = projects.find((row) => row.id === 'active');
assert.equal(active.blocked, 1);
assert.equal(
  active.due_at,
  '2026-10-08',
  'completed tasks cannot create overdue work',
);
assert.equal(projects[0].full_count, 2);
assert.deepEqual(
  totals.map((row) => ({
    currency: row.currency,
    collected: Number(row.collected),
    outstanding: Number(row.outstanding),
    invoices: row.invoice_count,
  })),
  [
    { currency: 'GHS', collected: 60000, outstanding: 40000, invoices: 1 },
    { currency: 'USD', collected: 2500, outstanding: 0, invoices: 0 },
  ],
);
assert.equal(invoices.length, 1);
assert.equal(invoices[0].balance, 40000);
assert.equal(invoices[0].id, 'invoice');
console.log(
  'PASS real SQL: owner isolation, all-time issued receipts, partial balances, separate currencies, draft/void exclusions and unfinished delivery dates; temporary tables only',
);
