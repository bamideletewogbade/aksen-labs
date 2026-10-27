/**
 * The Front Desk demo: one fictional shop, and the rules its agent works inside.
 *
 * This is the shop from the homepage story (the 5 litre shea butter, Spintex
 * Road, GHS 30 delivery), given a name and a short price list so a visitor can
 * talk to it instead of watching it. It is fictional and every surface says so.
 *
 * Everything with a number in it lives here, not in the prompt. The model
 * looks prices up and the code adds them up, because a model that does
 * arithmetic on a customer's total is a model that will one day get it wrong
 * in the customer's favour or against it. That is the same line the brief
 * draws for real clients: it quotes the owner's list, it never sets a price.
 */

export const frontDeskVersion = '2026-10-18';

export const shop = {
  name: 'Nkuto Naturals',
  note: 'A fictional skincare shop in Accra, built for this demonstration.',
  hours: 'Orders are packed Monday to Saturday, 8am to 6pm.',
};

export type CatalogueItem = {
  sku: string;
  name: string;
  /** Pesewas, so totals are whole numbers. */
  pricePesewas: number;
  inStock: boolean;
  keywords: string[];
};

export const catalogue: CatalogueItem[] = [
  {
    sku: 'shea-5l',
    name: 'Raw shea butter, 5 litre tub',
    pricePesewas: 48000,
    inStock: true,
    keywords: ['shea', 'butter', '5', 'litre', 'liter', 'tub', 'big'],
  },
  {
    sku: 'shea-1l',
    name: 'Raw shea butter, 1 litre jar',
    pricePesewas: 11000,
    inStock: true,
    keywords: ['shea', 'butter', '1', 'litre', 'liter', 'jar', 'small'],
  },
  {
    sku: 'soap-500',
    name: 'African black soap, 500 g',
    pricePesewas: 4500,
    inStock: true,
    keywords: ['black', 'soap', 'alata', 'samina', '500'],
  },
  {
    sku: 'coconut-1l',
    name: 'Cold-pressed coconut oil, 1 litre',
    pricePesewas: 8500,
    inStock: false,
    keywords: ['coconut', 'oil', '1', 'litre', 'liter'],
  },
];

export type DeliveryArea = {
  area: string;
  feePesewas: number;
  days: string;
  /** Neighbourhoods a customer is likelier to type than the city. */
  places: string[];
};

export const deliveryAreas: DeliveryArea[] = [
  {
    area: 'Accra',
    feePesewas: 3000,
    days: 'next working day',
    places: [
      'spintex',
      'osu',
      'legon',
      'madina',
      'cantonments',
      'dansoman',
      'lapaz',
      'achimota',
      'labone',
      'adenta',
      'dzorwulu',
      'airport',
    ],
  },
  {
    area: 'Tema',
    feePesewas: 4000,
    days: 'next working day',
    places: ['community', 'sakumono', 'lashibi', 'ashaiman'],
  },
  {
    area: 'Kasoa',
    feePesewas: 4500,
    days: 'within two working days',
    places: ['buduburam', 'galilea'],
  },
];

export const cedis = (pesewas: number) =>
  `GHS ${(pesewas / 100).toLocaleString('en-GH', {
    minimumFractionDigits: pesewas % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;

const words = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Best matches first. An empty query returns the whole list, which is short. */
export function searchCatalogue(query: string): CatalogueItem[] {
  const asked = words(query);
  if (!asked.length) return catalogue;
  return catalogue
    .map((item) => ({
      item,
      score: asked.filter((word) => item.keywords.includes(word)).length,
    }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((match) => match.item);
}

/** Areas match on the city or a listed neighbourhood, so "East Legon" finds Accra. */
export function findDeliveryArea(place: string): DeliveryArea | null {
  const asked = words(place);
  return (
    deliveryAreas.find((area) =>
      [area.area.toLowerCase(), ...area.places].some((name) =>
        asked.includes(name),
      ),
    ) ?? null
  );
}

export type OrderLine = { sku: string; quantity: number };

export type OrderDraft = {
  lines: Array<{
    sku: string;
    name: string;
    quantity: number;
    unit: string;
    lineTotal: string;
  }>;
  delivery: { area: string; fee: string; days: string } | null;
  total: string | null;
  missing: string[];
  problems: string[];
  ready: boolean;
};

/**
 * Turns what the agent collected into an order the owner would recognise.
 *
 * `ready` means every field is present and every line is on the list and in
 * stock. It does not mean anything was sent or paid: in a live build the
 * payment link comes from Paystack after this, and in the demo nothing leaves
 * the page at all.
 */
export function draftOrder(input: {
  lines: OrderLine[];
  customerName?: string;
  phone?: string;
  area?: string;
  address?: string;
}): OrderDraft {
  const problems: string[] = [];
  const lines: OrderDraft['lines'] = [];
  let subtotal = 0;
  for (const line of input.lines.slice(0, 6)) {
    const item = catalogue.find((entry) => entry.sku === line.sku);
    if (!item) {
      problems.push(`"${line.sku}" is not on the price list.`);
      continue;
    }
    if (!item.inStock) {
      problems.push(`${item.name} is out of stock.`);
      continue;
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      problems.push(`Confirm a whole quantity for ${item.name}.`);
      continue;
    }
    if (line.quantity > 10) {
      problems.push(
        `${line.quantity} of ${item.name} is a bulk order, which the owner prices.`,
      );
      continue;
    }
    const lineTotal = item.pricePesewas * line.quantity;
    subtotal += lineTotal;
    lines.push({
      sku: item.sku,
      name: item.name,
      quantity: line.quantity,
      unit: cedis(item.pricePesewas),
      lineTotal: cedis(lineTotal),
    });
  }
  const area = input.area ? findDeliveryArea(input.area) : null;
  if (input.area && !area)
    problems.push(
      `${input.area} is outside the listed delivery areas, so the owner sets that fee.`,
    );
  const missing = [
    ...(lines.length ? [] : ['at least one item from the list']),
    ...(input.customerName?.trim() ? [] : ['a name for the order']),
    ...(input.phone?.trim() ? [] : ['a number the rider can call']),
    ...(input.area?.trim() ? [] : ['the delivery area']),
    ...(input.address?.trim() ? [] : ['the delivery address']),
  ];
  const total = lines.length && area ? cedis(subtotal + area.feePesewas) : null;
  return {
    lines,
    delivery: area
      ? { area: area.area, fee: cedis(area.feePesewas), days: area.days }
      : null,
    total,
    missing,
    problems,
    ready: !missing.length && !problems.length,
  };
}

/** The reasons an enquiry goes to a person. Each one is something it may not decide. */
export const HANDOVER_REASONS = [
  'price not on the list',
  'discount or special request',
  'delivery outside the listed areas',
  'a date or time not already offered',
  'complaint or refund',
  'payment problem',
  'anything it is unsure about',
] as const;
export type HandoverReason = (typeof HANDOVER_REASONS)[number];

export const frontDeskStarters = [
  'Do you have the big shea butter? How much to Spintex?',
  'I want 2 black soaps and the 1 litre shea, delivery to Tema',
  'Can you do 20 tubs at a discount for my salon?',
  'Is coconut oil in stock?',
];
