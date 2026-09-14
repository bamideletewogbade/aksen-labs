import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { PgDialect } from 'drizzle-orm/pg-core';
import { calculateLines, minorUnits, validDate } from '../lib/workspace-rules.ts';
import { paymentQuery } from '../lib/financial-payment.ts';

assert.equal(minorUnits('0.29'), 29);
assert.equal(validDate('2026-02-31'), false);
assert.equal(validDate('2028-02-29'), true);
assert.equal(minorUnits('85000'), 8500000);
assert.throws(() => minorUnits('1.999'));
assert.throws(() => minorUnits('-2'));
assert.throws(() => minorUnits('1e3'));
assert.equal(calculateLines([{description:'Discovery',quantity:3,unitPrice:'0.10'}]).total,30);
assert.throws(() => calculateLines([{description:'Bad quantity',quantity:1.1,unitPrice:'2'}]));
assert.throws(() => calculateLines([{description:'Overflow',quantity:10000,unitPrice:'9999999'}]));
if (!process.argv.includes('--database')) { console.log('PASS: exact money conversion, total calculation and invalid amount rejection.'); process.exit(0); }
process.loadEnvFile('.env'); const q = neon(process.env.DATABASE_URL); const dialect = new PgDialect();
const schema = readFileSync('db/workspace-migration.sql','utf8').split(';').map(s=>s.trim()).filter(s=>s.startsWith('CREATE TABLE')).map(s=>s.replace('CREATE TABLE IF NOT EXISTS','CREATE TEMP TABLE')+' ON COMMIT DROP');
const setup = () => [
  q.query('CREATE TEMP TABLE projects(id text PRIMARY KEY) ON COMMIT DROP'),
  ...schema.map(s=>q.query(s)),
  q.query('CREATE TEMP TABLE audit_events(id text PRIMARY KEY,actor_id text,actor_type text,action text,entity_type text,entity_id text) ON COMMIT DROP'),
  q`INSERT INTO business_workspaces(id,owner_id,name) VALUES('business','tester','Synthetic temporary test')`,
  q`INSERT INTO business_financials(id,business_id,kind,number,status,currency,total_minor,details) VALUES('invoice','business','invoice','INV-TEST','issued','NGN',10000,'{}')`,
];
function payment(amount, reference, opts={}) { const compiled=dialect.sqlToQuery(paymentQuery({ id:crypto.randomUUID(),auditId:crypto.randomUUID(),actorId:'tester',businessId:'business',financialId:'invoice',amount,reference,date:'2026-09-06',number:crypto.randomUUID(),...opts })); return q.query(compiled.sql,compiled.params); }
let results=await q.transaction([...setup(),payment(4000,'part-one'),q`SELECT paid_minor,status FROM business_financials WHERE id='invoice'`,payment(6000,'part-two'),q`SELECT paid_minor,status FROM business_financials WHERE id='invoice'`,q`SELECT count(*)::int AS count FROM business_financials WHERE kind='receipt'`,q`SELECT count(*)::int AS count FROM audit_events`]);
assert.deepEqual(results.at(-5)[0],{paid_minor:4000,status:'issued'});
assert.deepEqual(results.at(-3)[0],{paid_minor:10000,status:'paid'});
assert.equal(results.at(-2)[0].count,2); assert.equal(results.at(-1)[0].count,2);
results=await q.transaction([...setup(),payment(10001,'over'),payment(1,'wrong-business',{businessId:'other'}),q`SELECT paid_minor FROM business_financials WHERE id='invoice'`]);
assert.equal(results.at(-1)[0].paid_minor,0);
await assert.rejects(q.transaction([...setup(),payment(1000,'duplicate'),payment(1000,'duplicate')]), /unique|duplicate/i);
await assert.rejects(q.transaction([...setup(),q.query("ALTER TABLE audit_events ADD CHECK (action <> 'payment.recorded')"),payment(1000,'audit-failure')]), /check|constraint/i);
console.log('PASS: temporary-table partial/full payment, receipt/audit creation, overpayment, wrong business, duplicate reference and audit failure. No real financial records changed.');


