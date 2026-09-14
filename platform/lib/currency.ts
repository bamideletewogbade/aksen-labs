/**
 * Prices in three currencies, with no network call anywhere.
 *
 * Ghana and Nigeria are the first two markets and most visitors are in one of
 * them, so a price list denominated only in cedis asks a Lagos reader to do
 * arithmetic before they can decide whether to keep reading.
 *
 * Rates are published and fixed rather than fetched live, for three reasons.
 * A quote that moves between the morning and the afternoon is not a quote. A
 * live rate means a network call on a page that should render instantly, and a
 * provider that can be down or slow. And cedi to naira moved between 115 and
 * 123 in a single week, which would have shown three different prices to three
 * visitors on the same day for no commercial reason.
 *
 * The trade is that published rates drift from spot. That is why the page says
 * which rate it used and when it was set, and why the cedi is named as the
 * currency of the contract.
 */

export const CURRENCIES = ['GHS', 'NGN', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

/** When these rates were last checked against mid-market. Shown to the reader. */
export const ratesReviewed = '14 September 2026';

type CurrencyInfo = {
  code: Currency;
  label: string;
  symbol: string;
  /** Units of this currency per one Ghana cedi. */
  perCedi: number;
  /**
   * Converted amounts are rounded to this step. Mechanical conversion produces
   * figures like 131.25 and 173,385, which read as a spreadsheet rather than a
   * price, and invite the reader to wonder what the precision is hiding.
   */
  step: number;
  /** Countries served this currency by default. */
  countries: string[];
};

export const CURRENCY_INFO: Record<Currency, CurrencyInfo> = {
  GHS: {
    code: 'GHS',
    label: 'Ghana cedi',
    symbol: 'GH₵',
    perCedi: 1,
    step: 50,
    countries: ['GH'],
  },
  NGN: {
    code: 'NGN',
    label: 'Nigerian naira',
    symbol: '₦',
    perCedi: 120,
    step: 5000,
    countries: ['NG'],
  },
  USD: {
    code: 'USD',
    label: 'US dollar',
    symbol: '$',
    // About 11.43 cedis to the dollar.
    perCedi: 0.0875,
    step: 10,
    countries: [],
  },
};

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && CURRENCIES.includes(value as Currency);
}

/**
 * The currency to show someone who has not chosen one.
 *
 * Cloudflare puts the visitor's country in a request header at the edge, so
 * this costs nothing: no lookup service, no client-side geolocation prompt,
 * and no flash of the wrong price while something resolves.
 */
export function currencyForCountry(country: string | null): Currency {
  const code = (country || '').toUpperCase();
  for (const info of Object.values(CURRENCY_INFO)) {
    if (info.countries.includes(code)) return info.code;
  }
  // Everyone else is quoted in dollars rather than in a currency they would
  // have to convert twice.
  return 'USD';
}

/** Rounded to the currency's step, and never to zero. */
export function convert(cedis: number, currency: Currency): number {
  const info = CURRENCY_INFO[currency];
  const raw = cedis * info.perCedi;
  const rounded = Math.round(raw / info.step) * info.step;
  return rounded > 0 ? rounded : info.step;
}

export function formatMoney(cedis: number, currency: Currency): string {
  const info = CURRENCY_INFO[currency];
  return `${info.symbol}${convert(cedis, currency).toLocaleString('en-US')}`;
}

/* ---------------- prices ---------------- */

/**
 * A price is a shape, not a sentence. It used to be a formatted string like
 * "GHS 18,000–35,000", which cannot be converted, compared or sorted, and
 * hid the currency inside prose so that adding a second one meant rewriting
 * every entry by hand.
 */
/**
 * A figure set for one market rather than converted into it.
 *
 * Converting Ghana pricing into naira answers the wrong question. It tells a
 * Lagos business what we charge in Accra, when what matters is what the work
 * is worth to them, against what else they could spend it on. Where a price is
 * set here it is used as written: no rate, no rounding step, no drift when the
 * cedi moves.
 */
export type SetPrice = { from: number; to?: number };

type PriceBase = {
  per?: 'month';
  note?: string;
  /** Markets where the figure is chosen rather than derived. */
  set?: Partial<Record<Currency, SetPrice>>;
};

export type Price =
  | ({ kind: 'exact'; from: number } & PriceBase)
  | ({ kind: 'from'; from: number } & PriceBase)
  | ({ kind: 'range'; from: number; to: number } & PriceBase)
  | { kind: 'custom'; label: string };

/** True when this currency has its own figure rather than a converted one. */
export function isSetPrice(price: Price, currency: Currency): boolean {
  return price.kind !== 'custom' && !!price.set?.[currency];
}

/** Whether every price in a list is set for this market rather than converted. */
export function allSetFor(prices: Price[], currency: Currency): boolean {
  const priced = prices.filter((price) => price.kind !== 'custom');
  return (
    priced.length > 0 && priced.every((price) => isSetPrice(price, currency))
  );
}

export function formatPrice(price: Price, currency: Currency): string {
  if (price.kind === 'custom') return price.label;
  const suffix = `${price.per === 'month' ? '/mo' : ''}${
    price.note ? ` ${price.note}` : ''
  }`;
  const info = CURRENCY_INFO[currency];
  const set = price.set?.[currency];

  // A figure chosen for a market is used exactly as written. Rounding it to
  // the conversion step would move a deliberate number by a step meant for
  // arithmetic nobody did here.
  const low = set ? set.from : convert(price.from, currency);
  const high =
    price.kind === 'range'
      ? set?.to !== undefined
        ? set.to
        : convert(price.to, currency)
      : undefined;

  if (high !== undefined) {
    // The symbol appears once. Repeating it on both ends of a range reads as
    // two separate prices rather than as one span.
    return `${info.symbol}${low.toLocaleString('en-US')}–${high.toLocaleString('en-US')}${suffix}`;
  }
  return `${price.kind === 'from' ? 'From ' : ''}${info.symbol}${low.toLocaleString('en-US')}${suffix}`;
}

/** The smallest figure a price implies, for sorting and comparison. */
export function priceFloor(price: Price): number {
  return price.kind === 'custom' ? Number.POSITIVE_INFINITY : price.from;
}
