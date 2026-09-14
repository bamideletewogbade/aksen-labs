import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { PageIntro } from '@/components/page-intro';
import { PageTabs } from '@/components/page-tabs';
import { AgentGallery } from '@/components/agent-gallery';
import { freeTools, products } from '@/lib/product-catalog';

export const metadata: Metadata = {
  title: 'Products and tools | Aksen Labs',
  description:
    'Free tools you can use on this site today, examples of AI at work, and the products Aksen Labs has built.',
};

/**
 * One page for everything we have made, in three tabs.
 *
 * It used to be three: a Products page that already listed the free tools, a
 * Free tools nav item pointing at one of those tools, and an orphaned AI
 * examples page reachable only from the footer. Three addresses for one
 * question, which is "what can I actually use".
 *
 * The free tools open first, deliberately. They are the only things on the site
 * a visitor can use without talking to anyone, and we have exactly one product,
 * which does not have a public address yet. Leading with the products tab would
 * put the emptiest shelf at the front.
 */

function FreeToolsPanel() {
  return (
    <section className="agency-container refresh-section" id="free-tools-panel">
      <div className="refresh-section-heading">
        <h2>
          Free to use,
          <br />
          <em>right here.</em>
        </h2>
        <p>
          No account, no charge. Two are working assistants you can point at
          your own business; two are demonstrations using fictional businesses,
          and say so on the page.
        </p>
      </div>
      <ul className="tool-list">
        {freeTools.map((tool, index) => (
          <Reveal as="li" key={tool.slug} delay={index * 40}>
            <Link href={tool.href}>
              <span className="tool-status">{tool.status}</span>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
              <span className="tool-action">
                {tool.action} <ArrowUpRight size={16} />
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function ExamplesPanel() {
  return (
    <section className="agency-container agents-gallery-section">
      <div className="refresh-section-heading">
        <h2>
          What this looks like
          <br />
          <em>in a working business.</em>
        </h2>
        <p>
          Capability examples rather than finished client work. Each one needs
          the right business information, integrations and staff
          responsibilities before it does anything useful.
        </p>
      </div>
      <AgentGallery />
      <aside className="refresh-mini-cta">
        <div>
          <p className="agency-eyebrow">WANT TO TRY ONE?</p>
          <p>The business agents take your own brief and return a draft.</p>
        </div>
        <Link className="agency-text-link" href="/business-agents">
          Open the business agents <ArrowUpRight size={18} />
        </Link>
      </aside>
    </section>
  );
}

function ProductsPanel() {
  return (
    <section className="agency-container products-collection" id="made-by-us">
      {products.map((product, index) => (
        <Reveal key={product.slug} delay={index * 60}>
          <article className="product-showcase">
            <div className="product-copy">
              <div className="product-topline">
                <span>{product.category}</span>
                <span className="product-status">{product.status}</span>
              </div>
              <h2>{product.name}</h2>
              <p className="product-headline">{product.headline}</p>
              <p>{product.description}</p>
              <ul className="product-feature-list">
                {product.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} />
                    {feature}
                  </li>
                ))}
              </ul>
              {/* A product with nowhere to go says so. An address appears here
                  the day it has one, and not before. */}
              {product.href ? (
                <Link className="agency-button" href={product.href}>
                  {product.action}
                  <ArrowUpRight size={18} />
                </Link>
              ) : (
                <p className="product-pending">
                  It is built and we use it ourselves. It does not have a public
                  address yet, so there is nothing to click here. Tell us if you
                  want to know when it does.
                </p>
              )}
              {!product.available && (
                <Link className="agency-text-link" href="/agent-mapper">
                  Ask to be told when it opens <ArrowUpRight size={16} />
                </Link>
              )}
            </div>
          </article>
        </Reveal>
      ))}
      <Reveal as="aside" className="refresh-mini-cta">
        <div>
          <p className="agency-eyebrow">SOMETHING SPECIFIC IN MIND?</p>
          <p>We also build products around your business.</p>
        </div>
        <Link className="agency-text-link" href="/solutions#products">
          Explore custom product development <ArrowUpRight size={18} />
        </Link>
      </Reveal>
    </section>
  );
}

export default function ProductsPage() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="products"
          label="MADE BY AKSEN"
          title={
            <>
              We build for clients.
              <br />
              <em>And for ourselves.</em>
            </>
          }
          text="The free tools below work on this site today, with no account. Below them are examples of the same approach at work, and the products we have built for ourselves."
          target="#products-tabs"
          action="Use something now"
        />
        <PageTabs
          id="products-tabs"
          label="Products and tools"
          tabs={[
            {
              id: 'free-tools',
              label: 'Free tools',
              note: String(freeTools.length),
              panel: <FreeToolsPanel />,
            },
            {
              id: 'ai-examples',
              label: 'AI in practice',
              panel: <ExamplesPanel />,
            },
            {
              id: 'our-products',
              label: 'Our products',
              note: String(products.length),
              panel: <ProductsPanel />,
            },
          ]}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
