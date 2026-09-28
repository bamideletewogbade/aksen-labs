import {
  OTHER,
  businessPhrase,
  problemById,
  type MapperIntake,
  type ProblemId,
} from './mapper-questions';
import { FREE_ASSESSMENT, type MapperReport } from './mapper-report';

/**
 * The report when the live one cannot be used: the model is down, over its
 * budget, or its draft failed the checks twice.
 *
 * It used to key on the first goal's wording and returned one of six stock
 * cards. It is built from the symptoms now, so it names where the visitor said
 * things slip and gives the free fix and first build for exactly those. No
 * invented figures; anything a number would need goes into the questions.
 */

type Play = {
  where: string;
  diy: string;
  fix: { title: string; what: string; package: string };
  measure: string;
};

const plays: Record<string, Play> = {
  'People cannot find us on Google or Maps': {
    where: 'People searching nearby do not find you',
    diy: 'Claim or update your Google Business Profile with your opening hours, a few photos of real work and a WhatsApp number.',
    fix: {
      title: 'A single page people can find',
      what: 'One page with your offer, your location and a WhatsApp or enquiry button, set up so search and Maps can list it.',
      package: 'Single page',
    },
    measure:
      'Ask every new customer how they found you, and count the ones who say Google or Maps.',
  },
  'We have no website, or it brings no enquiries': {
    where: 'Visitors look but do not get in touch',
    diy: 'Put your WhatsApp number and one clear next step, such as "Send us a photo for a quote", at the top of your profiles.',
    fix: {
      title: 'A page built to bring enquiries',
      what: 'A focused page with one offer and a short enquiry form that reaches a named person with the details complete.',
      package: 'Campaign site',
    },
    measure:
      'Count the enquiries that arrive through the page each week, before and after.',
  },
  'Posts get likes but few messages': {
    where: 'Attention on social media does not turn into conversations',
    diy: 'End each post with one direct ask and a link that opens a WhatsApp chat with a message already typed.',
    fix: {
      title: 'A clear path from post to enquiry',
      what: 'A simple landing page and chat link for each offer, so you can see which posts bring messages.',
      package: 'Campaign site',
    },
    measure:
      'Count the messages each week that mention a specific post or offer.',
  },
  'Most new customers come from word of mouth only': {
    where: 'New customers depend on who happens to recommend you',
    diy: 'Ask your last ten happy customers for a short review or a photo you may share, and note who referred each new customer.',
    fix: {
      title: 'Somewhere for a recommendation to land',
      what: 'A business website with your work, reviews and an enquiry form, so people who hear about you can check and ask.',
      package: 'Business website',
    },
    measure:
      'Write down how each new customer heard about you for the next month.',
  },
  'Past customers rarely come back or refer others': {
    where: 'Past customers are not asked back',
    diy: 'List the customers from the last three months and send each one a personal message with something useful, not only a discount.',
    fix: {
      title: 'A customer list with follow-up reminders',
      what: 'One shared list of past customers with a reminder to follow up at the right time, sent and approved by your team.',
      package: 'One workflow',
    },
    measure: 'Count repeat orders each month from people already on the list.',
  },
  'Messages wait too long for a reply': {
    where: 'Customers wait for replies, and some give up',
    diy: 'Set WhatsApp Business quick replies and an away message that says when you will answer, then check chats at fixed times each day.',
    fix: {
      title: 'Faster first replies, with a person in charge',
      what: 'An assistant that answers common questions from information you approve and passes every order or unusual question to a named person.',
      package: 'Website or WhatsApp assistant',
    },
    measure:
      'Note how long twenty enquiries wait for a first reply this week, then compare after the change.',
  },
  'We answer the same questions again and again': {
    where: 'The same questions take up the day',
    diy: 'Write down the ten questions you answer most, with your best answer to each, and save them as quick replies.',
    fix: {
      title: 'Approved answers for the common questions',
      what: 'An assistant that uses only the answers you have approved for prices, delivery and opening hours, and passes anything else to your team.',
      package: 'Website or WhatsApp assistant',
    },
    measure:
      'Count how many enquiries a day still need someone to type a full answer.',
  },
  'We check price or stock before we can reply': {
    where: 'Replies wait while someone checks price or stock',
    diy: 'Keep one up-to-date price and stock list where everyone who answers messages can see it.',
    fix: {
      title: 'One price and stock list your replies read from',
      what: 'Your price and stock list joined to the place you answer customers, so the answer is on screen when the question arrives.',
      package: 'One workflow',
    },
    measure:
      'Time how long price or stock questions take to answer, before and after.',
  },
  'People go quiet after hearing the price': {
    where: 'Customers stop replying once they hear the price',
    diy: 'Two days after each quote, send one follow-up that explains what is included, and note who replies.',
    fix: {
      title: 'A quote that shows what it includes',
      what: 'A clear quote or catalogue page showing what each option includes, with a follow-up reminder your team sends.',
      package: 'Single page',
    },
    measure: 'Count quotes sent and quotes accepted each week.',
  },
  'Taking payment or a deposit is awkward': {
    where: 'Payment is where interested customers drop off',
    diy: 'Set up a payment link from your mobile money or Paystack account and send it with every confirmed order.',
    fix: {
      title: 'A simple way to pay and confirm',
      what: 'A payment link for each order and one list showing who has paid, checked by a person before anything is sent.',
      package: 'One workflow',
    },
    measure: 'Count orders confirmed but not yet paid at the end of each week.',
  },
  'Nobody follows up after the first message': {
    where: 'Enquiries end after the first message',
    diy: 'Keep a list of every open enquiry with the date, and follow each one up two days later.',
    fix: {
      title: 'An enquiry list with owners and next steps',
      what: 'Every enquiry kept in one place with an owner, a next action and a reminder when it goes quiet.',
      package: 'One workflow',
    },
    measure: 'Count open enquiries that have an owner and a next step.',
  },
  'Orders get lost, mixed up or forgotten': {
    where: 'Orders slip between chats, notes and memory',
    diy: 'Write every order in one notebook or sheet with the date, the customer, what was promised and who is doing it.',
    fix: {
      title: 'One order list the whole team can see',
      what: 'Every order written in one place with its details complete and its status visible to the team.',
      package: 'One workflow',
    },
    measure:
      'Count the orders each week that needed a second message to get missing details.',
  },
  'The same details are typed into several places': {
    where: 'The same details are typed more than once',
    diy: 'List every place an order is written down today, and stop using the one you need least.',
    fix: {
      title: 'Type it once, use it everywhere',
      what: 'Join the two tools you type into most, so a detail entered once appears in both.',
      package: 'One workflow',
    },
    measure: 'Note the minutes each day spent copying details between tools.',
  },
  'We chase customers for payment': {
    where: 'Money owed takes too long to come in',
    diy: 'Send every invoice on the day of the work, with a payment link and a due date, and check what is owed every Friday.',
    fix: {
      title: 'Invoices with reminders your team approves',
      what: 'Invoices sent with a payment link, and one list of what is owed with reminders a person approves before they go.',
      package: 'One workflow',
    },
    measure: 'Check the total owed for more than two weeks, every Friday.',
  },
  'We cannot see which products or customers make money': {
    where: 'You cannot see which products or customers pay',
    diy: 'For one month, write down each sale with what was sold and what it cost you to make or buy.',
    fix: {
      title: 'A small weekly numbers view',
      what: 'The few figures you need each week, taken from records you already keep and checked against the originals.',
      package: 'Reporting layer',
    },
    measure: 'Check each week whether the figures match your own records.',
  },
  'Stock runs out or piles up': {
    where: 'Stock is out when customers ask, or sits unsold',
    diy: 'Count your ten best sellers every Monday and write down what sold since the last count.',
    fix: {
      title: 'A stock list that warns you early',
      what: 'One stock list updated as orders come in, with a warning when a best seller runs low.',
      package: 'One workflow',
    },
    measure:
      'Count the times a customer asks for something that is out of stock.',
  },
  'Admin takes time that should go to customers': {
    where: 'Admin takes hours away from customers',
    diy: 'For one week, note each admin task and how long it took. The biggest one is where to start.',
    fix: {
      title: 'Take the biggest admin task off your plate',
      what: 'The most repeated admin task given a simple tool, with a person approving anything that goes out.',
      package: 'One workflow',
    },
    measure: 'Note the hours each week spent on that task, before and after.',
  },
  'We have an idea but have not tested it with customers': {
    where: 'The idea has not met real customers yet',
    diy: 'Describe the product in one paragraph and ask five people you would sell to whether they would pay for it.',
    fix: {
      title: 'Test it before building it',
      what: 'A clickable prototype you can put in front of real customers, ending with a clear decision on whether to build.',
      package: 'Prototype & validation',
    },
    measure: 'Count how many test users finish the main task without help.',
  },
  'Customers or staff need an app or portal': {
    where: 'People need a tool that does not exist yet',
    diy: 'Write down the three things people must be able to do in the app, and nothing else.',
    fix: {
      title: 'Prototype the one task that matters most',
      what: 'A prototype of the core task, tested with real users before a full build is quoted.',
      package: 'Prototype & validation',
    },
    measure:
      'Check whether test users complete the core task in the prototype.',
  },
  'We want to sell a service or course online': {
    where: 'The service is not yet sold online',
    diy: 'Write the offer and who it is for on one page, and share it with ten people who might buy.',
    fix: {
      title: 'A page that sells one offer',
      what: 'One page for one service or course, with a way to enquire that reaches a named person.',
      package: 'Single page',
    },
    measure: 'Count the enquiries or sign-ups from the page each week.',
  },
  'We tried to build it before and it stalled': {
    where: 'A previous build stalled',
    diy: 'Write down, in a few lines, where the last attempt stopped and why.',
    fix: {
      title: 'Restart small, with a prototype',
      what: 'Only the core task rebuilt as a tested prototype, so the next decision is made on evidence.',
      package: 'Prototype & validation',
    },
    measure:
      'Check whether real people use the prototype for the task it was built for.',
  },
};

const byProblem: Record<
  ProblemId,
  { headline: string; notYet: string; questions: string[] }
> = {
  leads: {
    headline: 'Help more of the right people find you and ask',
    notYet:
      'Leave paid adverts and a large website until one page is bringing enquiries you can count.',
    questions: [
      'Where do your best customers come from today?',
      'What does one new customer usually spend with you?',
    ],
  },
  customers: {
    headline: 'Turn more of the people who ask into buyers',
    notYet:
      'Leave a full online shop or app until replies and follow-up work on the channels customers already use.',
    questions: [
      'How many enquiries a week end without a sale?',
      'Which questions take longest to answer?',
    ],
  },
  profit: {
    headline: 'Stop the time and money slipping out of each sale',
    notYet:
      'Leave a full business system until one workflow is running and your team uses it every day.',
    questions: [
      'Which task takes the most time each week?',
      'What did the last mistake cost you?',
    ],
  },
  product: {
    headline: 'Test the new product with real people first',
    notYet: 'Leave the full build until real users have tried the prototype.',
    questions: [
      'Who is the first user, and what do they do today instead?',
      'What would make you continue or stop after the prototype?',
    ],
  },
  unsure: {
    headline: 'Find the one problem that costs you most',
    notYet:
      'Leave any build until the free assessment has found the problem that costs you most.',
    questions: [
      'When did a customer last give up waiting, and what happened?',
      'If one thing got better this month, what would it be?',
    ],
  },
};

const teamPhrase = (team: string) =>
  team === 'Just me' ? 'on your own' : team ? `with ${team.toLowerCase()}` : '';

export function mapperFallback(intake: MapperIntake): MapperReport {
  const problem = problemById(intake.problem);
  const frame = byProblem[intake.problem];
  const known = intake.symptoms
    .filter((symptom) => symptom !== OTHER && plays[symptom])
    .map((symptom) => ({ symptom, play: plays[symptom] }));
  const lead = known[0];

  const leaks = known.slice(0, 3).map(({ symptom, play }) => ({
    where: play.where,
    evidence: `You told us: "${symptom}".`,
  }));
  if (intake.symptomOther && leaks.length < 3)
    leaks.push({
      where: intake.symptomOther,
      evidence: 'In your words, from the list of where it happens.',
    });
  if (!leaks.length)
    leaks.push({
      where: problem.label,
      evidence: 'You chose this as the problem that hurts most.',
    });

  const volume =
    intake.volume && intake.volume !== 'Not sure'
      ? ` handling ${intake.volume.toLowerCase()} enquiries or orders a week`
      : '';
  const where = lead
    ? `, mostly where ${lead.symptom.charAt(0).toLowerCase()}${lead.symptom.slice(1)}`
    : '';
  const summary =
    `You run a ${businessPhrase(intake).toLowerCase()} business ${teamPhrase(intake.team)}${volume}. You said the main problem is that ${problem.sentence}${where}. Start with the smallest fix for that, try it on real work, then decide what comes next.`
      .replace(/\s+/g, ' ')
      .replace(/ \./g, '.');

  const channels = intake.channels.slice(0, 2).join(' and ');
  return {
    headline: frame.headline,
    summary,
    leaks,
    doThisWeek: known.length
      ? known.slice(0, 2).map(({ play }) => play.diy)
      : [
          'For one week, write down each time a customer waits, gives up or has to ask twice, with the day and what happened.',
        ],
    firstFix: lead
      ? {
          ...lead.play.fix,
          whyFirst: `You picked this first, and it sits closest to the problem you said hurts most${channels ? `, on ${channels}, which you already use` : ''}.`,
        }
      : {
          title: 'Start with the free assessment',
          what: 'A short conversation about how the business runs today, to find where customers, orders or time slip before anything is built.',
          whyFirst:
            'Your answers point at a real problem but not yet at one fix, and building before that is how money gets wasted.',
          package: FREE_ASSESSMENT,
        },
    steps: [
      'Walk through how this works today with the people who do it, using real recent examples.',
      `Set up the smallest version of the fix${channels ? ` on ${channels}` : ''}.`,
      'Run it on real work for two weeks, check the measure, and decide what to change next.',
    ],
    measure:
      lead?.play.measure ??
      'Agree one thing to count before anything changes, so the result can be judged honestly.',
    notYet: frame.notYet,
    humanControl:
      'Your team approves prices, payments and anything sent to a customer. The system prepares; a person decides.',
    questions: frame.questions,
  };
}
