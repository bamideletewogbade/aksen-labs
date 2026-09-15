import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { PageIntro } from '@/components/page-intro';
import { PageTabs } from '@/components/page-tabs';
import { AgentGallery } from '@/components/agent-gallery';
import { ProductWaitlist } from '@/components/product-waitlist';
import { freeTools, products, type FreeTool } from '@/lib/product-catalog';

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

function ToolCards({
  tools,
  columns,
}: {
  tools: readonly FreeTool[];
  /** How many across on a wide screen. A lone card spans the row regardless. */
  columns: 2 | 3;
}) {
  return (
    <ul className={`tool-list tool-list-${columns}`}>
      {tools.map((tool, index) => (
        <Reveal as="li" key={tool.slug} delay={index * 40}>
          <Link href={tool.href}>
            <span className="tool-status">{tool.status}</span>
            <h4>{tool.name}</h4>
            <p>{tool.description}</p>
            <span className="tool-action">
              {tool.action} <ArrowUpRight size={16} />
            </span>
          </Link>
        </Reveal>
      ))}
    </ul>
  );
}

/**
 * Two groups, because there are two kinds of thing here and the difference is
 * the one a visitor cares about: whether it does something with their business
 * or acts one out. It used to be a flat grid of four with the split explained in
 * a sentence, and the sentence had gone stale.
 */
function FreeToolsPanel() {
  const working = freeTools.filter((tool) => tool.kind === 'tool');
  const demos = freeTools.filter((tool) => tool.kind === 'demonstration');
  return (
    <section className="agency-container refresh-section" id="free-tools-panel">
      <div className="refresh-section-heading">
        <h2>
          Free to use,
          <br />
          <em>right here.</em>
        </h2>
        <p>
          No account and no charge. The first group works on whatever business
          you describe to it. The second acts out the same work on a business we
          made up, and says so on the page.
        </p>
      </div>
      {/* The label is a sibling of the heading rather than a span inside it: in
          the heading it ran into the title with no space in the accessible
          name. */}
      <div className="tool-group">
        <div className="tool-group-head">
          <span>WORKS ON YOUR BUSINESS</span>
          <h3>Describe what you do, get something back</h3>
        </div>
        <ToolCards tools={working} columns={2} />
      </div>
      <div className="tool-group">
        <div className="tool-group-head">
          <span>WORKED ON A FICTIONAL ONE</span>
          <h3>See what the finished thing does</h3>
        </div>
        <ToolCards tools={demos} columns={3} />
      </div>
    </section>
  );
}

/**
 * The examples used to be a full-bleed dark band with its own horizontal
 * padding, so its heading sat on a different left line from every other section
 * on the page, and the shared section-heading paragraph kept its light-surface
 * grey on a near-black background. It is now an inset panel: the page gutter
 * puts it on the same line as the tabs above it, and the dark styling is scoped
 * to the panel rather than borrowed from the light-surface classes.
 */
function ExamplesPanel() {
  return (
    <section className="agency-container agents-gallery-section">
      <div className="agents-gallery-panel">
        <header className="agents-gallery-heading">
          <div>
            <p className="agency-eyebrow">CAPABILITY EXAMPLES</p>
            <h2>
              What this looks like
              <br />
              <em>in a working business.</em>
            </h2>
          </div>
          <p>
            Each card is one job an assistant can hold, written as the moment a
            customer turns up. They are capability examples rather than finished
            client work: every one needs your business information, your
            integrations and a named person to hand the exceptions to before it
            does anything useful.
          </p>
        </header>
        <AgentGallery />
        <aside className="agents-gallery-cta">
          <div>
            <p className="agency-eyebrow">WANT TO TRY ONE ON YOUR OWN WORK?</p>
            <p>The business agents take your brief and return a draft. Free.</p>
          </div>
          <Link className="agency-text-link" href="/business-agents">
            Open the business agents <ArrowUpRight size={18} />
          </Link>
        </aside>
      </div>
    </section>
  );
}

/**
 * One product, laid out as one product rather than as a card in a two-column
 * grid that had nothing to put in the other column. The left side says what it
 * is and whether you can have it; the right side walks the four steps it covers,
 * in the order someone actually does them.
 */
function ProductsPanel() {
  return (
    <section className="agency-container products-collection" id="made-by-us">
      <div className="refresh-section-heading">
        <h2>
          What we build
          <br />
          <em>when the client is us.</em>
        </h2>
        <p>
          Our own products, not client work. They run on their own hosting
          rather than on this site, so this page describes them and links out
          the day there is somewhere to link to.
        </p>
      </div>
      {products.map((product, index) => (
        <Reveal key={product.slug} delay={index * 60}>
          <article className="product-showcase">
            <div className="product-copy">
              <div className="product-topline">
                <span>{product.category}</span>
                <span className="product-status">{product.status}</span>
              </div>
              <h3>{product.name}</h3>
              <p className="product-headline">{product.headline}</p>
              <p>{product.description}</p>
              {/* A product with nowhere to go says so. An address appears here
                  the day it has one, and not before. */}
              {product.href ? (
                <Link className="agency-button" href={product.href}>
                  {product.action}
                  <ArrowUpRight size={18} />
                </Link>
              ) : (
                // The waitlist hangs off the same condition as the button, not
                // off `available`, because the route behind it accepts a signup
                // only while the product has no address. Two conditions that
                // could drift apart would show a form the server refuses.
                <>
                  <p className="product-pending">
                    Built, and we use it ourselves. There is no public address
                    yet, so the only thing to do here is ask to be told when
                    there is one.
                  </p>
                  {/* This used to be a link to the agent mapper, which opens by
                      asking what you want your business to do better. Someone
                      waiting on a CV product is looking for a job, not buying
                      automation, and had nowhere to leave an address. */}
                  <ProductWaitlist
                    productSlug={product.slug}
                    productName={product.name}
                  />
                </>
              )}
              {product.limits && (
                <p className="product-limits">{product.limits}</p>
              )}
            </div>
            <ol className="product-stages">
              {product.stages.map((stage, stageIndex) => (
                <li key={stage.title}>
                  <p className="product-stage-head">
                    <span>0{stageIndex + 1}</span>
                    {stage.title}
                  </p>
                  <ul className="product-feature-list">
                    {stage.items.map((item) => (
                      <li key={item}>
                        <Check size={15} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
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
        {/* The opening used to say "we build for clients", which is the services
            story and lives on /solutions. This page holds three different things,
            so the opening names them in the order the tabs run. */}
        <PageIntro
          variant="products"
          label="PRODUCTS AND TOOLS"
          title={
            <>
              What we have built,
              <br />
              <em>and what you can use.</em>
            </>
          }
          text="The free tools below run on this site with no account and no charge. After them are examples of the same approach inside a working business, and the products we have built and run ourselves."
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
