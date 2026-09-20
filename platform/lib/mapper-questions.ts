/** The visible choices and the server's validation share one source of truth. */
export const mapperQuestions = [
  {
    prompt: 'What would you like your business to do better?',
    hint: 'Choose everything that matters. We will look for a sensible first step.',
    options: [
      'Get more enquiries and sales',
      'Sell online or make buying easier',
      'Serve customers better',
      'Reduce manual work and connect systems',
      'Understand business performance',
      'Develop a new digital product',
      'Help me work out where to start',
    ],
  },
  {
    prompt: 'Where does your business operate?',
    hint: 'Choose all the markets relevant to this work.',
    options: [
      'Ghana',
      'Nigeria',
      'Kenya or East Africa',
      'South Africa or Southern Africa',
      'Another African country',
      'Beyond Africa / International',
    ],
  },
  {
    prompt: 'What do you use to run the work today?',
    hint: 'Choose the tools and channels you actually use. It is fine to have several.',
    options: [
      'WhatsApp, phone or social media',
      'A website',
      'Online payments or ecommerce',
      'Email and basic invoicing',
      'Spreadsheets and manual handoffs',
      'Several disconnected apps',
      'Starting something new',
      'Something else',
      'Not sure what tools we use',
    ],
    exclusive: 'Not sure what tools we use',
  },
] as const;

export type MapperAnswers = [string[], string[], string[]];

/** Old single-answer enquiries still arrive from cached pages. */
export function parseMapperAnswers(value: unknown): MapperAnswers | null {
  if (!Array.isArray(value) || value.length !== mapperQuestions.length)
    return null;
  const parsed = value.map((answer, index) => {
    const values = typeof answer === 'string' ? [answer] : answer;
    if (
      !Array.isArray(values) ||
      values.length < 1 ||
      values.length > mapperQuestions[index].options.length
    )
      return null;
    const clean = values.map((item) =>
      typeof item === 'string' ? item.trim().slice(0, 120) : '',
    );
    if (clean.some((item) => !item) || new Set(clean).size !== clean.length)
      return null;
    // Cached single-answer pages may contain the previous labels. New arrays
    // must contain only choices that the current visitor could actually see.
    if (
      Array.isArray(answer) &&
      clean.some(
        (item) =>
          !(mapperQuestions[index].options as readonly string[]).includes(item),
      )
    )
      return null;
    const exclusive =
      'exclusive' in mapperQuestions[index]
        ? mapperQuestions[index].exclusive
        : null;
    if (exclusive && clean.includes(exclusive) && clean.length > 1) return null;
    return clean;
  });
  return parsed.every(Boolean) ? (parsed as MapperAnswers) : null;
}
