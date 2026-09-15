/**
 * The vocabulary of the feedback board, in one place.
 *
 * The public page, the API and the admin all have to agree on what a status
 * means and which ones a visitor is allowed to see. Keeping that here rather
 * than in three files is the difference between renaming a status and hunting
 * for the string.
 */

export type IdeaStatus =
  | 'open'
  | 'planned'
  | 'building'
  | 'shipped'
  | 'declined';

export const ideaStatuses: readonly {
  id: IdeaStatus;
  label: string;
  /** What the status promises, written for the person who asked. */
  meaning: string;
}[] = [
  {
    id: 'open',
    label: 'Open',
    meaning: 'Read and on the board. Not promised.',
  },
  {
    id: 'planned',
    label: 'Planned',
    meaning: 'We decided to build it. No date.',
  },
  {
    id: 'building',
    label: 'Building',
    meaning: 'Someone is working on it now.',
  },
  {
    id: 'shipped',
    label: 'Shipped',
    meaning: 'Done and live, with a changelog entry.',
  },
  {
    id: 'declined',
    label: 'Not doing',
    meaning: 'We said no, and the card says why.',
  },
] as const;

export function statusLabel(status: string) {
  return ideaStatuses.find((entry) => entry.id === status)?.label || 'Open';
}

/** The order the board reads in. Live work first, the archive last. */
export const boardOrder: readonly IdeaStatus[] = [
  'building',
  'planned',
  'open',
  'shipped',
  'declined',
] as const;

export type ChangelogKind = 'new' | 'improvement' | 'fix';

export const changelogKinds: readonly { id: ChangelogKind; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'improvement', label: 'Improved' },
  { id: 'fix', label: 'Fixed' },
] as const;

export function changelogKindLabel(kind: string) {
  return changelogKinds.find((entry) => entry.id === kind)?.label || 'Improved';
}

/** How long a title and a body may be. A request nobody can read in one breath
 *  is a conversation, and the form says to send that as an enquiry instead. */
export const titleLimit = 110;
export const bodyLimit = 1200;

/**
 * Control characters, zero-width marks and the bidi overrides, by code point.
 *
 * Tab (9) and newline (10) are deliberately absent: they are the two a person
 * actually types. Everything else in these ranges is invisible, and invisible
 * characters in text that will be rendered on the marketing site are only ever
 * there to do something the writer does not want seen: reverse the reading
 * order of a line, or hide content from the reader that the page still carries.
 */
function hidden(code: number) {
  return (
    code < 0x09 ||
    (code > 0x0a && code < 0x20) ||
    (code >= 0x7f && code <= 0x9f) ||
    (code >= 0x200b && code <= 0x200f) ||
    (code >= 0x2028 && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff
  );
}

/**
 * A submission is a stranger's text that ends up in a triage prompt and, once
 * published, on the marketing site.
 *
 * This does not stop someone writing instructions aimed at the agent. Nothing
 * at this layer could, which is why triage output is never acted on without a
 * person approving it. What it does stop is the layout: invisible characters,
 * and a wall of blank lines that pushes the rest of a card off the screen.
 */
export function cleanSubmission(value: unknown, limit: number) {
  if (typeof value !== 'string') return '';
  // Array.from walks code points, so a character outside the basic plane stays
  // one item instead of being torn into its surrogate halves and mangled.
  const visible = Array.from(value)
    .map((char) => (hidden(char.codePointAt(0) ?? 0) ? ' ' : char))
    .join('');
  return visible
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, limit);
}
