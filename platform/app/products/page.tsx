import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Check } from 'lucide-react';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { PageIntro } from '@/components/page-intro';
import { freeTools, products } from '@/lib/product-catalog';
export const metadata: Metadata = {
  title: 'Products | Aksen Labs',
  description:
    'Products Aksen Labs has built, and the free tools and demonstrations you can use on this site today.',
};
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
          text="The same approach, turned on our own ideas. Products run on their own, and this page says plainly which are ready and which are not. The free tools below work here, now."
          target="#free-tools"
          action="Use something now"
        />
        <section
          className="agency-container products-collection"
          aria-label="Products"
        >
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
                  {/* A product with nowhere to go says so. An address appears
                      here the day it has one, and not before. */}
                  {product.href ? (
                    <Link className="agency-button" href={product.href}>
                      {product.action}
                      <ArrowUpRight size={18} />
                    </Link>
                  ) : (
                    <p className="product-pending">
                      It is built and we use it ourselves. It does not have a
                      public address yet, so there is nothing to click here.
                      Tell us if you want to know when it does.
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
        </section>
        <section className="refresh-soft-band" id="free-tools">
          <div className="agency-container refresh-section">
            <div className="refresh-section-heading">
              <h2>
                Free to use,
                <br />
                <em>right here.</em>
              </h2>
              <p>
                No account, no charge. Two are working assistants you can point
                at your own business; two are demonstrations using fictional
                businesses, and say so on the page.
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
          </div>
        </section>
        <Reveal as="aside" className="agency-container refresh-mini-cta">
          <div>
            <p className="agency-eyebrow">SOMETHING SPECIFIC IN MIND?</p>
            <p>We also build products around your business.</p>
          </div>
          <Link className="agency-text-link" href="/solutions#products">
            Explore custom product development <ArrowUpRight size={18} />
          </Link>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
