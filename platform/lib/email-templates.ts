/**
 * Email templates for the email desk, and the rules for filling them.
 *
 * Zero imports on purpose: the route, the desk and `tests/email-templates.mjs`
 * all load this file, and the test runs it under plain Node.
 *
 * Every business has the same three problems, in this order: not enough
 * people know about it (leads), not enough of those who ask end up buying
 * (customers), and not enough of each sale is kept or repeated (profit). The
 * outreach templates are grouped by which one they speak to, because the first
 * email only works if it names the problem the reader already feels. The rest
 * are the letters every deal needs on the way to being paid.
 *
 * Two kinds of blank:
 * - Per person, `{{first_name}}` and `{{business}}`, filled on the server for
 *   each recipient, so one group email reads as written to each of them.
 * - Everything else (`{{observation}}`, `{{day}}`...) is the same for everyone
 *   in the send and is filled in the desk before saving.
 *
 * A blank left unfilled is refused, not sent. "Hi {{first_name}}" in a real
 * inbox is the fastest way to be ignored for good.
 *
 * House voice (operating brief, section 2): plain words a shop owner uses, no
 * em dashes, no absolutes, no claims about past clients. Aksen has none yet.
 */

export type TemplateGroup =
  | 'leads'
  | 'customers'
  | 'profit'
  | 'relationship'
  | 'deal'
  | 'money';

export const TEMPLATE_GROUPS: { id: TemplateGroup; label: string }[] = [
  { id: 'leads', label: 'Problem 1: more leads' },
  { id: 'customers', label: 'Problem 2: more customers' },
  { id: 'profit', label: 'Problem 3: more profit' },
  { id: 'relationship', label: 'Staying in touch' },
  { id: 'deal', label: 'Moving a deal forward' },
  { id: 'money', label: 'Getting paid' },
];

export type TemplateField = {
  key: string;
  label: string;
  hint: string;
};

export type EmailTemplate = {
  key: string;
  group: TemplateGroup;
  name: string;
  /** When to reach for it, in one line. Shown under the picker. */
  use: string;
  purpose: 'outreach' | 'service';
  subject: string;
  body: string;
  /** The shared blanks this template needs, beyond the per-person ones. */
  fields: TemplateField[];
};

/** Filled per recipient on the server. Never shown as a desk input. */
export const PERSON_TOKENS = ['first_name', 'business'] as const;

/**
 * Added by the server to every outreach email, whatever the template says.
 * Outreach goes to people who did not write to us first, and they are owed an
 * easy way out. A reply is the easiest one there is.
 */
export const STOP_LINE =
  'If you would rather not get emails from me, just reply "stop" and I will not write again.';

const sign = '\n\n{{sender_name}}\nAksen Labs';

const observation: TemplateField = {
  key: 'observation',
  label: 'What you noticed',
  hint: 'One specific thing you saw, in their terms. Finishes the sentence "I noticed that..."',
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Problem 1: not enough people know about the business.
  {
    key: 'leads-search',
    group: 'leads',
    name: 'Hard to find online',
    use: 'They have no website or Google listing, or they do not come up when you search for what they sell.',
    purpose: 'outreach',
    subject: 'Finding {{business}} online',
    body: `Hi {{first_name}},

I searched for {{business}} the way a new customer would, and I noticed that {{observation}}.

Most people look a business up before they send a first message. When nothing comes up, they message someone else, and you never hear about them.

This is the kind of thing I fix: a page people can find, a proper Google listing, and one clear way to reach you. Would a 20 minute call this week be useful? I will show you exactly what I found.${sign}`,
    fields: [observation],
  },
  {
    key: 'leads-reach',
    group: 'leads',
    name: 'Posts reaching fewer people',
    use: 'They post a lot on Instagram or TikTok, but likes and comments have fallen compared with a year or two ago.',
    purpose: 'outreach',
    subject: 'Your followers and your posts',
    body: `Hi {{first_name}},

I have been following {{business}} for a while, and I noticed that {{observation}}.

This is not your content. The apps now show each post to a much smaller share of your followers than they used to, so the audience you built is there but you cannot reach it when you need it.

The fix is a list you own: customers who agreed to hear from you on WhatsApp or email, so a new collection reaches them directly. I can set that up alongside what you already do. Worth a short call?${sign}`,
    fields: [observation],
  },
  // Problem 2: people ask, but not enough of them buy.
  {
    key: 'customers-replies',
    group: 'customers',
    name: 'Enquiries waiting too long',
    use: 'Everything comes into one WhatsApp or DM inbox and one person answers it all.',
    purpose: 'outreach',
    subject: 'The messages that come in after hours',
    body: `Hi {{first_name}},

Quick question about {{business}}: what happens to a price enquiry that comes in at 10pm, or while you are busy with a customer?

From the outside, I noticed that {{observation}}. When someone asks a price and waits hours for the answer, they often ask two other shops at the same time, and the first reply usually wins.

I help set up quick replies, a catalogue with your real prices, and a simple list so every enquiry gets an answer and a follow-up. Could we talk for 20 minutes this week?${sign}`,
    fields: [observation],
  },
  {
    key: 'customers-followup',
    group: 'customers',
    name: 'People who asked and went quiet',
    use: 'Their customers ask for prices in chat, and nobody follows up the ones who do not buy straight away.',
    purpose: 'outreach',
    subject: 'The people who asked for a price',
    body: `Hi {{first_name}},

Most businesses I speak to have the same hidden pile: people who asked for a price, said "let me get back to you", and were never asked again.

Many of them still want to buy. They just got busy. A short, polite follow-up two days later brings a good share of them back, and it costs nothing but the message.

I can help {{business}} keep track of those people and follow up without you having to remember each one. Would that be useful?${sign}`,
    fields: [],
  },
  // Problem 3: not enough of each sale is kept, and not enough people come back.
  {
    key: 'profit-margin',
    group: 'profit',
    name: 'Which products really make money',
    use: 'A busy business that knows its sales but not the cost behind each item.',
    purpose: 'outreach',
    subject: 'What {{business}} makes on each sale',
    body: `Hi {{first_name}},

A question most owners can answer about sales but not about profit: which of your products makes you the most money after materials, delivery and your time?

The answer usually surprises people. The best seller is often not the best earner, and a few items quietly lose money once delivery is counted.

I build a simple sheet or dashboard that shows this for {{business}} every week, from the records you already keep. Happy to show you what it looks like on a short call.${sign}`,
    fields: [],
  },
  {
    key: 'profit-repeat',
    group: 'profit',
    name: 'Past customers, the cheapest sales',
    use: 'A business with many past buyers and no way of selling to them again.',
    purpose: 'outreach',
    subject: 'Your past customers',
    body: `Hi {{first_name}},

The cheapest sale for any business is to someone who has already bought from you. They trust you, and you do not pay to find them again.

Most businesses do not have those customers in one place, so the only way to reach them is to hope they see a post. I noticed that {{observation}}.

I can help {{business}} gather past buyers into one list and send them something worth opening, like a new collection or a thank-you offer. Want me to walk you through it?${sign}`,
    fields: [observation],
  },
  // Staying in touch.
  {
    key: 'reconnect',
    group: 'relationship',
    name: 'Reconnect with someone you know',
    use: 'A friend, old classmate or former colleague who runs a business.',
    purpose: 'outreach',
    subject: 'Catching up, and a question about {{business}}',
    body: `Hi {{first_name}},

It has been a while. I have been watching {{business}} grow and it looks great, especially {{observation}}.

Some news from my side: I now run Aksen Labs full time, helping businesses get more enquiries, turn more of them into sales, and keep more of what they earn.

I would love to hear how things are going for you and where the business feels stuck. Could we have a 20 minute call {{day}}? No pitch, just questions.${sign}`,
    fields: [
      observation,
      {
        key: 'day',
        label: 'When',
        hint: 'For example "this Thursday" or "any day next week".',
      },
    ],
  },
  {
    key: 'thank-you-referral',
    group: 'relationship',
    name: 'Thank you, and who else should I meet',
    use: 'After finished work, or after a helpful conversation.',
    purpose: 'service',
    subject: 'Thank you',
    body: `Hi {{first_name}},

Thank you for {{reason}}. I really appreciated it.

One small ask: is there anyone you know who runs a business and might have the same headaches we talked about? An introduction on WhatsApp is plenty. I will take good care of them.${sign}`,
    fields: [
      {
        key: 'reason',
        label: 'Thank them for',
        hint: 'For example "your time on Tuesday" or "trusting us with the website".',
      },
    ],
  },
  // Moving a deal forward.
  {
    key: 'call-request',
    group: 'deal',
    name: 'Ask for a call',
    use: 'They showed interest and you need a time on the calendar.',
    purpose: 'service',
    subject: '20 minutes {{day}}?',
    body: `Hi {{first_name}},

Following up on our chat. Could we do a 20 minute call {{day}}? I want to understand how {{business}} runs day to day before suggesting anything.

I will ask where new customers come from, what happens when someone enquires, and what eats most of your time. That is it.

Reply with a time that works and I will send a link.${sign}`,
    fields: [
      {
        key: 'day',
        label: 'When',
        hint: 'For example "on Thursday afternoon".',
      },
    ],
  },
  {
    key: 'call-recap',
    group: 'deal',
    name: 'Recap after a call',
    use: 'Send within a day of a discovery call, while it is fresh for both of you.',
    purpose: 'service',
    subject: 'Notes from our call',
    body: `Hi {{first_name}},

Thank you for your time. Here is what I heard, so you can correct anything I got wrong.

What is hurting most: {{problem}}

What I suggest we do first: {{next_step}}

I will send the details, with the price and what is included, by {{day}}. If it does not look worth the money, I will tell you that too.${sign}`,
    fields: [
      {
        key: 'problem',
        label: 'The problem, in their words',
        hint: 'Quote them where you can.',
      },
      {
        key: 'next_step',
        label: 'Suggested first step',
        hint: 'One small, clear piece of work.',
      },
      { key: 'day', label: 'Details by', hint: 'For example "Friday".' },
    ],
  },
  {
    key: 'proposal-followup',
    group: 'deal',
    name: 'Follow up on a proposal',
    use: 'A proposal or price went out a few days ago and there is no reply yet.',
    purpose: 'service',
    subject: 'Any questions on the proposal?',
    body: `Hi {{first_name}},

Just checking you received the proposal for {{business}}, and whether anything in it needs explaining.

If the whole thing feels like too much right now, we can start with one smaller piece: {{smaller_step}}. That way you see results before committing to more.${sign}`,
    fields: [
      {
        key: 'smaller_step',
        label: 'Smaller first step',
        hint: 'The piece that fixes their biggest problem on its own.',
      },
    ],
  },
  {
    key: 'close-the-loop',
    group: 'deal',
    name: 'Gone quiet: close the loop',
    use: 'Two or three follow-ups with no reply. Polite, and gives them an easy answer.',
    purpose: 'service',
    subject: 'Should I close this for now?',
    body: `Hi {{first_name}},

I have not heard back, which usually means the timing is not right. That is completely fine.

I will close this on my side for now. If things change and you want to pick it up again, reply to this email and we will start from where we left off.

Wishing {{business}} a great season.${sign}`,
    fields: [],
  },
  // Getting paid.
  {
    key: 'payment-reminder',
    group: 'money',
    name: 'Friendly payment reminder',
    use: 'An invoice is due or a little overdue.',
    purpose: 'service',
    subject: 'Invoice {{invoice_ref}}',
    body: `Hi {{first_name}},

A friendly reminder that invoice {{invoice_ref}} for {{amount}} is due on {{due_date}}.

You can pay here: {{pay_link}}

If it has already gone through, thank you, and please ignore this. If anything is unclear, just reply.${sign}`,
    fields: [
      {
        key: 'invoice_ref',
        label: 'Invoice number',
        hint: 'As it appears on the invoice.',
      },
      {
        key: 'amount',
        label: 'Amount',
        hint: 'With the currency, for example "GHS 1,500".',
      },
      {
        key: 'due_date',
        label: 'Due date',
        hint: 'For example "Friday 3 October".',
      },
      {
        key: 'pay_link',
        label: 'Payment link',
        hint: 'The Paystack link from Clients & billing.',
      },
    ],
  },
];

export function findTemplate(key: string) {
  return EMAIL_TEMPLATES.find((t) => t.key === key);
}

const TOKEN = /\{\{\s*([a-z_]+)\s*\}\}/g;

/** Replace the named blanks and leave every other blank exactly as it was. */
export function fillTokens(text: string, values: Record<string, string>) {
  return text.replace(TOKEN, (whole, name: string) => {
    const value = values[name];
    return typeof value === 'string' && value.trim() ? value.trim() : whole;
  });
}

/** The names of every blank still in the text, once each. */
export function unfilledTokens(text: string) {
  return [...new Set([...text.matchAll(TOKEN)].map((m) => m[1]))];
}

/**
 * The first word of a name, for the greeting. "Mrs Ope Adebayo" should not
 * become "Hi Mrs", so a leading title is skipped. Falls back to "there",
 * which only ever appears after "Hi".
 */
export function firstName(name: string | null | undefined) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  const titles =
    /^(mr|mrs|ms|miss|dr|chief|pastor|prof|engr|alhaji|alhaja)\.?$/i;
  const first = words.find((w) => !titles.test(w));
  return first || 'there';
}

export type Recipient = {
  email: string;
  name?: string;
  business?: string;
};

/**
 * Parse pasted recipients, one per line: `email, name, business`. Name and
 * business are optional. Also accepts `Name <email>`. Returns what it could
 * read and the lines it could not, so a typo is shown rather than dropped.
 */
export function parseRecipientLines(text: string) {
  const recipients: Recipient[] = [];
  const rejected: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const angled = line.match(/^(.*)<([^>]+)>\s*(?:,\s*(.*))?$/);
    if (angled) {
      const email = angled[2].trim().toLowerCase();
      if (validAddress(email))
        recipients.push({
          email,
          name: angled[1].replace(/[",]/g, '').trim() || undefined,
          business: angled[3]?.trim() || undefined,
        });
      else rejected.push(line);
      continue;
    }
    const [email = '', name = '', business = ''] = line
      .split(/[,\t;]/)
      .map((part) => part.trim());
    if (validAddress(email.toLowerCase()))
      recipients.push({
        email: email.toLowerCase(),
        name: name || undefined,
        business: business || undefined,
      });
    else rejected.push(line);
  }
  return { recipients, rejected };
}

export function validAddress(value: string) {
  return /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value);
}

/**
 * The finished email for one person. Shared blanks must already be filled;
 * anything still blank afterwards is returned in `missing` and must block the
 * save.
 */
export function renderForRecipient(
  input: { subject: string; body: string; purpose: string },
  recipient: Recipient,
) {
  const values = {
    first_name: firstName(recipient.name),
    business: recipient.business || '',
  };
  const subject = fillTokens(input.subject, values);
  let body = fillTokens(input.body, values).trimEnd();
  if (input.purpose === 'outreach' && !body.includes(STOP_LINE))
    body += `\n\n${STOP_LINE}`;
  const missing = unfilledTokens(`${subject}\n${body}`);
  return { subject, body, missing };
}

/** The most people one send may reach. A handful of real conversations, not a campaign. */
export const MAX_GROUP = 50;
