/**
 * Products are built by Aksen and run on their own hosting. This page describes
 * them and links out; it is not where anyone uses them. Anything usable on this
 * site is a free tool or a demo, listed separately below.
 */
export type Product = {
  slug: string;
  name: string;
  category: string;
  status: string;
  available: boolean;
  headline: string;
  description: string;
  features: readonly string[];
  /** Absent until the product is hosted, so the card cannot link nowhere. */
  href?: string;
  action?: string;
};

export const products: readonly Product[] = [
  {
    slug: 'cv-forge',
    name: 'CV Forge',
    category: 'Career tools',
    // No public address yet. The card says so rather than offering a link that
    // goes nowhere or a page that pretends to be the product.
    status: 'Built, not yet public',
    available: false,
    headline: 'Let your experience speak clearly.',
    description:
      'A CV reviewer and builder. It reads a CV you already have, scores it, and explains what to strengthen. If you do not have one yet, a short interview writes it with you.',
    features: [
      'Reviews a PDF or Word CV against six dimensions',
      'Builds a CV from a short interview, by voice or text',
      'Exports as PDF, Word or plain text',
      'Shows the model, cost and timing behind every result',
    ],
  },
] as const;

/** Usable on this site today. Free, and honest about what each one is. */
export const freeTools = [
  {
    slug: 'business-agents',
    name: 'Business agents',
    status: 'Free, no account',
    description:
      'Three assistants that read a brief about your business and return a draft you can act on: where to automate first, how to turn a service into a product, and what a useful lead magnet would be.',
    href: '/business-agents',
    action: 'Run one now',
  },
  {
    slug: 'order-demo',
    name: 'Order walkthrough',
    status: 'Demonstration',
    description:
      'Follow one enquiry through specification, quote, payment check and workshop handover. Uses a fictional business; no real order or payment is created.',
    href: '/order-demo',
    action: 'Walk through it',
  },
  {
    slug: 'support-demo',
    name: 'Support assistant',
    status: 'Demonstration',
    description:
      'See an assistant answer from approved information, ask for what is missing, and hand over to a person instead of guessing.',
    href: '/support-demo',
    action: 'Try the assistant',
  },
  {
    slug: 'workspace-demo',
    name: 'Workspace',
    status: 'Demonstration',
    description:
      'A document assistant prepares a brief or a proposed scope, and a person reviews it before anything counts as decided.',
    href: '/workspace-demo',
    action: 'Explore the demo',
  },
] as const;
