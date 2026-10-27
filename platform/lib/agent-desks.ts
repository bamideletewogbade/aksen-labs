/**
 * What Aksen sells, described as work rather than software.
 *
 * Read by /agents and the homepage, so the two never drift. The shape follows
 * one rule from the operating brief: every agent here prepares, organises and
 * answers from the owner's list, and every one names what it passes to a
 * person. A desk that cannot say what it hands over is not ready to be sold.
 *
 * Nothing here claims a client result. These are the jobs we build for, not
 * jobs we have finished; the Front Desk is the only one a visitor can try.
 */

export type DeskIcon =
  | 'message'
  | 'search'
  | 'file'
  | 'bell'
  | 'chart'
  | 'book';

export interface AgentDesk {
  id: string;
  icon: DeskIcon;
  title: string;
  line: string;
  /** What it passes to a person. Keep it concrete. */
  handsOver: string;
  href?: string;
}

export const agentDesks: AgentDesk[] = [
  {
    id: 'front-desk',
    icon: 'message',
    title: 'Front desk',
    line: 'Answers WhatsApp and website enquiries from your price list, takes the order with every detail, and gets it ready for payment.',
    handsOver: 'Prices off your list, discounts, complaints.',
    href: '/agents#try-it',
  },
  {
    id: 'get-found',
    icon: 'search',
    title: 'Getting found',
    line: 'Checks what Google and ChatGPT tell buyers about you each month, and prepares the fixes: reviews to ask for, facts to publish, profiles to correct.',
    handsOver: 'Anything published in your name.',
  },
  {
    id: 'paperwork',
    icon: 'file',
    title: 'Paperwork',
    line: 'Reads invoices, receipts, delivery notes and forms, and writes them into your records, filed and searchable.',
    handsOver: 'Each entry, for approval before it counts.',
  },
  {
    id: 'follow-up',
    icon: 'bell',
    title: 'Follow-up',
    line: 'Keeps track of quotes nobody answered and invoices not yet paid, and drafts the reminder in your words.',
    handsOver: 'The send button.',
  },
  {
    id: 'numbers',
    icon: 'chart',
    title: 'Your numbers',
    line: 'Every Monday, what came in, what sold and where enquiries slipped away, in plain words, from your own records.',
    handsOver: 'The decisions the numbers point to.',
  },
  {
    id: 'team-answers',
    icon: 'book',
    title: 'Team answers',
    line: 'Answers your staff from your own policies, price lists and procedures, so the same question stops landing on you.',
    handsOver: 'Questions your documents do not cover.',
  },
];

/** The "not more software" argument, one row per difference a buyer feels. */
export const softwareVsAgent: Array<{
  topic: string;
  software: string;
  agent: string;
}> = [
  {
    topic: 'What you get',
    software: 'A login, a manual and a setup fee.',
    agent: 'A job taken off your week, done inside your rules.',
  },
  {
    topic: 'Who does the work',
    software: 'Your team, once they have learned the tool.',
    agent: 'The agent. Your team handles what it passes them.',
  },
  {
    topic: 'When it runs',
    software: 'When somebody opens it.',
    agent: 'When a customer writes, including at 11pm.',
  },
  {
    topic: 'When prices or rules change',
    software: 'Someone finds the setting, or waits for an update.',
    agent: 'You tell us. We change its instructions and test them.',
  },
  {
    topic: 'How you know it is working',
    software: 'You assume it is.',
    agent:
      'A monthly report: what came in, what it handled, what it passed to you, what it cost.',
  },
];

/** What every agent is built from. The technical names stay out of the titles. */
export const agentParts: Array<{ title: string; text: string }> = [
  {
    title: 'Your rules',
    text: 'Prices, delivery areas, policies and wording, written down once. It answers from these and nothing else.',
  },
  {
    title: 'A short list of actions',
    text: 'Look up a price. Write up an order. Pass it to you. It can only do what it has been given, so the actions that matter stay with people.',
  },
  {
    title: 'Your channels',
    text: 'WhatsApp, your website, Paystack and the sheet or records your team already uses. Nobody installs a new app.',
  },
  {
    title: 'The right model for the job',
    text: 'Requests run through Vercel AI Gateway, so each job gets a model that suits it, and a backup model takes over if a provider has an outage.',
  },
  {
    title: 'A record of everything',
    text: 'Every conversation, order and hand-over is written where your team can see it. Nothing lives in one person’s phone.',
  },
  {
    title: 'Someone looking after it',
    text: 'We watch how it is doing, correct it, and review it with you every month, with a spending limit you agree.',
  },
];

export const agentFaq: Array<{ question: string; answer: string }> = [
  {
    question: 'How is this different from buying software?',
    answer:
      'Software gives your team a new tool to learn and run. An agent takes a piece of the work itself, such as answering an enquiry and writing up the order, and hands your team only the parts that need a person. We build it around how you already work, then keep it running.',
  },
  {
    question: 'What will it never do?',
    answer:
      'Set a price that is not on your list, give a discount, promise a date you have not offered, confirm a payment, or contact someone who has not written first. It has no button for any of those, so it cannot be talked into them. They come to you with the details already collected.',
  },
  {
    question: 'What happens when it does not know?',
    answer:
      'It says so and passes the conversation to you, rather than guessing. Every conversation is logged, so when it gets something wrong we can see why and fix its instructions.',
  },
  {
    question: 'Which AI does it use?',
    answer:
      'Whichever suits the job. We route requests through Vercel AI Gateway, which reaches models from Anthropic, Google, OpenAI, DeepSeek and others through one connection. We can change the model without rebuilding the agent, and if one provider is down, a backup takes the request.',
  },
  {
    question: 'Do we keep our information?',
    answer:
      'Yes. Your prices, rules and records stay in your accounts and sheets, not locked inside a system only we can open. The agent is built with standard, widely used tools.',
  },
  {
    question: 'What does it cost?',
    answer:
      'The assessment is free. If an agent is worth building, you get a written quote for the build, then a monthly fee for running it that covers model usage, monitoring and changes, with a spending limit you set. The pricing page has the starting figures.',
  },
];
