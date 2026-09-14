import { emailConfig, sendResendEmail, validEmail } from '@/lib/resend';

export type LeadNotice = {
  id: string;
  name: string;
  email: string;
  company: string;
  summary: string;
  recommendation: string;
};
export type LeadNoticeResult = {
  notified: boolean;
  acknowledged: boolean;
  configured: boolean;
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

function founderMessage(lead: LeadNotice) {
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

function acknowledgementMessage(lead: LeadNotice) {
  const firstName = trim(lead.name, 120).split(' ')[0] || 'there';
  return [
    `Hello ${firstName},`,
    '',
    'Thank you for contacting Aksen Labs. Your enquiry has reached us and a',
    'person will read it and reply to this address.',
    '',
    'What you told us:',
    trim(lead.summary, 900),
    '',
    'If anything above is wrong, or you want to add detail, reply to this',
    'message and it will reach the same place.',
    '',
    'Aksen Labs',
    'Digital transformation for African businesses. Based in Ghana.',
  ].join('\n');
}

/**
 * Announces a saved enquiry and acknowledges it to the sender. The lead is
 * already stored before this runs, so nothing here throws: a delivery problem
 * must never cost the business a lead it has already captured. The caller
 * records the returned outcome so an unnotified enquiry stays visible.
 */
export async function notifyNewLead(
  lead: LeadNotice,
): Promise<LeadNoticeResult> {
  const configured = emailConfig().configured;
  if (!configured)
    return { notified: false, acknowledged: false, configured: false };
  const acknowledgeable = canAcknowledgeSenders() && validEmail(lead.email);
  const [founder, sender] = await Promise.allSettled([
    sendResendEmail({
      id: `lead-${lead.id}`,
      recipient: leadNotificationAddress(),
      subject: `New enquiry: ${trim(lead.company, 60) || trim(lead.name, 60)}`,
      body: founderMessage(lead),
    }),
    acknowledgeable
      ? sendResendEmail({
          id: `lead-ack-${lead.id}`,
          recipient: lead.email,
          subject: 'We have your enquiry | Aksen Labs',
          body: acknowledgementMessage(lead),
        })
      : Promise.reject(new Error('Acknowledgement not deliverable.')),
  ]);
  return {
    configured: true,
    notified: founder.status === 'fulfilled',
    acknowledged: sender.status === 'fulfilled',
  };
}
