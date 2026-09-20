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
  /** Slugs this product answered to before it was named what it is now. Only
   *  the waitlist reads them, because its rows were written under the old name
   *  and the people in them are still owed an email. */
  formerSlugs?: readonly string[];
};

/**
 * Our products run on their own hosting, so a product href leaves this site
 * while a free tool's href does not. The href is the only thing that says
 * which, and every surface that renders one has to make the same call: a plain
 * anchor and a new tab for one, Next's `Link` for the other.
 */
export function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

export const products: readonly Product[] = [
  {
    // It shipped as CV Forge and opened to the public as Aksen Careers. The
    // name here is the one on the door; the old slug stays in `formerSlugs` so
    // the waitlist rows written under it still read as a product rather than
    // as an orphaned string.
    slug: 'aksen-careers',
    formerSlugs: ['cv-forge'],
    name: 'Aksen Careers',
    category: 'Job search',
    // `href` is the only thing that decides whether this is something a visitor
    // can open: a separate `available` flag saying the same thing was one more
    // place for the truth to drift, so it is gone. It has an address now, so
    // the card links out and the waitlist form goes with it.
    status: 'Live, free to use',
    headline:
      'Find local or remote jobs, tailor your CV to each one, apply as yourself.',
    // It began as a CV reviewer. It now covers finding roles, preparing each
    // application and recording what came of it, so the copy here has to carry
    // the whole thing rather than the part it started as.
    description:
      'Our own job search product, open to anyone. Ask for the work you want in plain words and it reads thousands of live listings to find the ones that fit. Build a CV or improve the one you have, match it against a real advert, and get the application drafted. You read it and you send it. Searching needs no account, and it is free while we build it.',
    stages: [
      {
        title: 'The roles',
        items: [
          'Ask in plain words, by typing or out loud, and get an answer built for that question',
          'Thousands of live listings read from company career pages and remote job boards, updated every few hours',
          'Every result says what it matched on, so you can disagree with it',
          'Or add a role from any site by its link',
        ],
      },
      {
        title: 'Your CV',
        items: [
          'Build one from a short interview, by voice or by typing',
          'Or bring the CV you have and get it rewritten, with your jobs, dates and titles left as they are',
          'Save the versions you have checked and reuse them',
          'Download a clean PDF with real text, so screening software can read it',
        ],
      },
      {
        title: 'Each application',
        items: [
          'See what the advert asks for that your CV is missing before you spend an evening on it',
          'Draft a cover letter from your chosen CV and the actual advert, with the evidence behind each claim',
          'The questions the form will ask, answered from your CV',
          'Edit it, then approve it. Nothing goes out until you have read it',
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
      'It will not invent your visa status, your salary or your start date, and it refuses to answer a form question it cannot evidence from your CV. Applications we send ourselves need an employer whose system we can talk to. Everywhere else it hands you the employer’s own form and keeps the record. A submission is only ever marked confirmed when the employer confirms it.',
    href: 'https://aksen-careers.bishoptewogbade.workers.dev',
    action: 'Open Aksen Careers',
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
