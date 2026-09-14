// One place for the Lead Scout allowances. The daily cap used to be written
// as a bare 6 in four places: the SQL that enforces it, the route that reports
// what is left, that route's error message, and the sentence under the search
// buttons. Raising it meant finding all four, and a missed one would have gone
// on telling the operator a number the system no longer used.

/**
 * Research runs allowed per owner per UTC day. Each run calls the model
 * several times and costs real credits, so this is a spend guard rather than a
 * licensing limit. Set SCOUT_DAILY_RUNS to change it, or to 0 to remove the
 * cap entirely.
 */
export function dailyResearchRuns(): number {
  // Checked before Number(), which reads '' and '   ' as 0 and would have
  // taken an unset or blank variable as a deliberate request for no cap.
  const raw = process.env.SCOUT_DAILY_RUNS?.trim();
  if (!raw) return 50;
  const configured = Number(raw);
  if (!Number.isFinite(configured) || configured < 0) return 50;
  return Math.floor(configured);
}

/** True when no cap applies, so callers can skip the guard rather than compare against a sentinel. */
export function researchRunsUncapped(): boolean {
  return dailyResearchRuns() === 0;
}

/** Runs left today, or null when uncapped so the UI can say so rather than print a meaningless number. */
export function remainingResearchRuns(used: number): number | null {
  if (researchRunsUncapped()) return null;
  return Math.max(0, dailyResearchRuns() - used);
}

// The brief is a prompt, and prompts are paragraphs and headings rather than a
// sentence. 500 characters truncated a realistic one mid-thought; the column
// is plain text with no length of its own.
export const targetMinLength = 10;
export const targetMaxLength = 8000;

/** The allowance sentence, so the interface and the error messages agree. */
export function allowanceSentence(remaining: number | null): string {
  if (remaining === null) return 'Research runs are not capped for this workspace. ';
  return `${remaining} of ${dailyResearchRuns()} research runs remaining today. `;
}
