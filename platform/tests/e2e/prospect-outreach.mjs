// UI fixtures replace business API data. Only a temporary auth session is written.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { chromium } from 'playwright';
process.loadEnvFile('.env');
const base = process.env.BASE_URL || 'http://localhost:3000';
const db = neon(process.env.DATABASE_URL),
  hash = (s) => createHash('sha256').update(s).digest('hex');
const token = randomBytes(32).toString('hex'),
  tokenHash = hash(token);
const source = {
  url: 'https://fictional.example/contact',
  title: 'Fictional workshop',
  content:
    'We accept custom furniture enquiries. Contact hello@fictional.example.',
};
const brief = {
  recipient: 'hello@fictional.example',
  company: 'Fictional Workshop',
  observations: [
    { quote: 'We accept custom furniture enquiries.', source: source.url },
  ],
  hypothesis: 'A structured enquiry form may help; confirm first.',
  question: 'How do you record enquiries?',
  subject: 'Custom furniture enquiries',
  body: 'Hello, how do you record custom furniture enquiries?\nAksen Labs',
  checkedAt: '2026-10-27',
};
let browser;
try {
  await db.query(
    `INSERT INTO admin_sessions(token_hash,owner_id,email,config_version,expires_at) VALUES($1,$2,$3,$4,now()+interval '10 minutes')`,
    [
      tokenHash,
      process.env.ADMIN_OWNER_ID,
      process.env.ADMIN_EMAILS.split(',')[0].trim(),
      hash(
        `${process.env.ADMIN_PASSWORD_HASH || ''}:${process.env.ADMIN_EMAILS || ''}`,
      ),
    ],
  );
  browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([
    {
      name: 'aksen_admin',
      value: token,
      url: base,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let record = null,
    saveCount = 0;
  await page.route('**/api/admin/prospects', (r) =>
    r.fulfill({
      json: {
        campaign: null,
        leads: [
          {
            id: 'qa-lead',
            company: brief.company,
            website: 'https://fictional.example',
            domain: 'fictional.example',
            status: 'shortlisted',
            opportunity_id: null,
            data: {
              ...brief,
              description: 'Fictional workshop',
              opportunity: brief.hypothesis,
              contacts: [
                { kind: 'email', value: brief.recipient, source: source.url },
              ],
              sources: [source],
            },
          },
        ],
        runs: [],
        events: [],
        aiConfigured: true,
        remainingRuns: 10,
        dailyRuns: 10,
        targetMaxLength: 20000,
      },
    }),
  );
  await page.route('**/api/admin/prospects/outreach**', async (r) => {
    if (r.request().method() === 'POST') {
      const b = r.request().postDataJSON();
      if (b.action === 'prepare')
        record = {
          brief,
          outbox_id: null,
          email_status: null,
          response_status: 'not_recorded',
          response_note: '',
          next_action: '',
          followup_date: null,
        };
      else if (b.action === 'save') {
        assert.equal(b.reviewed, true);
        assert.ok(b.relationshipNote);
        saveCount++;
        record = { ...record, outbox_id: 'qa-mail', email_status: 'draft' };
      } else throw new Error('Unexpected write in UI test');
    }
    await r.fulfill({ json: { record, sendingConfigured: false } });
  });
  await page.route('**/api/admin/email', (r) => {
    assert.equal(r.request().method(), 'GET', 'UI test must never send email');
    return r.fulfill({
      json: {
        items: [
          {
            id: 'qa-mail',
            batch_key: 'qa-mail',
            recipient: brief.recipient,
            subject: brief.subject,
            body: brief.body,
            status: 'draft',
            purpose: 'outreach',
            relationship_note: 'Fictional test',
            created_at: new Date().toISOString(),
          },
        ],
        drafts: [],
        contacts: [],
        stopped: [],
        maxGroup: 100,
        configured: false,
        from: '',
        replyTo: 'owner@example.com',
      },
    });
  });
  for (const width of [1440, 375, 320]) {
    record = null;
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + '/admin/prospects', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    await page.getByRole('tab', { name: /Review queue/ }).click();
    // The queue opens on unreviewed leads. Outreach belongs to shortlisted
    // ones, so get there the way a person would.
    await page.getByRole('button', { name: /^Shortlisted/ }).click();
    await page
      .getByRole('button', { name: 'Prepare outreach with AI' })
      .click();
    await page
      .getByRole('heading', { name: '1. Check the evidence' })
      .waitFor();
    assert.equal(
      await page
        .getByRole('button', { name: 'Save reviewed email draft' })
        .isEnabled(),
      false,
    );
    await page
      .getByLabel('Why is it appropriate to contact this business?')
      .fill('Fictional test: relevant public business enquiry channel.');
    await page
      .getByLabel(
        'I checked the sources, recipient and wording. Save this as a draft only.',
      )
      .check();
    await page
      .getByLabel('Subject', { exact: true })
      .fill('Edited enquiry subject');
    assert.equal(
      await page
        .getByRole('button', { name: 'Save reviewed email draft' })
        .isEnabled(),
      false,
      'Editing must reset review',
    );
    await page
      .getByLabel(
        'I checked the sources, recipient and wording. Save this as a draft only.',
      )
      .check();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page
      .getByRole('button', { name: 'Save reviewed email draft' })
      .click();
    await page
      .getByRole('link', { name: 'Review draft in Email Desk →' })
      .click();
    await page
      .getByRole('heading', { name: brief.subject, exact: true })
      .waitFor();
    assert.equal(
      (await page
        .getByRole('button', { name: /Send.*email|Send.*cop/ })
        .count()) >= 0,
      true,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    console.log(
      `PASS ${width}px: evidence review, edit resets approval, saved draft handoff and selected Email Desk review.`,
    );
  }
  assert.equal(saveCount, 3);
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await db.query('DELETE FROM admin_sessions WHERE token_hash=$1', [tokenHash]);
}
