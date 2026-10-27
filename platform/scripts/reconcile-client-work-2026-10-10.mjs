// Founder-authorized reconciliation. Default is a preview; --apply records it once.
// No invoices, external sends, provider calls or client acceptance are created.
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const q = neon(process.env.DATABASE_URL);
const owner = process.env.ADMIN_OWNER_ID;
if (!owner) throw new Error('ADMIN_OWNER_ID is required.');
const batch = 'client-work-2026-10-10';
const auditId = `${batch}:${owner}`;
const prior = await q`SELECT id FROM audit_events WHERE id=${auditId}`;
if (prior.length) {
  console.log('This reconciliation is already recorded. Nothing changed.');
  process.exit(0);
}
const existing =
  await q`SELECT id,name FROM projects WHERE owner_id=${owner} AND (lower(client_name) LIKE '%notjustlines%' OR lower(name) LIKE '%notjustlines%')`;
if (existing.length !== 1)
  throw new Error('Expected exactly one existing notjustlines project.');
const sethMatch =
  await q`SELECT id FROM projects WHERE owner_id=${owner} AND (lower(client_name) LIKE '%seth%' OR lower(name) LIKE '%dinero%' OR lower(name) LIKE '%otc%')`;
if (sethMatch.length)
  throw new Error(
    'A Seth/OTC project now exists. Reconcile manually rather than duplicate.',
  );
const businessMatch =
  await q`SELECT id FROM business_workspaces WHERE owner_id=${owner} AND (lower(name) LIKE '%notjustlines%' OR lower(name) LIKE '%dinero%' OR lower(name) LIKE '%seth%')`;
if (businessMatch.length)
  throw new Error(
    'A matching client workspace now exists. Review before importing.',
  );
const clients = [
  {
    key: 'seth-dinero-yard',
    name: 'Seth / Dinero-Yard',
    project: 'seth-dinero-yard-susu',
    amount: 60000,
    settlement: 'full',
    paymentDate: '2026-10-10',
    context:
      'Aksen Labs client implementation. Founder reports build completed and GHS 600 cash paid in full on 10 October 2026. Susu savings is the priority; WhatsApp/LLM work is secondary. Handover and formal acceptance remain to record.',
    tasks: [
      [
        'decision',
        'Prioritize Susu savings',
        'done',
        'Founder reports Seth values Susu more than WhatsApp/LLM functionality.',
      ],
      [
        'deliverable',
        'Complete the Dinero-Yard build',
        'done',
        'Founder reports work finished on 10 October 2026. Source reviewed at fd3cedf; not a live acceptance test.',
      ],
      [
        'task',
        'Record GHS 600 cash, paid in full',
        'done',
        'Founder report, evening of 10 October 2026. No invoice or provider verification implied.',
      ],
      [
        'task',
        'Walk Seth through the daily Susu flow',
        'open',
        'Saver setup, contribution, paid-day history, early money taken, withdrawal, month-end payout and rollover.',
      ],
      [
        'task',
        'Confirm handover and client acceptance',
        'open',
        'Confirm access, notification policy, reconciliation, corrections and backup process. Record actual acceptance separately.',
      ],
      [
        'decision',
        'Agree any care or next change separately',
        'open',
        'No support retainer, provider allowance or new delivery date has been agreed in this update.',
      ],
    ],
  },
  {
    key: 'notjustlines',
    name: 'notjustlines',
    project: existing[0].id,
    amount: 150000,
    settlement: 'unknown',
    paymentDate: '',
    context:
      'Aksen Labs website client. Founder reports 1,500 cash collected, interpreted as GHS from the Ghana/cedi context on 10 October 2026. Agreed total fee, remaining balance and exact collection date unconfirmed. Existing project remains awaiting client feedback.',
    tasks: [
      [
        'task',
        'Record GHS 1,500 cash collection',
        'done',
        'Founder report on 10 October 2026; currency interpreted as GHS. Total fee and balance unconfirmed.',
      ],
      [
        'task',
        'Review client feedback on the website',
        'open',
        'Existing project was waiting for feedback. Confirm final content, imagery and enquiry handoff.',
      ],
      [
        'decision',
        'Confirm total fee and remaining balance',
        'open',
        'Do not infer full payment from the amount collected. Confirm currency and exact payment date when reconciling.',
      ],
      [
        'task',
        'Record acceptance and handover',
        'open',
        'Only record acceptance, launch verification and care terms when confirmed.',
      ],
    ],
  },
];
console.log(
  JSON.stringify(
    clients.map((c) => ({
      client: c.name,
      project: c.project,
      currency: 'GHS',
      cashReceived: c.amount / 100,
      settlement: c.settlement,
    })),
    null,
    2,
  ),
);
if (!process.argv.includes('--apply')) {
  console.log('Preview only. Pass --apply to record.');
  process.exit(0);
}

// The unique audit insert rolls back the whole transaction on a concurrent repeat.
const writes = [
  q`INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id,details) VALUES(${auditId},${owner},'user','client_work.reconciled','workspace',${batch},${JSON.stringify({ source: 'Direct founder instruction in Codex, 10 October 2026', cashMinor: 210000, currency: 'GHS', providerVerified: false })}::jsonb)`,
];
for (const client of clients) {
  const business = `${batch}:${client.key}:${owner}`;
  const content = readFileSync(
    new URL(`../../clients/${client.key}/README.md`, import.meta.url),
    'utf8',
  );
  writes.push(
    q`INSERT INTO business_workspaces(id,owner_id,name,stage,currency,context) VALUES(${business},${owner},${client.name},'client','GHS',${client.context})`,
  );
  if (client.key === 'seth-dinero-yard') {
    writes.push(
      q`INSERT INTO projects(id,name,client_name,stage,health,progress,owner_id,objective,next_gate,budget_cents) VALUES(${client.project},'Dinero-Yard / Susu savings','Seth','delivery','on_track',100,${owner},'Completed client build, founder-reported. Prioritize Susu savings operations; WhatsApp/LLM functionality is secondary.','Confirm Susu operator handover and formal client acceptance; GHS 600 paid in full.',60000)`,
    );
  } else {
    writes.push(
      q`UPDATE projects SET name='notjustlines / website',client_name='notjustlines',objective='Architecture, construction and interiors website. Source includes service and inspiration pages plus explicit WhatsApp/email enquiry handoff.',next_gate='Review client feedback; confirm total fee and remaining balance after the GHS 1,500 cash collection.',updated_at=now() WHERE id=${client.project} AND owner_id=${owner}`,
    );
  }
  writes.push(
    q`INSERT INTO business_documents(id,business_id,project_id,title,kind,content,evidence_status,filename,file_base64) VALUES(${`${business}:record`},${business},${client.project},'Client delivery and payment record / 10 October 2026','note',${content},'internal','client-record-2026-10-10.md',${Buffer.from(content).toString('base64')})`,
  );
  const details = {
    seller: 'Aksen Labs',
    buyer: client.name,
    lines: [
      {
        description:
          client.key === 'seth-dinero-yard'
            ? 'Dinero-Yard build: cash settlement'
            : 'Website work: cash collected',
        quantity: 1,
        unitMinor: client.amount,
      },
    ],
    terms:
      'Internal record of cash already collected. No invoice issuance or external delivery implied.',
    dueDate: '',
    notes: client.context,
    paymentDate: client.paymentDate,
    reportedOn: '2026-10-10',
    paymentMethod: 'cash',
    settlement: client.settlement,
    source: 'Founder report in Codex',
    recordedBy: owner,
    providerVerified: false,
  };
  writes.push(
    q`INSERT INTO business_financials(id,business_id,project_id,kind,number,status,currency,total_minor,details,payment_reference,issued_at) VALUES(${`${business}:receipt`},${business},${client.project},'receipt',${client.key === 'seth-dinero-yard' ? 'CASH-20261010-SETH' : 'CASH-20261010-NJL'},'issued','GHS',${client.amount},${JSON.stringify(details)}::jsonb,${`founder-report:${batch}:${client.key}`},now())`,
  );
  for (const [index, item] of client.tasks.entries()) {
    const [kind, title, status, evidence] = item;
    writes.push(
      q`INSERT INTO project_items(id,project_id,kind,title,status,description,evidence,owner_id) VALUES(${`${business}:item:${index}`},${client.project},${kind},${title},${status},${evidence},${status === 'done' ? evidence : null},${owner})`,
    );
  }
}
await q.transaction(writes);
console.log(
  'Recorded both client workspaces, linked documents, project steps and two cash receipts. No invoices or messages created.',
);
