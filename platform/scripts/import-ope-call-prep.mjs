// Run: node scripts/import-ope-call-prep.mjs
//
// Puts the current call prep for Ope into her workspace in the admin, so the
// platform holds the deal rather than a folder on one laptop. Re-running it
// replaces the document's content, not duplicates it: the file in
// clients/opes-tfs is the source, the workspace copy follows it.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const q = neon(process.env.DATABASE_URL);

const file = 'call-prep-2026-09-29.md';
const title = 'Call prep, 29 September 2026';
const content = readFileSync(`../clients/opes-tfs/${file}`, 'utf8');

// Matched loosely: the workspace was created in the UI and its name carries a
// middle dot that has been mangled by one Windows tool or another before.
const workspaces =
  await q`SELECT id, name FROM business_workspaces WHERE name ILIKE 'Ope%TFS%'`;
if (workspaces.length !== 1)
  throw new Error(
    `Expected one Ope TFS workspace, found ${workspaces.length}. Nothing written.`,
  );
const businessId = workspaces[0].id;

const updated =
  await q`UPDATE business_documents SET content=${content}, filename=${file}, file_base64=${Buffer.from(content).toString('base64')} WHERE business_id=${businessId} AND title=${title} RETURNING id`;
if (!updated.length)
  await q`INSERT INTO business_documents(id,business_id,title,kind,content,evidence_status,filename,file_base64) VALUES (${crypto.randomUUID()},${businessId},${title},'note',${content},'internal',${file},${Buffer.from(content).toString('base64')})`;

console.log(
  `${updated.length ? 'Updated' : 'Added'} "${title}" in workspace "${workspaces[0].name}".`,
);
