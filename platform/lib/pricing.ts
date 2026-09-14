import { formatPrice, type Price } from './currency';
import { services, type ServiceItem } from './agency-content';

export interface PricingStage {
  number: string;
  title: string;
  price: Price;
  cadence: string;
  text: string;
  includes: string[];
}

export interface PricingPackage {
  name: string;
  price: Price;
  scope: string;
  timing: string;
}

export interface PricingGroup {
  serviceId: string;
  title: ServiceItem['title'];
  short: ServiceItem['short'];
  packages: PricingPackage[];
}

export interface CarePlan {
  name: string;
  price: Price;
  bestFor: string;
  coverage: string;
}

export const stages: PricingStage[] = [
  {
    number: '01',
    title: 'Assess',
    price: { kind: 'exact', from: 1500 },
    cadence: 'fixed',
    text: 'One process examined properly before anyone builds anything. If the assessment shows the work is not worth doing, we say so.',
    includes: [
      'Discovery session with the people doing the work',
      'Current workflow mapped with a baseline measure',
      'Written implementation scope and estimate',
    ],
  },
  {
    number: '02',
    title: 'Build',
    price: { kind: 'from', from: 3000 },
    cadence: 'per project',
    text: 'A defined piece of work with agreed deliverables, acceptance criteria and a named owner on both sides.',
    includes: [
      'Written quotation after scope is agreed',
      'Payment milestones agreed in your proposal',
      'Review rounds and change process agreed before work starts',
    ],
  },
  {
    number: '03',
    title: 'Operate',
    price: { kind: 'from', from: 900 },
    cadence: 'per month',
    text: 'Someone responsible for the system after launch: monitoring, corrections and a monthly review of whether it still earns its place.',
    includes: [
      'Agreed support hours and response targets',
      'Approved model and channel budgets with cost alerts',
      'Monthly review of usage, quality and outcomes',
    ],
  },
];

const packagesByService: Record<string, PricingPackage[]> = {
  commerce: [
    // The entry rung. Without something at this level the stage above claims a
    // starting figure no listed package matches.
    {
      name: 'Single page',
      price: { kind: 'range', from: 3000, to: 6000 },
      scope:
        'One page with an enquiry form that reaches a named person with the details already complete, plus analytics and launch. The smallest thing we will build properly.',
      timing: '1–2 weeks',
    },
    {
      name: 'Campaign site',
      price: { kind: 'range', from: 6500, to: 10000 },
      scope:
        'One focused conversion journey, responsive build, enquiry form, analytics and launch.',
      timing: '2–3 weeks',
    },
    {
      name: 'Business website',
      price: { kind: 'range', from: 10000, to: 18000 },
      scope:
        'Core pages, services, proof, editable content structure, forms and basic search visibility.',
      timing: '3–5 weeks',
    },
    {
      name: 'Growth website',
      price: { kind: 'range', from: 18000, to: 35000 },
      scope:
        'Advanced journeys, content collections, lead qualification, integrations and reporting.',
      timing: '4–7 weeks',
    },
    {
      name: 'Website or WhatsApp assistant',
      price: { kind: 'range', from: 8000, to: 20000, note: 'add-on' },
      scope:
        'Approved knowledge, guided qualification, lead summaries, testing and human handoff.',
      timing: '2–4 weeks',
    },
  ],
  operations: [
    {
      name: 'One workflow',
      price: { kind: 'range', from: 9000, to: 12000 },
      scope:
        'One outcome and channel, up to two straightforward integrations, training and a defect-support period defined in the proposal.',
      timing: '3–4 weeks',
    },
    {
      name: 'Connected workflows',
      price: { kind: 'range', from: 18000, to: 30000 },
      scope:
        'A sequence across enquiry, proposal or delivery, with approvals and failure handling.',
      timing: '5–8 weeks',
    },
    {
      name: 'Internal copilot',
      price: { kind: 'range', from: 20000, to: 65000 },
      scope:
        'Approved knowledge, structured tools, permissions, evaluation and a staff-facing experience.',
      timing: 'Scoped',
    },
    {
      name: 'Multi-workflow programme',
      price: { kind: 'from', from: 60000 },
      scope:
        'Connected systems, governance, training and change management across more than one team.',
      timing: 'Scoped',
    },
  ],
  insight: [
    {
      name: 'Reporting layer',
      price: { kind: 'range', from: 12000, to: 45000 },
      scope:
        'Defined metrics, data connections, dashboards, alerts and an operating review rhythm.',
      timing: '3–6 weeks',
    },
    {
      name: 'Data consolidation',
      price: { kind: 'from', from: 8000 },
      scope:
        'Cleaning and joining scattered records so the reporting above can be trusted.',
      timing: 'Scoped by volume',
    },
  ],
  products: [
    {
      name: 'Prototype & validation',
      price: { kind: 'range', from: 8000, to: 20000 },
      scope:
        'Interactive prototype, user testing and a decision on whether to build.',
      timing: '2–4 weeks',
    },
    {
      name: 'Portal or web application',
      price: { kind: 'from', from: 30000 },
      scope:
        'Authentication, data workflows, dashboards, permissions and custom product logic.',
      timing: 'Scoped',
    },
  ],
};

export const pricingGroups: PricingGroup[] = services.map((service) => ({
  serviceId: service.id,
  title: service.title,
  short: service.short,
  packages: packagesByService[service.id],
}));

export const carePlans: CarePlan[] = [
  {
    name: 'Website care',
    price: { kind: 'from', from: 900, per: 'month' },
    bestFor: 'Business websites',
    coverage:
      'Monitoring, backups, minor updates and a technical support allowance.',
  },
  {
    name: 'Assistant care',
    price: { kind: 'from', from: 1500, per: 'month' },
    bestFor: 'Website and channel assistants',
    coverage:
      'Website care plus knowledge updates, response monitoring and a monthly review.',
  },
  {
    name: 'Managed operations',
    price: { kind: 'range', from: 4000, to: 18000, per: 'month' },
    bestFor: 'Live operational workflows',
    coverage:
      'Incident triage, evaluation, cost and quality review, planned improvements and reporting.',
  },
  {
    name: 'Transformation partner',
    price: { kind: 'custom', label: 'Custom retainer' },
    bestFor: 'Several teams and workflows',
    coverage:
      'Roadmap, governance, delivery leadership, change management and portfolio review.',
  },
];

export const inclusions = [
  'A bounded job, a success definition, failure handling and a named owner.',
  'Approved knowledge or data sources with explicit permissions.',
  'Human approval where the business consequence requires it.',
  'Testing across common, difficult, ambiguous and failure scenarios.',
  'Visibility of usage, cost, errors and outcomes appropriate to the scope.',
];

export const exclusions = [
  'Taxes, travel, hardware and specialist licences.',
  'Third-party model, WhatsApp, voice, email, storage and hosting usage, which is separated or covered by an approved allowance.',
  'Paid media budgets, production crews and specialist translation.',
  'New requirements after sign-off, which go through written change control first.',
];

export const startingPoints: { need: string; step: string; href: string }[] = [
  {
    need: 'You are not ready to spend anything yet',
    step: 'Free business agents',
    href: '/business-agents',
  },
  {
    need: 'You need a credible presence and better enquiries',
    step: 'Business or growth website',
    href: '/solutions#commerce',
  },
  {
    need: 'You have a workflow problem but the scope is unclear',
    step: 'Assessment first',
    href: '/how-it-works',
  },
  {
    need: 'You want proof that one workflow can run safely',
    step: 'One workflow build',
    href: '/solutions#operations',
  },
  {
    need: 'You cannot see what is working week to week',
    step: 'Reporting layer',
    href: '/solutions#insight',
  },
  {
    need: 'You have an idea for a new digital service',
    step: 'Prototype and validation',
    href: '/solutions#products',
  },
];

// The assessment figure appears in these answers and in stages[0]. Written out
// twice it drifts, which is how the published build price once disagreed with
// the pricing page. Quoted in cedis deliberately: the answer is about what the
// contract says, and the contract is in cedis.
const assessmentFee = formatPrice(stages[0].price, 'GHS');

export const pricingFaqs = [
  {
    question: `Do I need the ${assessmentFee} assessment?`,
    answer:
      'For an unclear workflow or a complex system, we recommend a separate assessment of one process. A straightforward project with a clear brief can go directly to a quotation. We agree the assessment scope before you pay.',
  },
  {
    question: 'Is the assessment included in the build price?',
    answer: `No. The ${assessmentFee} pays for the assessment and written implementation scope. It is additional to the build and is not automatically credited. Any agreed credit will be stated in your proposal. You can stop after the assessment without commissioning a build.`,
  },
  {
    question: 'What does monthly care actually cover?',
    answer:
      'Each care proposal specifies included hours or tasks, support channels, coverage hours, response targets, and whether unused time rolls over. Response targets describe an initial response, not a guaranteed resolution time. Extra work needs a separate estimate and your agreement; care is not unlimited development or automatic 24/7 support.',
  },
  {
    question: 'When does the delivery window start?',
    answer:
      'The ranges are planning estimates from the agreed kickoff, once scope is signed off, any agreed initial payment is received, and required content, access and data are available. Your proposal sets the schedule and feedback deadlines. Delayed approvals, external providers or scope changes can move the dates.',
  },
  {
    question: 'How do payments and changes work?',
    answer:
      'Your written proposal sets the payment milestones, review rounds, acceptance criteria and defect-support period. New requirements are estimated and approved before work proceeds. The indicative figures here are not a binding quotation.',
  },
  {
    question: 'Are taxes and running costs included?',
    answer:
      'The listed service fees exclude applicable taxes and external costs. Your quotation itemises any applicable taxes and separates hosting, licences, model usage and messaging fees, or defines an approved usage allowance. We agree these costs before you commit.',
  },
  {
    question: 'What do the free business agents cost?',
    answer:
      'Nothing, and there is no account to create. They produce a draft you can read and download. They do not connect to your tools or change anything in your business, so a draft is a starting point for a conversation rather than a trial of paid work. Use one before you decide whether any of the figures on this page are worth discussing.',
  },
  {
    question: 'Are these prices for CV Forge or the free tools?',
    answer:
      'No. These are agency service budgets, including building custom products for clients. CV Forge is our own product and has no public address or price yet. The business agents and the demonstrations on this site are free and have no subscription.',
  },
];

export function resolvePricingSelection(value: unknown) {
  if (typeof value !== 'string' || value.length > 120) return undefined;
  const choices = [
    { name: 'Assessment', price: stages[0].price },
    ...pricingGroups.flatMap((group) => group.packages),
    ...carePlans,
  ];
  const choice = choices.find((item) => item.name === value);
  return choice ? { name: choice.name, price: choice.price } : undefined;
}
export function pricingEnquiryHref(name: string) {
  return `/agent-mapper?package=${encodeURIComponent(name)}`;
}
