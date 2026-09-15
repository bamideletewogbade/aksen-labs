import { agencyDescription, services, approach } from './agency-content';
import { stages, carePlans, pricingGroups, pricingFaqs } from './pricing';
import { freeTools, products } from './product-catalog';
import { whatsappDisplay } from './contact-channels';
import { formatPrice, type Price } from './currency';

/** Every figure the assistant quotes is in cedis. See the pricing entry below. */
const cedis = (price: Price) => formatPrice(price, 'GHS');

export type SupportArticle = {
  id: string;
  title: string;
  href: string;
  keywords: string;
  content: string;
  /**
   * Where this entry's words actually come from, for whoever has to change
   * them later. Most of these are assembled from the same modules the public
   * site renders, so editing the article means editing the source, and the
   * knowledge screen previously gave no clue which one.
   *
   * Read by the admin only. The chat route sends the model id, title and
   * content and nothing else, so a file path cannot reach a prompt.
   */
  source: string;
};
export const knowledgeVersion = '2026-09-13';
export function supportArticles(): SupportArticle[] {
  return [
    {
      id: 'business-agents',
      source:
        'Written in lib/support-knowledge.ts. The tools themselves are in lib/agent-workbench.ts.',
      title: 'Free business agents',
      href: '/business-agents',
      keywords:
        'free agent tools automation opportunity finder service product planner lead magnet business brief',
      content:
        'Visitors can run three AI drafting tools: Automation Opportunity Finder, Service-to-Product Planner and Lead-Magnet Planner. They work from a supplied brief and return a draft for review, with a shared hourly allowance. They do not browse, build software, send messages or execute workflows. The private admin Agent desk has nine assistants and saved drafts. No paid agent subscription is offered.',
    },
    {
      id: 'agency',
      source:
        'agencyDescription in lib/agency-content.ts, plus a note written here.',
      title: 'About Aksen',
      href: '/about',
      keywords: 'aksen agency ghana nigeria africa location who company',
      content:
        agencyDescription +
        ' Ghana is our base, not a restriction to Ghana-only clients. Other markets depend on project fit and delivery arrangements. No other office locations are confirmed.',
    },
    ...services.map((s) => ({
      id: s.id,
      title: s.title,
      href: `/solutions#${s.id}`,
      source: 'services in lib/agency-content.ts, one entry per service.',
      keywords: `${s.title} ${s.capabilities.join(' ')} ${s.exampleScope.join(' ')}`,
      content: `${s.description} Capabilities: ${s.capabilities.join('; ')}. Deliverable: ${s.deliverable}. These are service capabilities subject to scoping, not integrations already installed for this visitor.`,
    })),
    {
      id: 'pricing',
      source:
        'stages, pricingGroups, carePlans and pricingFaqs in lib/pricing.ts. The same figures the pricing page renders.',
      title: 'Service pricing in GHS',
      href: '/pricing',
      keywords:
        'price pricing cost budget fee quote quotation cedi ghs assessment deposit payment care monthly support hours timeline delivery weeks credit refund',
      // Quoted in cedis whatever the site is displaying. The assistant answers
      // questions about what we will charge, and the contract is in cedis; the
      // other currencies are a convenience for reading the page.
      content: `All figures in Ghana cedis, the currency of the contract. ${stages.map((s) => `${s.title}: ${cedis(s.price)} ${s.cadence}`).join('; ')}. Packages: ${pricingGroups.flatMap((g) => g.packages.map((p) => `${p.name}: ${cedis(p.price)}; ${p.scope}; estimated ${p.timing}`)).join('\n')}. Care: ${carePlans.map((p) => `${p.name}: ${cedis(p.price)}; ${p.coverage}`).join('\n')}. ${pricingFaqs.map((f) => `${f.question} ${f.answer}`).join('\n')}`,
    },
    {
      id: 'process',
      source: 'approach in lib/agency-content.ts.',
      title: 'How we work',
      href: '/how-it-works',
      keywords:
        'process start work build launch discovery scope timeline kickoff approach consultation',
      content: approach
        .map((a) => `${a.title}: ${a.detail} Output: ${a.output}`)
        .join('\n'),
    },
    {
      id: 'catalog',
      source: 'products and freeTools in lib/product-catalog.ts.',
      title: 'Aksen products',
      href: '/products',
      keywords:
        'cv forge folio resume optimizer reviewer ats cover letter job search jobs application applications interview workspace product trial subscription signup demo free tools agents',
      content:
        products
          .map(
            (p) =>
              `${p.name}: ${p.status}. ${p.description} ${p.stages
                .map((s) => `${s.title}: ${s.items.join('; ')}`)
                .join('. ')}. ${p.limits || ''} ${p.href ? `Page: ${p.href}` : 'No public address yet; it cannot be used from this site.'}`,
          )
          .join('\n') +
        '\nFree to use here now: ' +
        freeTools
          .map((t) => `${t.name} (${t.status}) at ${t.href}`)
          .join('; ') +
        '.\nThese agency service prices are not product subscriptions. No public paid launch or guaranteed ATS score or hiring outcome is established.',
    },
    {
      id: 'examples',
      source:
        'Written in lib/support-knowledge.ts. Deliberately cautious: TFS is a proposal, not a delivered case study.',
      title: 'Industry scenarios',
      href: '/industries',
      keywords:
        'tfs frame shop examples case study client result portfolio proof furniture retail restaurant',
      content:
        'The Frame Shop (TFS) connected-commerce example is a proposed, illustrative system, not evidence of a completed client delivery. Examples explain how customer enquiries, custom sizing, checkout and workshop handoffs could connect. Do not claim measured savings, testimonials or past results.',
    },
    {
      id: 'support',
      source:
        'Written in lib/support-knowledge.ts. The WhatsApp number comes from lib/contact-channels.ts.',
      title: 'Talk to the team',
      href: '/agent-mapper',
      keywords:
        'human person contact support help broken login issue complaint refund urgent invoice order status existing project email whatsapp message phone number call',
      content: `Two ways to reach the team. The business enquiry form takes your goal and a reply address. Or message ${whatsappDisplay} on WhatsApp, which is a real number answered by a person and is not one of the fictional demonstrations on this site. This public assistant cannot view private accounts, invoices, orders or projects, book meetings, issue refunds, send emails or WhatsApp messages, accept payments or make commitments. Do not ask for passwords, card details or credentials. An escalation note can be recorded for the team, but it does not guarantee a reply or a booked appointment. Existing clients should use their agreed project support channel. No public response SLA is established, on either channel.`,
    },
    {
      id: 'demos',
      source:
        'Written in lib/support-knowledge.ts. The scenarios are supportScenarios, lower in the same file.',
      title: 'Try a support demonstration',
      href: '/support-demo',
      keywords:
        'demo demonstrate whatsapp chatbot agent assistant automate voice test',
      content:
        'The support demonstration uses fictional Cedar Home catalogue and order facts, or fictional Cedar Studio booking facts. It demonstrates answering from approved information, asking for missing information and handing off to a person. It does not send WhatsApp messages, create real orders, reserve appointments or connect a live phone number. A live WhatsApp deployment requires an agreed scope, business account/channel setup, approved knowledge, integration credentials, testing and handoff arrangements. This assistant is text based; voice and image input are not enabled here.',
    },
  ];
}
/** How many entries the assistant is given for one question. */
export const retrievedArticleLimit = 5;

export type ArticleMatch = {
  article: SupportArticle;
  score: number;
  /** The words from the question that this entry actually contains. */
  matched: string[];
};

/**
 * Scoring, exposed so the admin can show what the assistant would retrieve for
 * a question and why.
 *
 * Retrieval was invisible: the only way to find out whether an entry would ever
 * be reached was to ask the live assistant and infer it from the answer. That
 * made a badly keyworded entry impossible to spot until a customer hit it.
 *
 * retrieveSupportArticles is built on this rather than beside it, so the
 * preview cannot drift from the behaviour it claims to preview.
 */
export function scoreSupportArticles(
  question: string,
  history: string[] = [],
): ArticleMatch[] {
  const terms = [
    ...new Set(
      `${question} ${history.slice(-2).join(' ')}`
        .toLowerCase()
        .match(/[a-z0-9]{3,}/g) || [],
    ),
  ];
  return supportArticles()
    .map((article) => {
      const haystack = `${article.keywords} ${article.content}`.toLowerCase();
      const matched = terms.filter((term) => haystack.includes(term));
      return { article, score: matched.length, matched };
    })
    .sort((a, b) => b.score - a.score);
}

export function retrieveSupportArticles(
  question: string,
  history: string[] = [],
): SupportArticle[] {
  return scoreSupportArticles(question, history)
    .filter((x) => x.score > 0)
    .slice(0, retrievedArticleLimit)
    .map((x) => x.article);
}
export const supportScenarios = {
  commerce: {
    title: 'Custom orders',
    prompt: 'I want a shelf made to fit my room. What do you need?',
    facts:
      'FICTIONAL CEDAR HOME DEMO. Standard shelf: GHS 450, width 80 cm, natural oak finish. Custom dimensions and other finishes require a human quotation. Ask for width, height, finish and delivery area; no address or phone number is needed for this demo. Stock, lead time and delivery fee are unconfirmed. No customer-specific order lookup is available. Payment screenshots cannot verify a payment. No payment, order or refund can be processed in this demo.',
  },
  booking: {
    title: 'Booking enquiries',
    prompt: 'Can I book a design consultation tomorrow?',
    facts:
      'FICTIONAL CEDAR STUDIO DEMO. Offers 30-minute online design consultations. Ask for preferred day, timezone and topic. Calendar availability, fees and staff availability are unknown. Do not confirm a slot or create a booking. Summarize a proposed request for a human to confirm. No contact information is needed for this demo.',
  },
} as const;
export type SupportScenario = keyof typeof supportScenarios;
export function requestedHandoff(question: string) {
  return /\b(human|person|speak to|talk to|complaint|refund|password|my (?:order|invoice|project|account)|charged|urgent)\b/i.test(
    question,
  );
}
export function supportFallback(articles: SupportArticle[]) {
  const article = articles.find((a) => a.id === 'pricing') || articles[0];
  if (article?.id === 'pricing')
    // Every figure here is read from the published stages. A hard-coded build
    // price had already fallen out of step with the pricing page once.
    return `Our published assessment is ${cedis(stages[0].price)}, additional to a build and not automatically credited. A clear brief may go directly to quotation. Builds start ${cedis(stages[1].price).toLowerCase()}; monthly care starts ${cedis(stages[2].price).toLowerCase()}. All figures are in Ghana cedis, the currency of the contract. Scope, payment milestones, included support and dates are agreed in the proposal. Use the pricing page for the full ranges and exclusions.`;
  if (article?.id === 'catalog')
    return 'CV Forge is our own job search product. It builds or reviews a CV, finds roles, prepares each application against the real advert and records what happened next, and it only sends an application you have approved. It is built but has no public address yet, so it cannot be used from this site and there is nothing to sign up for. Ask to be told when it opens. The free business agents work here now with no account, and the order, support and workspace demonstrations use fictional businesses. None of these has a subscription price, and no paid plan is published.';
  return 'Aksen builds websites and online shops, connects business systems, creates useful reports and develops digital products. We are based in Ghana and welcome suitable projects across Africa and beyond. Describe what you want to improve, try a business agent or send an enquiry to discuss the work.';
}
