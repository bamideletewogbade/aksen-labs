export const EMAIL_REPLY_TO = 'bishoptewogbade@gmail.com';
export function emailConfig() {
  return {
    configured: !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL,
    from: process.env.RESEND_FROM_EMAIL || '',
    replyTo: process.env.RESEND_REPLY_TO || EMAIL_REPLY_TO,
  };
}
export function validEmail(value: string) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}
export async function sendResendEmail(input: {
  id: string;
  recipient: string;
  subject: string;
  body: string;
}) {
  const config = emailConfig();
  if (!config.configured) throw new Error('Email delivery is not configured.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(20000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `aksen-outbox-${input.id}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: [input.recipient],
      reply_to: config.replyTo,
      subject: input.subject,
      text: input.body,
    }),
  });
  if (!response.ok) {
    // Carry the provider's reason. Without it a rejected send is undiagnosable in
    // production. Callers must not show this to the recipient.
    const detail = await response
      .text()
      .then((text) => text.slice(0, 300))
      .catch(() => '');
    throw new Error(
      `Provider did not confirm acceptance (HTTP ${response.status}). ${redactEmails(detail)}`,
    );
  }
  const data = (await response.json()) as { id?: string };
  if (!data.id) throw new Error('No provider receipt.');
  return data.id;
}

/** Strip addresses out of provider text before it can reach a log. */
export function redactEmails(value: string) {
  return value.replace(/[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"',]+/g, '[address]');
}
