import { zipSync, strToU8 } from 'fflate';
import { sourceCount, type StoredLead } from './lead-filters';

/**
 * Taking the lead queue out of the building.
 *
 * Three formats because they answer three different questions. CSV goes into
 * whatever someone already uses. XLSX is the one a person opens, so it gets a
 * header row that freezes and columns wide enough to read. PDF is the one you
 * send to somebody who is not going to import anything, so it is laid out as
 * one block per lead rather than a thirteen-column table nobody can follow.
 *
 * All three are written by hand. A spreadsheet library would be a megabyte in
 * a Worker for what is, underneath, a zip of five small XML files, and fflate
 * was already a dependency.
 */

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export const EXPORT_FORMATS: ExportFormat[] = ['csv', 'xlsx', 'pdf'];

export const CONTENT_TYPE: Record<ExportFormat, string> = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

export function isExportFormat(value: unknown): value is ExportFormat {
  return (
    typeof value === 'string' && EXPORT_FORMATS.includes(value as ExportFormat)
  );
}

const COLUMNS = [
  'Company',
  'Website',
  'Domain',
  'Status',
  'What they do',
  'Possible fit',
  'Emails',
  'Phones',
  'Other contacts',
  'Sources',
  'Source links',
  'Found',
  'Search run',
] as const;

/** Column widths in characters, for the spreadsheet. Prose needs room. */
const WIDTHS = [30, 34, 24, 14, 60, 60, 30, 22, 26, 9, 60, 20, 16];

function contacts(lead: StoredLead, kind: string) {
  return (lead.data?.contacts || [])
    .filter((contact) => contact?.kind === kind)
    .map((contact) => contact.value)
    .join(', ');
}

function otherContacts(lead: StoredLead) {
  return (lead.data?.contacts || [])
    .filter((contact) => contact?.kind !== 'email' && contact?.kind !== 'phone')
    .map((contact) => `${contact.kind}: ${contact.value}`)
    .join(', ');
}

function when(lead: StoredLead) {
  const stamp = lead.created_at || lead.updated_at;
  if (!stamp) return '';
  const date = new Date(stamp);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}

/** One row per lead, in the column order above. */
export function leadRow(lead: StoredLead): string[] {
  return [
    lead.company || '',
    lead.website || '',
    lead.domain || '',
    lead.status || '',
    lead.data?.description || '',
    lead.data?.opportunity || '',
    contacts(lead, 'email'),
    contacts(lead, 'phone'),
    otherContacts(lead),
    String(sourceCount(lead)),
    (lead.data?.sources || [])
      .map((source) => source?.url)
      .filter(Boolean)
      .join(' '),
    when(lead),
    lead.run_id || '',
  ];
}

/**
 * A leading =, +, - or @ makes a spreadsheet treat the cell as a formula, and
 * a company that calls itself "+234 Studios" should not execute on open. The
 * apostrophe is the documented way to force a literal and is not displayed.
 */
function deFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string): string {
  const safe = deFormula(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(leads: StoredLead[]): string {
  const lines = [COLUMNS.map(csvCell).join(',')];
  for (const lead of leads) lines.push(leadRow(lead).map(csvCell).join(','));
  // CRLF and a UTF-8 BOM, because Excel on Windows reads a plain LF UTF-8 file
  // as the system codepage and turns every accented name into mojibake.
  return '﻿' + lines.join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

function xmlEscape(value: string): string {
  return (
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      // Most control characters are illegal in XML 1.0 at any escaping, and one
      // in a scraped description would make the whole file unopenable. Matching
      // them is the entire point, so the rule against it does not apply here.
      // oxlint-disable-next-line no-control-regex
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  );
}

function sheetRow(index: number, cells: string[], style = ''): string {
  const columns = cells
    .map((cell, column) => {
      const ref = `${columnName(column)}${index}`;
      return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(deFormula(cell))}</t></is></c>`;
    })
    .join('');
  return `<row r="${index}">${columns}</row>`;
}

/** 0 -> A, 25 -> Z, 26 -> AA. Thirteen columns today, but not by luck. */
export function columnName(index: number): string {
  let name = '';
  let n = index;
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

export function toXlsx(leads: StoredLead[]): Uint8Array {
  const header = sheetRow(1, [...COLUMNS], ' s="1"');
  const body = leads
    .map((lead, index) => sheetRow(index + 2, leadRow(lead)))
    .join('');
  const cols = WIDTHS.map(
    (width, index) =>
      `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
  ).join('');
  const lastRow = leads.length + 1;

  const sheet =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetPr><outlinePr summaryBelow="1"/></sheetPr>` +
    `<dimension ref="A1:${columnName(COLUMNS.length - 1)}${lastRow}"/>` +
    // The header stays put while you scroll, and the whole range is filterable,
    // which is what anyone opening this immediately wants to do.
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${header}${body}</sheetData>` +
    `<autoFilter ref="A1:${columnName(COLUMNS.length - 1)}${lastRow}"/>` +
    `</worksheet>`;

  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="11"/><color rgb="FF14261A"/><name val="Calibri"/></font></fonts>` +
    `<fills count="3"><fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FFBDE997"/><bgColor indexed="64"/></patternFill></fill></fills>` +
    `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>` +
    `</styleSheet>`;

  return zipSync(
    {
      '[Content_Types].xml': strToU8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
          `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
          `<Default Extension="xml" ContentType="application/xml"/>` +
          `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
          `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
          `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
          `</Types>`,
      ),
      '_rels/.rels': strToU8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
          `</Relationships>`,
      ),
      'xl/workbook.xml': strToU8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
          `<sheets><sheet name="Leads" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ),
      'xl/_rels/workbook.xml.rels': strToU8(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
          `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
          `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
          `</Relationships>`,
      ),
      'xl/styles.xml': strToU8(styles),
      'xl/worksheets/sheet1.xml': strToU8(sheet),
    },
    // Stored rather than deflated keeps this dependency-light and fast; these
    // files are small enough that the saving would not pay for itself.
    { level: 6 },
  );
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

/**
 * Helvetica only, WinAnsi. Embedding a font to get wider coverage would mean
 * shipping a font file and writing a CID map, which is a lot of machinery for
 * a review document. Characters outside the encoding are transliterated rather
 * than dropped, so a name never silently loses a letter.
 */
function pdfText(value: string): string {
  return value
    .replace(/[‘’‛]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\xFF]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/** Rough width for Helvetica at a given size, good enough to wrap on. */
function wrap(value: string, size: number, maxWidth: number): string[] {
  const perChar = size * 0.5;
  const limit = Math.max(8, Math.floor(maxWidth / perChar));
  const lines: string[] = [];
  for (const paragraph of value.split(/\n+/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      // A single word longer than the line (a URL) is cut rather than allowed
      // to run off the page edge.
      if (word.length > limit) {
        if (line) lines.push(line);
        for (let i = 0; i < word.length; i += limit)
          lines.push(word.slice(i, i + limit));
        line = '';
        continue;
      }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= limit) line += ' ' + word;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

const PAGE_WIDTH = 595; // A4 at 72dpi
const PAGE_HEIGHT = 842;
const MARGIN = 48;
const TEXT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type Line = { text: string; size: number; bold: boolean; gap: number };

function leadLines(lead: StoredLead, index: number): Line[] {
  const row = leadRow(lead);
  const lines: Line[] = [
    { text: `${index + 1}. ${row[0]}`, size: 13, bold: true, gap: 17 },
    {
      text: [
        row[1],
        row[3] && `status: ${row[3]}`,
        row[11] && `found ${row[11]}`,
      ]
        .filter(Boolean)
        .join('   ·   '),
      size: 8.5,
      bold: false,
      gap: 15,
    },
  ];
  const block = (label: string, value: string) => {
    if (!value) return;
    lines.push({ text: label, size: 7.5, bold: true, gap: 11 });
    for (const line of wrap(value, 9.5, TEXT_WIDTH))
      lines.push({ text: line, size: 9.5, bold: false, gap: 12 });
    lines.push({ text: '', size: 9.5, bold: false, gap: 4 });
  };
  block('WHAT THEY DO', row[4]);
  block('POSSIBLE FIT', row[5]);
  const reach = [
    row[6] && `Email: ${row[6]}`,
    row[7] && `Phone: ${row[7]}`,
    row[8],
  ]
    .filter(Boolean)
    .join('   ');
  block('HOW TO REACH THEM', reach || 'No contact supported by the evidence.');
  block('EVIDENCE', `${row[9]} sources. ${row[10]}`);
  lines.push({ text: '', size: 9.5, bold: false, gap: 10 });
  return lines;
}

export function toPdf(
  leads: StoredLead[],
  title = 'Prospect leads',
): Uint8Array {
  const header: Line[] = [
    { text: pdfText(title), size: 20, bold: true, gap: 26 },
    {
      text: pdfText(
        `${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}  ·  exported ${new Date().toISOString().slice(0, 10)}  ·  Aksen Labs`,
      ),
      size: 9,
      bold: false,
      gap: 14,
    },
    {
      text: pdfText(
        'Public research, not verified buying intent. Public availability of a contact does not establish consent to marketing.',
      ),
      size: 8,
      bold: false,
      gap: 24,
    },
  ];

  const all = [
    ...header,
    ...leads.flatMap((lead, index) =>
      leadLines(lead, index).map((line) => ({
        ...line,
        text: pdfText(line.text),
      })),
    ),
  ];
  if (!leads.length)
    all.push({
      text: 'No leads matched the filters used for this export.',
      size: 10,
      bold: false,
      gap: 14,
    });

  // Paginate by accumulated height rather than a line count, since the sizes
  // differ; a fixed count would overflow on a lead with a long description.
  const pages: Line[][] = [];
  let page: Line[] = [];
  let y = 0;
  for (const line of all) {
    if (y + line.gap > PAGE_HEIGHT - MARGIN * 2) {
      pages.push(page);
      page = [];
      y = 0;
    }
    page.push(line);
    y += line.gap;
  }
  pages.push(page);

  const streams = pages.map((lines) => {
    let cursor = PAGE_HEIGHT - MARGIN;
    let out = '';
    for (const line of lines) {
      if (line.text)
        out +=
          `BT /${line.bold ? 'F2' : 'F1'} ${line.size} Tf ` +
          `1 0 0 1 ${MARGIN} ${(cursor - line.size).toFixed(2)} Tm ` +
          `(${line.text}) Tj ET\n`;
      cursor -= line.gap;
    }
    return out;
  });

  // Object layout: 1 catalog, 2 pages, 3 F1, 4 F2, then a page and a content
  // stream per page.
  const objects: string[] = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objects.push(
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] >>`,
  );
  objects.push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`,
  );
  objects.push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`,
  );
  streams.forEach((stream, index) => {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageIds[index] + 1} 0 R >>`,
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets)
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xref}\n%%EOF\n`;

  // latin1: every byte written above is already in 0-255, and encoding as UTF-8
  // instead would shift every xref offset past the first accented character and
  // make the file unopenable.
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

/** A filename that says what is inside without needing the download dialog. */
export function exportFilename(format: ExportFormat, count: number): string {
  const day = new Date().toISOString().slice(0, 10);
  return `aksen-leads-${day}-${count}.${format}`;
}
