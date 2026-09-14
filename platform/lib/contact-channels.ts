// One place for the business contact number.
//
// The published build price and the Lead Scout run limit were each written out
// by hand in several files, and both drifted from what the system actually did.
// A phone number is worse to get wrong than either: a stale one does not look
// like a bug, it looks like a company that has stopped trading.

/** Digits only, no plus and no spaces. This is the form wa.me requires. */
export const whatsappNumber = '2349155833108';

/** Grouped for reading aloud and for display. Never used to build a link. */
export const whatsappDisplay = '+234 915 583 3108';

/**
 * A wa.me link, prefilled with where the visitor came from.
 *
 * The prefill is attribution we get for nothing: WhatsApp carries no referrer,
 * so without it every conversation arrives with no idea which page prompted
 * it. The visitor can see and delete the text before sending, which is the
 * right trade. It stays short and plain for that reason: anything that reads
 * as a tracking code invites deletion, and a sentence the sender is happy to
 * send is worth more than a token they strip out.
 */
export function whatsappLink(fromPath?: string): string {
  const where = (fromPath || '').trim();
  const text =
    where && where !== '/'
      ? `Hello Aksen Labs. I was reading ${where} and would like to discuss my business.`
      : 'Hello Aksen Labs. I would like to discuss my business.';
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}
