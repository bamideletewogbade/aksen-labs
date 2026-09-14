import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Check, Minus } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { Reveal } from '@/components/agency-motion';
import {
  carePlans,
  exclusions,
  inclusions,
  pricingGroups,
  stages,
  pricingFaqs,
  pricingEnquiryHref,
  startingPoints,
} from '@/lib/pricing';
import {
  formatPrice,
  ratesReviewed,
  CURRENCY_INFO,
  allSetFor,
} from '@/lib/currency';
import { requestCurrency } from '@/lib/request-currency';
import { CurrencyPicker } from '@/components/currency-picker';
export const metadata: Metadata = {
  title: 'Pricing | Aksen Labs',
  description:
    'Indicative pricing in Ghana cedis, Nigerian naira or US dollars for websites, workflow automation, reporting and managed operations. Assess, build, operate — with a fixed quotation after scoping.',
};
export default async function PricingPage() {
  // Resolved on the server from a stated choice or the country Cloudflare
  // already attached to the request. No lookup, no client-side conversion,
  // and no moment where the reader sees the wrong currency first.
  const { currency, chosen, country } = await requestCurrency();
  // Whether every figure on this page is chosen for this market or derived from
  // the cedi. Asked of the data rather than hardcoded per currency, so adding
  // set prices for another market changes the sentence on its own.
  const pricesAreSet = allSetFor(
    [
      ...stages.map((stage) => stage.price),
      ...pricingGroups.flatMap((group) => group.packages.map((p) => p.price)),
      ...carePlans.map((plan) => plan.price),
    ],
    currency,
  );
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="pricing"
          currency={currency}
          label="PRICING"
          title={
            <>
              Real numbers.
              <br />
              <em>Before you ask.</em>
            </>
          }
          text="You should not have to fill in a form to find out what something costs. These are indicative figures, so you can judge whether a conversation is worth your time. Your final price is fixed in a written proposal once we agree the scope."
          target="#packages"
          action="Explore project budgets"
        />
        <section className="agency-container pricing-currency">
          <CurrencyPicker current={currency} />
          <p className="pricing-currency-note">
            {/* Set and converted are different promises, and saying the wrong
                one is worse than saying nothing. Naira figures are chosen for
                Nigeria and do not move when the cedi does; dollars are
                converted and the rate and its date are given so the reader can
                check the arithmetic. */}
            {currency === 'GHS' ? (
              <>
                Figures are in Ghana cedis, which is the currency of the
                contract.
              </>
            ) : pricesAreSet ? (
              <>
                These are our Nigerian prices, set for that market rather than
                converted from cedis, so they do not move when the exchange rate
                does. A contract may still be written in cedis, and we will say
                so before you sign anything.
              </>
            ) : (
              <>
                Converted from Ghana cedis at {CURRENCY_INFO[currency].symbol}
                {CURRENCY_INFO[currency].perCedi.toLocaleString('en-US')} to the
                cedi, set on {ratesReviewed} and rounded. Shown so you can judge
                the scale of a project; the contract is written in cedis, and
                the figure there is the one that binds.
              </>
            )}
            {!chosen && country && (
              <>
                {' '}
                Chosen because you appear to be reading from {country}. Change
                it above if that is wrong.
              </>
            )}
          </p>
        </section>
        <section id="stages" className="agency-container pricing-stages">
          {stages.map((stage, index) => (
            <Reveal key={stage.number} delay={index * 50}>
              <article className="pricing-stage">
                <span className="refresh-small-index">{stage.number}</span>
                <h2>{stage.title}</h2>
                <p className="pricing-stage-price">
                  {formatPrice(stage.price, currency)}
                  <span>{stage.cadence}</span>
                </p>
                <p>{stage.text}</p>
                <ul>
                  {stage.includes.map((item) => (
                    <li key={item}>
                      <Check size={15} />
                      {item}
                    </li>
                  ))}
                </ul>
                {index === 0 && (
                  <Link
                    className="agency-text-link"
                    href={pricingEnquiryHref('Assessment')}
                  >
                    Discuss an assessment <ArrowUpRight size={16} />
                  </Link>
                )}
              </article>
            </Reveal>
          ))}
        </section>
        {/* The figures above invite one obvious objection, so it is answered
            here rather than left for the visitor to answer on their own. */}
        <Reveal className="agency-container pricing-why">
          <p className="pricing-scope-note">
            Cheaper websites exist, and for some businesses they are the right
            answer. These figures buy what sits behind the page: connected
            systems, a team who can use them, and someone responsible after
            launch. If that is not what you need, an assessment will say so.
          </p>
        </Reveal>
        <section className="refresh-soft-band" id="packages">
          <div className="agency-container refresh-section pricing-groups">
            <div className="refresh-section-heading">
              <h2>
                What things cost,
                <br />
                <em>by the work involved.</em>
              </h2>
              <p>
                Ranges reflect scope, not negotiation. Simpler work sits at the
                lower end and we will tell you when your need is smaller than
                the package.
              </p>
            </div>
            <p className="pricing-scope-note">
              Project fees in {CURRENCY_INFO[currency].label}s. Timelines are
              estimates from an agreed kickoff with content, access and initial
              payment ready. <a href="#pricing-questions">Read the details below.</a>
            </p>
            {pricingGroups.map((group) => (
              <details
                className="pricing-disclosure"
                key={group.serviceId}
                id={group.serviceId}
              >
                <summary>
                  <span>
                    <strong>{group.title}</strong>
                    <small>{group.short}</small>
                  </span>
                  <span className="pricing-disclosure-hint">
                    {group.packages.length} options{' '}
                    <span aria-hidden="true">+</span>
                  </span>
                </summary>
                <ul className="pricing-table">
                  {group.packages.map((item) => (
                    <li key={item.name}>
                      <strong>{item.name}</strong>
                      <span className="pricing-figure">{formatPrice(item.price, currency)}</span>
                      <p>{item.scope}</p>
                      <span className="pricing-timing">{item.timing}</span>
                      <Link
                        className="agency-text-link pricing-package-link"
                        href={pricingEnquiryHref(item.name)}
                      >
                        Discuss {item.name.toLowerCase()}{' '}
                        <ArrowUpRight size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
        <section className="agency-container refresh-section pricing-care">
          <div className="refresh-section-heading">
            <h2>
              After launch,
              <br />
              <em>someone is responsible.</em>
            </h2>
            <p>
              Software that touches customers needs an owner. Care plans buy
              operating work, not just access. Included hours or tasks, coverage
              hours, response targets and extra-work rates are defined in your
              proposal before the plan starts.
            </p>
          </div>
          <div className="pricing-care-grid">
            {carePlans.map((plan, index) => (
              <Reveal key={plan.name} delay={index * 40}>
                <article>
                  <h3>{plan.name}</h3>
                  <span className="pricing-figure">{formatPrice(plan.price, currency)}</span>
                  <p className="pricing-care-for">{plan.bestFor}</p>
                  <p>{plan.coverage}</p>
                  <Link
                    className="agency-text-link"
                    href={pricingEnquiryHref(plan.name)}
                  >
                    Discuss this plan <ArrowUpRight size={16} />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="refresh-soft-band">
          <Reveal className="agency-container refresh-section pricing-terms">
            <div>
              <p className="agency-eyebrow">IN EVERY PRICE</p>
              <ul>
                {inclusions.map((item) => (
                  <li key={item}>
                    <Check size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="agency-eyebrow">NOT INCLUDED</p>
              <ul>
                {exclusions.map((item) => (
                  <li key={item}>
                    <Minus size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
        {/* The data and styling for this list already existed but nothing
            rendered it, so the page listed what things cost without ever saying
            which one a given reader should start with. */}
        <section className="agency-container refresh-section pricing-start">
          <div className="refresh-section-heading">
            <h2>
              Where to start,
              <br />
              <em>depending on where you are.</em>
            </h2>
            <p>
              Most people arrive knowing the problem rather than the product.
              Find the line that sounds like you.
            </p>
          </div>
          <ul className="pricing-start-list">
            {startingPoints.map((point) => (
              <li key={point.need}>
                <p>{point.need}</p>
                <Link className="agency-text-link" href={point.href}>
                  {point.step} <ArrowUpRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section
          id="pricing-questions"
          className="agency-container refresh-section pricing-faq"
        >
          <div className="refresh-section-heading">
            <h2>Before we begin.</h2>
            <p>The details that make your budget easier to plan.</p>
          </div>
          {pricingFaqs.map((faq) => (
            <details className="pricing-disclosure" key={faq.question}>
              <summary>
                {faq.question}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </section>
        <Reveal as="aside" className="agency-container refresh-mini-cta">
          <div>
            <p className="agency-eyebrow">NOT A QUOTATION</p>
            <p>
              These figures are indicative starting points. A proposal defines
              deliverables, assumptions, external costs and acceptance criteria.
            </p>
          </div>
          <Link className="agency-button" href="/agent-mapper">
            Get a scoped price
            <ArrowUpRight size={18} />
          </Link>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
