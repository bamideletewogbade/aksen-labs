/**
 * Products are built by Aksen and run on their own hosting. This page describes
 * them and links out; it is not where anyone uses them. Anything usable on this
 * site is a free tool or a demo, listed separately below.
 */
/** One step of a product, with the work it does. Flat feature lists stopped
 *  being useful once a product covered more than one job. */
export type ProductStage = {
  title: string;
  items: readonly string[];
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  status: string;
  headline: string;
  description: string;
  stages: readonly ProductStage[];
  /** What we are honest about. Rendered as the product's own small print. */
  limits?: string;
  /** Absent until the product is hosted, so the card cannot link nowhere. */
  href?: string;
  action?: string;
};

export const products: readonly Product[] = [
  {
    slug: 'cv-forge',
    name: 'CV Forge',
    category: 'Job search',
    // No public address yet. The card says so rather than offering a link that
    // goes nowhere or a page that pretends to be the product. `href` is the only
    // thing that decides: a separate `available` flag saying the same thing was
    // one more place for the truth to drift, so it is gone.
    status: 'Built, not yet public',
    headline: 'One profile. Your whole job search.',
    // It began as a CV reviewer. It now covers finding roles, preparing each
    // application and recording what came of it, so the copy here has to carry
    // the whole thing rather than the part it started as.
    description:
      'It started as a CV builder and reviewer. It now carries the rest of the search too. Save a CV you have checked, find roles, prepare each application against the real advert, and keep a record of what happened next. Nothing is sent until you have read it and approved it.',
    stages: [
      {
        title: 'Your CV',
        items: [
          'Build one from a short interview, by voice or by typing',
          'Or bring the CV you have and get it scored and strengthened',
          'Save the versions you have checked and reuse them',
          'Export as PDF, Word or plain text',
        ],
      },
      {
        title: 'The roles',
        items: [
          'Search public job feeds, or add a role from any site by its link',
          'Rank what comes back against the roles, countries and skills you saved',
          'See who can actually apply before you spend an evening on it',
        ],
      },
      {
        title: 'Each application',
        items: [
          'Draft a cover letter from your chosen CV and the actual advert',
          'See the evidence behind each claim and what the advert asks for that you do not have',
          'Edit it, then approve it. Approved work goes out one at a time, under a daily limit you set',
        ],
      },
      {
        title: 'What happens after',
        items: [
          'Record interviews, offers and rejections against the application they belong to',
          'Prepare with questions written from that specific role',
          'Export everything you have saved, or delete the account and it goes',
        ],
      },
    ],
    limits:
      'Applications we send ourselves need an employer whose system we can talk to. Everywhere else it hands you the employer’s own form and keeps the record. A submission is only ever marked confirmed when the employer confirms it.',
  },
] as const;

/**
 * Usable on this site today. Free, and honest about what each one is.
 *
 * `kind` is the difference that matters to a visitor and it used to live only in
 * a sentence of prose, which then said two of each when there is one working
 * tool and three demonstrations. The page groups on this field now, so the two
 * cannot disagree again.
 */
export type FreeTool = {
  slug: string;
  name: string;
  status: string;
  kind: 'tool' | 'demonstration';
  description: string;
  href: string;
  action: string;
};

export const freeTools: readonly FreeTool[] = [
  {
    slug: 'business-agents',
    name: 'Business agents',
    status: 'Free, no account',
    kind: 'tool',
    description:
      'Three assistants that read a brief about your business and return a draft you can act on: where to automate first, how to turn a service into a product, and what a useful lead magnet would be.',
    href: '/business-agents',
    action: 'Run one now',
  },
  {
    slug: 'order-demo',
    name: 'Order walkthrough',
    status: 'Demonstration',
    kind: 'demonstration',
    description:
      'Follow one enquiry through specification, quote, payment check and workshop handover. Uses a fictional business; no real order or payment is created.',
    href: '/order-demo',
    action: 'Walk through it',
  },
  {
    slug: 'support-demo',
    name: 'Support assistant',
    status: 'Demonstration',
    kind: 'demonstration',
    description:
      'See an assistant answer from approved information, ask for what is missing, and hand over to a person instead of guessing.',
    href: '/support-demo',
    action: 'Try the assistant',
  },
  {
    slug: 'workspace-demo',
    name: 'Workspace',
    status: 'Demonstration',
    kind: 'demonstration',
    description:
      'A document assistant prepares a brief or a proposed scope, and a person reviews it before anything counts as decided.',
    href: '/workspace-demo',
    action: 'Explore the demo',
  },
] as const;
