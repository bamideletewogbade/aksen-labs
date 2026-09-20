import type { MapperAnswers } from './mapper-questions';

export type MapperStartingPoint = {
  title: string;
  summary: string;
  firstWorkflow: string;
  steps: string[];
  firstMetric: string;
  humanControl: string;
};

/** A useful answer when the live advisor cannot return one. No invented ROI. */
export function mapperFallback(answers: MapperAnswers): MapperStartingPoint {
  const [goals, markets, tools] = answers;
  const joined = goals.join(' ').toLowerCase();
  const market =
    markets.length === 1 ? markets[0] : `${markets.length} markets`;
  const setup =
    tools.length === 1
      ? tools[0]
      : `${tools[0]} and ${tools.length - 1} other part${tools.length === 2 ? '' : 's'} of your setup`;
  const common = {
    summary: `You selected ${goals.join(' and ').toLowerCase()} in ${market}. Start with one workflow that fits your current setup (${setup}) and test it with real work before widening the scope.`,
    steps: [
      'Walk through the current process with the people who do it.',
      'Build or connect the smallest useful version of the workflow.',
      'Try real cases, inspect the exceptions and decide what to improve next.',
    ],
    humanControl:
      'Your team reviews exceptions and approves customer-facing or financial decisions.',
  };
  if (joined.includes('serve customers') || joined.includes('enquiries'))
    return {
      ...common,
      title: 'A clearer enquiry and follow-up flow',
      firstWorkflow:
        'Capture each enquiry in one place, give it an owner and make the next reply or handoff visible.',
      firstMetric:
        'Track how many enquiries have an owner, a next action and a recorded response.',
    };
  if (joined.includes('sell online') || joined.includes('buying'))
    return {
      ...common,
      title: 'A simpler path from interest to order',
      firstWorkflow:
        'Trace one buying journey from first question to confirmed order and remove the handoffs that cause delays.',
      firstMetric: 'Track where enquiries stop before an order is confirmed.',
    };
  if (joined.includes('manual work') || joined.includes('systems'))
    return {
      ...common,
      title: 'One connected operations workflow',
      firstWorkflow:
        'Choose one repeated handoff between people or tools and give it a shared record and clear owner.',
      firstMetric:
        'Count handoffs completed without duplicate entry or an unclear owner.',
    };
  if (joined.includes('performance'))
    return {
      ...common,
      title: 'A small, trustworthy business dashboard',
      firstWorkflow:
        'Choose the decisions you need to make each week, then connect the few measures that answer them.',
      firstMetric:
        'Check whether the key figures agree with their original records each week.',
    };
  if (joined.includes('digital product'))
    return {
      ...common,
      title: 'A focused product discovery sprint',
      firstWorkflow:
        'Define one user, one recurring problem and the smallest way to test whether the product helps.',
      firstMetric:
        'Record whether target users complete the core task and where they stop.',
    };
  return {
    ...common,
    title: 'A practical first-step review',
    firstWorkflow:
      'Map the work that costs your team the most time or loses the most context, then pick one improvement to test.',
    firstMetric:
      'Agree one measure before the pilot so the result can be judged honestly.',
  };
}
