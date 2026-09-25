import { emailConfig, validEmail } from '@/lib/resend';

/**
 * What a new enquiry says, to the founder and to the person who sent it.
 *
 * Only the wording lives here now. Delivery moved to `lib/outbox.ts` and
 * capture to `lib/lead-intake.ts`, because a send that happened inside the
 * request made the visitor wait for a mail provider and lost the notice
 * entirely when that provider was down.
 */

export type LeadNotice = {
  id: string;
  name: string;
  email: string;
  company: string;
  summary: string;
  recommendation: string;
};

/** Where a new enquiry is announced. Falls back to the address replies go to. */
export function leadNotificationAddress() {
  const configured = process.env.LEAD_NOTIFICATION_EMAIL?.trim();
  return configured && validEmail(configured)
    ? configured
    : emailConfig().replyTo;
}

// Resend's shared sandbox sender accepts a send to anyone and then delivers only
// to the Resend account owner, returning success either way. Treating that
// acceptance as an acknowledgement would have the site tell a visitor a
// confirmation is on its way when nothing was sent. Announcing an enquiry to the
// owner still works, so only the acknowledgement is withheld. Verifying a
// sending domain in Resend turns this back on with no code change.
const SANDBOX_SENDER = 'onboarding@resend.dev';
export function canAcknowledgeSenders() {
  return emailConfig().from.trim().toLowerCase() !== SANDBOX_SENDER;
}

const trim = (value: string, limit: number) =>
  value.replace(/\s+/g, ' ').trim().slice(0, limit);

export function founderMessage(lead: LeadNotice) {
  return [
    'A new enquiry arrived on the Aksen website.',
    '',
    `Name:    ${trim(lead.name, 120)}`,
    `Email:   ${trim(lead.email, 200)}`,
    `Company: ${trim(lead.company, 160)}`,
    '',
    'What they described:',
    trim(lead.summary, 900),
    '',
    `Suggestion shown to them: ${trim(lead.recommendation, 200)}`,
    '',
    `Open it in the workspace: /admin/pipeline (enquiry ${lead.id}).`,
    '',
    'This is an automatic notice. Reply to the enquirer directly.',
  ].join('\n');
}

export function acknowledgementMessage(lead: LeadNotice) {
  const firstName = trim(lead.name, 120).split(' ')[0] || 'there';
  return [
    `Hello ${firstName},`,
    '',
    'Thank you for contacting Aksen Labs. Your enquiry has reached our desk.',
    '',
    'What you told us:',
    trim(lead.summary, 900),
    '',
    'What happens next:',
    'We are preparing a rapid, asynchronous gap audit and recommendation for',
    'your business based on your specific requirements — no high-pressure sales calls',
    'or calendar booking needed. You will receive an honest evaluation and clear',
    'options directly to this email address.',
    '',
    'If anything above is wrong, or you want to add detail, reply directly to this',
    'message and it will reach our desk immediately.',
    '',
    'Aksen Labs',
    'Digital transformation for African businesses. Based in Ghana.',
  ].join('\n');
}

/**
 * The copy someone asked for after running a free agent.
 *
 * "Send this to yourself" has to send them the thing they were looking at. The
 * generic acknowledgement would arrive saying we have their enquiry, which is
 * true and is not what the button said, and a first message that does not match
 * the button it came from is the worst possible introduction.
 */
export function agentDraftMessage(input: {
  name: string;
  tool: string;
  brief: string;
  draft: string;
}) {
  const firstName = trim(input.name, 120).split(' ')[0] || 'there';
  return [
    `Hello ${firstName},`,
    '',
    `Here is the draft ${input.tool ? `from ${trim(input.tool, 120)}` : 'you asked for'}, as it appeared on the site.`,
    '',
    'It is a draft for you to check, not advice to act on unread. Facts and',
    'assumptions in it are the model’s, not ours.',
    '',
    '-----',
    '',
    input.draft.trim().slice(0, 8000),
    '',
    '-----',
    '',
    'What you told it:',
    trim(input.brief, 1200),
    '',
    'If any of this is close to something you actually want doing, reply to',
    'this message and a person will read it.',
    '',
    'Aksen Labs',
    'Websites, business systems and AI. Based in Ghana.',
  ].join('\n');
}

/**
 * Whether anything can be delivered at all.
 *
 * `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are what switch the loop on. Without
 * them every message queues and nothing leaves, which is recoverable the moment
 * they are set, and invisible until somebody looks. The admin reads this.
 */
export function deliveryConfigured() {
  return emailConfig().configured;
}

export { validEmail };
