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

/**
 * Send up to 100 separate emails in one request, one per person, so a group
 * email never shows anyone else's address. Resend treats the batch as one
 * unit: it accepts all of them or none, which is what lets the caller mark the
 * whole group sent or the whole group uncertain and never half of it.
 *
 * The idempotency key is the group's, so a retry after a lost response is
 * recognised by the provider rather than delivered twice.
 */
export async function sendResendBatch(
  batchKey: string,
  messages: {
    recipient: string;
    subject: string;
    body: string;
    outreach?: boolean;
  }[],
) {
  const config = emailConfig();
  if (!config.configured) throw new Error('Email delivery is not configured.');
  if (messages.length === 0 || messages.length > 100)
    throw new Error('A batch holds between 1 and 100 emails.');
  const response = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `aksen-batch-${batchKey}`,
    },
    body: JSON.stringify(
      messages.map((m) => ({
        from: config.from,
        to: [m.recipient],
        reply_to: config.replyTo,
        subject: m.subject,
        text: m.body,
        // Mail apps show their own "unsubscribe" button when this is present,
        // and it lands in the same inbox a "stop" reply does.
        ...(m.outreach
          ? {
              headers: {
                'List-Unsubscribe': `<mailto:${config.replyTo}?subject=stop>`,
              },
            }
          : {}),
      })),
    ),
  });
  if (!response.ok) {
    const detail = await response
      .text()
      .then((text) => text.slice(0, 300))
      .catch(() => '');
    throw new Error(
      `Provider did not confirm acceptance (HTTP ${response.status}). ${redactEmails(detail)}`,
    );
  }
  const data = (await response.json()) as { data?: { id?: string }[] };
  const ids = (data.data ?? []).map((row) => row.id ?? '');
  // Receipts come back in the order sent. A short or blank list means the
  // provider's answer cannot be matched to people, so it is not a receipt.
  if (ids.length !== messages.length || ids.some((id) => !id))
    throw new Error('Provider receipts did not match the batch.');
  return ids;
}

/** Strip addresses out of provider text before it can reach a log. */
export function redactEmails(value: string) {
  return value.replace(/[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"',]+/g, '[address]');
}
