import { cookies, headers } from 'next/headers';
import { currencyForCountry, isCurrency, type Currency } from './currency';

/**
 * Which currency to render for this request.
 *
 * A stated choice wins. Otherwise the country Cloudflare already attached to
 * the request decides, which costs nothing: the header arrives with the
 * request, so there is no lookup, no third-party call, and no moment where the
 * page shows one currency and then swaps it for another.
 */
export async function requestCurrency(): Promise<{
  currency: Currency;
  chosen: boolean;
  country: string | null;
}> {
  const store = await cookies();
  const stated = store.get('currency')?.value;
  if (isCurrency(stated))
    return { currency: stated, chosen: true, country: null };

  const country = (await headers()).get('cf-ipcountry');
  return {
    currency: currencyForCountry(country),
    chosen: false,
    // 'XX' is what Cloudflare sends for a client it cannot place, and 'T1' for
    // Tor. Neither is a country, and reporting them as one would be worse than
    // saying nothing.
    country: country && !['XX', 'T1'].includes(country) ? country : null,
  };
}
