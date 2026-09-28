// What an owner wants more of. Every business wants more than one of these at
// once, so wherever this is asked it is a set of checkboxes, never a single
// choice: an owner who wants more leads and more income should not have to
// pick which to admit to. Ordered as a funnel: found, chosen, kept.
export const businessGoals = [
  'More leads',
  'More customers',
  'More income',
  'Less time on manual work',
] as const;

export type BusinessGoal = (typeof businessGoals)[number];

/** Only the known goals, each once, in the list's own order. */
export function parseGoals(value: unknown): BusinessGoal[] {
  const given = Array.isArray(value) ? value : value ? [value] : [];
  return businessGoals.filter((goal) => given.includes(goal));
}
