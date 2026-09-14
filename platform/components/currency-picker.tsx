'use client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CURRENCIES, CURRENCY_INFO, type Currency } from '@/lib/currency';
import { Spinner } from '@/components/ui/activity';

/**
 * Switching currency writes a cookie and asks the server to re-render.
 *
 * The prices are rendered on the server, so the alternative was shipping the
 * whole price list and the rate table to the browser and converting there.
 * That costs bytes on every visit to serve a choice most people never make,
 * and it would show cedis for a moment before correcting itself.
 *
 * A cookie also means the choice survives to the next page. Local storage
 * would not: the server renders the price before any script has run, so the
 * second page would be wrong until it corrected itself in front of the reader.
 */
/**
 * Kept outside the component because it writes to `document`, which the React
 * compiler treats as a value a component may not modify. A year is long enough
 * that nobody is asked twice.
 */
function rememberCurrency(next: Currency) {
  document.cookie = `currency=${next}; path=/; max-age=31536000; samesite=lax`;
}

export function CurrencyPicker({ current }: { current: Currency }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useState<Currency>(current);

  function choose(next: Currency) {
    if (next === shown) return;
    // Optimistic, so the pressed state moves the instant it is clicked while
    // the server re-renders behind it.
    setShown(next);
    rememberCurrency(next);
    startTransition(() => router.refresh());
  }

  return (
    <div className="currency-picker" data-pending={pending || undefined}>
      {/* A fieldset and legend, rather than a div with role="group": the
          grouping is then real rather than asserted, and the legend is the
          accessible name without a second element to point at. */}
      <fieldset className="currency-picker-field">
        <legend className="currency-picker-label">Show prices in</legend>
        <div className="currency-picker-options">
          {CURRENCIES.map((code) => {
            const info = CURRENCY_INFO[code];
            return (
              <button
                key={code}
                type="button"
                aria-pressed={shown === code}
                title={info.label}
                onClick={() => choose(code)}
              >
                <b>{info.symbol}</b>
                {code}
              </button>
            );
          })}
        </div>
      </fieldset>
      {pending && <Spinner size={13} />}
    </div>
  );
}
