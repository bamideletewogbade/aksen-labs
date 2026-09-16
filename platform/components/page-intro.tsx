/* oxlint-disable next/no-img-element -- Responsive images are pre-encoded WebP assets. */
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  FileText,
  Layers,
  ScanText,
  BookOpen,
} from 'lucide-react';
import { Reveal } from './agency-motion';
import { stages } from '@/lib/pricing';
import { formatPrice, type Currency } from '@/lib/currency';
import { freeTools, products } from '@/lib/product-catalog';
import { agentCatalog } from '@/lib/agent-catalog';
import { ideaStatuses } from '@/lib/feedback-board';
type Opening =
  | 'services'
  | 'approach'
  | 'industries'
  | 'about'
  | 'intelligence'
  | 'products'
  | 'blog'
  | 'workspace'
  | 'pricing'
  | 'board'
  | 'minimal';
const captions: Partial<Record<Opening, string>> = {
  services: 'CUSTOMER EXPERIENCE / OPERATIONS / GROWTH',
  about: 'AFRICAN AMBITION. HUMAN POSSIBILITY.',
  intelligence: 'INFORMATION → ASSISTANCE → HUMAN REVIEW',
  approach: 'UNDERSTAND / DESIGN / BUILD / ADOPT',
};
function OpeningArt({
  variant,
  image,
  alt,
  currency = 'GHS',
}: {
  variant: Opening;
  image?: string;
  alt: string;
  /** Only the pricing opening shows figures. Cedis for everything else. */
  currency?: Currency;
}) {
  // The most valuable thing on a pricing page is the number. This replaces a
  // decorative currency mark that repeated the stage names without ever saying
  // what anything costs, so a visitor can judge affordability before scrolling.
  // Read from the same source as the stages below, so the two cannot drift.
  if (variant === 'pricing')
    return (
      <div className="pricing-opening-ledger">
        <span className="pricing-ledger-label">WHERE BUDGETS START</span>
        <dl className="pricing-ledger-figures">
          {stages.map((stage) => (
            <div key={stage.number} className="pricing-ledger-row">
              <dt>{stage.title}</dt>
              <dd>
                <strong>{formatPrice(stage.price, currency)}</strong>
                <span>{stage.cadence}</span>
              </dd>
            </div>
          ))}
        </dl>
        <small>INDICATIVE. YOUR QUOTATION IS FIXED ONCE SCOPE IS AGREED.</small>
      </div>
    );
  if (image)
    return (
      <figure className="opening-image">
        <img
          src={`/${image}.webp`}
          srcSet={`/${image}-768.webp 768w, /${image}.webp 1440w`}
          sizes="(max-width:760px) 100vw, 44vw"
          alt={alt}
          width="1440"
          height="960"
        />
        <figcaption>
          {captions[variant] || 'BUILT AROUND THE WAY YOU WORK'}
        </figcaption>
        {variant === 'approach' && (
          <span className="opening-image-tag">
            01 <span>A shared understanding.</span>
          </span>
        )}
      </figure>
    );
  if (variant === 'industries')
    return (
      <div className="opening-industry-art">
        <figure>
          <img
            src="/retail-commerce-768.webp"
            width="768"
            height="432"
            alt="Retail staff preparing customer orders"
          />
          <figcaption>Different businesses.</figcaption>
        </figure>
        <figure>
          <img
            src="/professional-services-workflow-768.webp"
            width="768"
            height="432"
            alt="Professionals planning a client project"
          />
          <figcaption>Shared ambition.</figcaption>
        </figure>
      </div>
    );
  // The opening used to float two cards, one of them naming a product nobody can
  // open yet. The page is three tabs, so the opening is now a contents list for
  // them: what is on the page, how much of it, and which tab holds it. The counts
  // come from the same catalogues the panels render, so they cannot drift.
  if (variant === 'products')
    return (
      <ul className="opening-products-art" aria-hidden="true">
        {[
          {
            icon: Layers,
            name: 'Free tools',
            note: `${freeTools.length} · USE THEM HERE`,
          },
          {
            icon: BookOpen,
            name: 'AI in practice',
            note: `${agentCatalog.length} WORKED EXAMPLES`,
          },
          {
            icon: ScanText,
            name: 'Our products',
            note: `${products.length} · BUILT AND RUN BY US`,
          },
        ].map((row, index) => (
          <li key={row.name}>
            <span className="opening-products-index">0{index + 1}</span>
            <span className="opening-products-icon">
              <row.icon size={20} />
            </span>
            <strong>{row.name}</strong>
            <small>{row.note}</small>
          </li>
        ))}
      </ul>
    );
  // The board needs a legend anyway, so the opening is the legend rather than a
  // second decorative thing beside it. Read from the same list the cards use.
  if (variant === 'board')
    return (
      <ul className="opening-board-art" aria-hidden="true">
        {ideaStatuses.map((status) => (
          <li key={status.id} data-status={status.id}>
            <span className="opening-board-dot" />
            <strong>{status.label}</strong>
            <small>{status.meaning}</small>
          </li>
        ))}
      </ul>
    );
  if (variant === 'blog')
    return (
      <div className="opening-blog-art" aria-hidden="true">
        <span className="opening-quote">“</span>
        <strong>
          Most of this
          <br />
          was learned
          <br />
          <em>the expensive way.</em>
        </strong>
        <span className="opening-art-end">NOTES FROM AKSEN LABS</span>
      </div>
    );
  if (variant === 'workspace')
    return (
      <div className="opening-workspace-art" aria-hidden="true">
        <FileText size={33} />
        <span>YOUR TEAM, IN CONTROL</span>
        {['Source material', 'A useful draft', 'A human decision'].map(
          (text, i) => (
            <div key={text}>
              <small>0{i + 1}</small>
              <strong>{text}</strong>
              <ArrowUpRight size={17} />
            </div>
          ),
        )}
      </div>
    );
  return (
    <div className="opening-minimal-art" aria-hidden="true">
      <ArrowUpRight strokeWidth={0.6} />
    </div>
  );
}
export function PageIntro({
  label,
  title,
  text,
  image,
  alt = '',
  target,
  action = 'Explore this page',
  variant = 'minimal',
  currency,
}: {
  label: string;
  title: ReactNode;
  text: string;
  image?: string;
  alt?: string;
  target?: string;
  action?: string;
  variant?: Opening;
  /** Threaded from the pricing page so the opening figures match the list below it. */
  currency?: Currency;
}) {
  return (
    <header className={`page-opening opening-${variant}`}>
      <div className="agency-container opening-grid">
        <div className="opening-copy">
          <Reveal>
            <p className="agency-eyebrow">{label}</p>
          </Reveal>
          <Reveal delay={55}>
            <h1>{title}</h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="opening-description">{text}</p>
            {target && (
              <Link
                className="opening-action"
                href={target}
                data-direction={target.startsWith('#') ? 'down' : 'forward'}
              >
                {action}
                <span>
                  {target.startsWith('#') ? (
                    <ArrowDown size={18} />
                  ) : (
                    <ArrowUpRight size={18} />
                  )}
                </span>
              </Link>
            )}
          </Reveal>
        </div>
        <Reveal delay={120} className="opening-art">
          <OpeningArt
            variant={variant}
            image={image}
            alt={alt}
            currency={currency}
          />
        </Reveal>
      </div>
    </header>
  );
}
