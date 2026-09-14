// Run: node tests/lead-export.mjs
//
// An export is the one thing here that leaves the building, and a file that
// looks fine in a preview and is rejected by Excel is worse than no export at
// all. These check the two things that actually break: escaping, and whether
// the container is structurally valid.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import url from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';

// Compiled to real files rather than data: URLs. lead-export imports fflate,
// and a data: module cannot resolve a bare specifier, so it has to sit
// somewhere node_modules resolution can reach.
const dir = 'tests/.tmp';
fs.mkdirSync(dir, { recursive: true });
const compile = (file, name, strip = []) => {
  let out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  for (const [from, to] of strip) out = out.replace(from, to);
  const path = `${dir}/${name}`;
  fs.writeFileSync(path, out);
  return path;
};

compile('lib/lead-filters.ts', 'lead-filters.mjs', [
  [/from '\.\/prospect-evidence';?/, ''],
]);
const exporterPath = compile('lib/lead-export.ts', 'lead-export.mjs', [
  [/from '\.\/lead-filters'/, `from './lead-filters.mjs'`],
]);

const {
  toCsv,
  toXlsx,
  toPdf,
  leadRow,
  columnName,
  isExportFormat,
  exportFilename,
} = await import(url.pathToFileURL(exporterPath).href);

const lead = (over = {}) => ({
  id: 'a',
  company: 'Ansaah Realty',
  website: 'https://ansaahrealty.com',
  domain: 'ansaahrealty.com',
  status: 'new',
  run_id: 'run-2',
  created_at: '2026-09-14T09:00:00Z',
  opportunity_id: null,
  data: {
    description: 'Real estate in East Legon, Accra',
    opportunity: 'Property management systems',
    contacts: [
      { kind: 'email', value: 'info@ansaahrealty.com' },
      { kind: 'phone', value: '+233200000000' },
      { kind: 'linkedin', value: 'ansaah' },
    ],
    sources: [{ url: 'https://a.example' }, { url: 'https://b.example' }],
  },
  ...over,
});

// ---- the row is the contract every format shares ----
const row = leadRow(lead());
assert.equal(row.length, 13);
assert.equal(row[0], 'Ansaah Realty');
assert.equal(row[6], 'info@ansaahrealty.com');
assert.equal(row[7], '+233200000000');
assert.equal(
  row[8],
  'linkedin: ansaah',
  'other contacts should keep their kind',
);
assert.equal(row[9], '2');
assert.equal(row[11], '2026-09-14');

// ---- CSV escaping ----
const csv = toCsv([
  lead({
    company: 'Quote "Co", Ltd',
    data: { ...lead().data, description: 'Line one\nLine two' },
  }),
]);
assert.ok(csv.startsWith('﻿'), 'Excel needs the BOM to read UTF-8');
assert.ok(csv.includes('"Quote ""Co"", Ltd"'), 'quotes must be doubled');
assert.ok(csv.includes('"Line one\nLine two"'), 'newlines must stay quoted');
assert.ok(csv.includes('\r\n'), 'rows are CRLF separated');

// A cell starting with a formula character must not execute on open. This is
// the difference between an export and a way to run code on someone's laptop.
for (const dangerous of ['=1+1', '+234 Studios', '-5', '@SUM(A1)']) {
  const out = toCsv([lead({ company: dangerous })]);
  assert.ok(
    out.includes(`'${dangerous}`) || out.includes(`"'${dangerous}`),
    `${dangerous} was not neutralised`,
  );
}

// An empty export still has to be a valid file with its header.
const empty = toCsv([]);
assert.ok(empty.includes('Company,Website'), 'header survives an empty export');

// ---- XLSX is a zip of the parts Excel requires ----
const xlsx = toXlsx([lead(), lead({ id: 'b', company: 'Aducraft' })]);
assert.ok(xlsx instanceof Uint8Array);
assert.equal(xlsx[0], 0x50, 'a zip starts with PK');
assert.equal(xlsx[1], 0x4b);
const parts = unzipSync(xlsx);
for (const required of [
  '[Content_Types].xml',
  '_rels/.rels',
  'xl/workbook.xml',
  'xl/_rels/workbook.xml.rels',
  'xl/styles.xml',
  'xl/worksheets/sheet1.xml',
])
  assert.ok(parts[required], `xlsx is missing ${required}`);

const sheet = strFromU8(parts['xl/worksheets/sheet1.xml']);
assert.ok(sheet.includes('<row r="1">'), 'header row');
assert.ok(sheet.includes('<row r="3">'), 'both leads present');
assert.ok(sheet.includes('Aducraft'));
assert.ok(sheet.includes('state="frozen"'), 'header should stay put');
assert.ok(sheet.includes('autoFilter'), 'the range should be filterable');

// XML escaping, and the control character that would make the file unopenable.
const nasty = strFromU8(
  unzipSync(toXlsx([lead({ company: 'A & B <Ltd> "x"' })]))[
    'xl/worksheets/sheet1.xml'
  ],
);
assert.ok(nasty.includes('A &amp; B &lt;Ltd&gt;'), 'XML must be escaped');
// oxlint-disable-next-line no-control-regex -- asserting their absence needs the class
assert.ok(!/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(nasty), 'control chars must go');

assert.equal(columnName(0), 'A');
assert.equal(columnName(25), 'Z');
assert.equal(columnName(26), 'AA');
assert.equal(columnName(27), 'AB');

// ---- PDF structure ----
const pdf = toPdf([lead()]);
const text = Buffer.from(pdf).toString('latin1');
assert.ok(text.startsWith('%PDF-1.4'), 'must announce itself as a PDF');
assert.ok(text.trimEnd().endsWith('%%EOF'), 'must be terminated');
assert.ok(text.includes('/Type /Catalog'));
assert.ok(text.includes('Ansaah Realty'));

// The xref offsets are the part that silently breaks. Every one must land on
// the object it claims, or readers reject the file.
const startxref = Number(text.match(/startxref\s+(\d+)/)[1]);
assert.equal(
  text.slice(startxref, startxref + 4),
  'xref',
  'startxref must point at the xref table',
);
const offsets = [...text.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) =>
  Number(m[1]),
);
assert.ok(offsets.length >= 6, 'expected an entry per object');
offsets.forEach((offset, index) => {
  assert.ok(
    text.slice(offset).startsWith(`${index + 1} 0 obj`),
    `xref entry ${index + 1} points at the wrong byte`,
  );
});

// Parentheses and backslashes end a PDF string early if they are not escaped.
const risky = Buffer.from(
  toPdf([lead({ company: 'Smith (Ghana) \\ Co' })]),
).toString('latin1');
assert.ok(
  risky.includes('Smith \\(Ghana\\) \\\\ Co'),
  'PDF strings must escape',
);

// A long description has to paginate rather than run off the bottom.
const many = toPdf(
  Array.from({ length: 25 }, (_, i) =>
    lead({ id: `x${i}`, company: `Co ${i}` }),
  ),
);
const pageCount = (
  Buffer.from(many)
    .toString('latin1')
    .match(/\/Type \/Page[^s]/g) || []
).length;
assert.ok(pageCount > 1, 'twenty-five leads should not fit on one page');
assert.ok(
  Buffer.from(many)
    .toString('latin1')
    .includes('/Count ' + pageCount),
  'the page count must match the number of page objects',
);

// An empty export is still a readable document, not a broken one.
const none = Buffer.from(toPdf([])).toString('latin1');
assert.ok(none.includes('No leads matched'), 'empty export should say so');
assert.ok(none.trimEnd().endsWith('%%EOF'));

// ---- odds and ends ----
assert.ok(
  isExportFormat('csv') && isExportFormat('xlsx') && isExportFormat('pdf'),
);
assert.ok(!isExportFormat('exe'));
assert.ok(!isExportFormat(''));
assert.match(
  exportFilename('csv', 4),
  /^aksen-leads-\d{4}-\d{2}-\d{2}-4\.csv$/,
);

// ---- malformed data must not throw; an export that crashes loses the lot ----
for (const broken of [
  { ...lead(), data: {} },
  { ...lead(), data: { contacts: null, sources: null } },
  { ...lead(), data: undefined },
  { ...lead(), company: undefined, created_at: 'not-a-date' },
]) {
  assert.doesNotThrow(() => toCsv([broken]), 'csv threw');
  assert.doesNotThrow(() => toXlsx([broken]), 'xlsx threw');
  assert.doesNotThrow(() => toPdf([broken]), 'pdf threw');
}

fs.rmSync(dir, { recursive: true, force: true });

console.log('lead-export: all checks passed');
