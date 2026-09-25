'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

/**
 * The two pieces of the homepage story that need a picture rather than a
 * sentence: the size of the problem, and the proof that we run the agency on
 * the same software we sell.
 */

function useSeen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, seen };
}

/**
 * Forty messages, three of them orders. A number in a sentence is read and
 * forgotten; forty squares with three lit is the same fact in a form the
 * reader can see the shape of.
 */
const ORDERS = new Set([9, 22, 31]);

export function MessageVolume() {
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    // The heading beside it already says forty messages and three orders, so
    // the squares are a second telling rather than the only one. Announcing
    // them again would add nothing but noise.
    <div
      className={`volume ${seen ? 'is-seen' : ''}`}
      ref={ref}
      aria-hidden="true"
    >
      <div className="volume-grid">
        {Array.from({ length: 40 }, (_, index) => (
          <span
            key={index}
            className={ORDERS.has(index) ? 'is-order' : ''}
            style={{ '--i': index } as CSSProperties}
          />
        ))}
      </div>
      <div className="volume-key">
        <span>
          <i className="is-order" />3 orders
        </span>
        <span>
          <i />
          37 price checks, questions and people who never replied
        </span>
      </div>
    </div>
  );
}

/**
 * The public site and the workspace behind it, side by side. Screenshots of our
 * own software, because an agency that sells business systems and cannot show
 * one it runs itself is asking for a large amount of trust on credit.
 */
type Shot = {
  src: string;
  alt: string;
  title: string;
  note: string;
};

const views: {
  id: string;
  tab: string;
  lead: string;
  /** Phone for the public site, screen for the workspace. The two halves are
   *  used on two different machines and the frames should say so. */
  frame: 'phone' | 'screen';
  shots: Shot[];
}[] = [
  {
    id: 'public',
    frame: 'phone',
    tab: 'What you can open',
    lead: 'Everything on this half is reachable right now, without an account and without talking to anyone first.',
    shots: [
      {
        src: '/captures/products.webp',
        alt: 'The Aksen Labs products page listing free tools and demonstrations',
        title: 'Products and free tools',
        note: 'Each one labelled as a product, a free tool or a demonstration.',
      },
      {
        src: '/captures/business-agents.webp',
        alt: 'The business agents page with three assistants to run',
        title: 'Three business agents',
        note: 'Paste a brief about your business and read the draft it returns.',
      },
      {
        src: '/captures/order-demo.webp',
        alt: 'The order walkthrough showing an enquiry moving through its stages',
        title: 'The order walkthrough',
        note: 'Follow one enquiry through missing details, quote, payment check and handover.',
      },
    ],
  },
  {
    id: 'workspace',
    frame: 'screen',
    tab: 'What we run on it',
    lead: 'The other half is the workspace we use to run Aksen. Same codebase, same rules about what AI may and may not do.',
    // The controls, not the records. Our client screens hold real names and the
    // state of live conversations, and those belong to the clients.
    shots: [
      {
        src: '/captures/admin-agent-desk.webp',
        alt: 'The Aksen workspace AI tools page, with a task chosen and an empty brief waiting to be filled in',
        title: 'The same agents you can run free',
        note: 'Choose the task, give it the facts, read the result before using it. We use the ones on this site.',
      },
      {
        src: '/captures/admin-operations.webp',
        alt: 'The Aksen workspace client drafts page, preparing a qualification draft from a record',
        title: 'Drafts, before anyone acts',
        note: 'Qualification, proposals and follow-ups prepared from our own records, then read by a person.',
      },
      {
        src: '/captures/admin-feedback.webp',
        alt: 'The Aksen workspace feedback board, showing what its automatic triage is and is not allowed to do',
        title: 'What it is not allowed to do',
        note: 'Our own triage reads suggestions and recommends. It cannot publish, change a status, or write a changelog entry.',
      },
    ],
  },
];

export function ProofGallery() {
  const [active, setActive] = useState(0);
  const view = views[active];
  return (
    <div className="proof">
      <div
        className="proof-tabs"
        role="tablist"
        aria-label="Two halves of the platform"
      >
        {views.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`proof-tab-${item.id}`}
            aria-selected={index === active}
            aria-controls={`proof-panel-${item.id}`}
            className={index === active ? 'is-current' : ''}
            onClick={() => setActive(index)}
          >
            <span className="proof-tab-index">0{index + 1}</span>
            {item.tab}
          </button>
        ))}
      </div>
      <div
        className="proof-panel"
        role="tabpanel"
        id={`proof-panel-${view.id}`}
        aria-labelledby={`proof-tab-${view.id}`}
        key={view.id}
      >
        <p className="proof-lead">{view.lead}</p>
        <div className={`proof-shots is-${view.frame}`}>
          {view.shots.map((shot, index) => (
            <figure key={shot.src} style={{ '--i': index } as CSSProperties}>
              <span className="proof-frame">
                {/* oxlint-disable-next-line next/no-img-element -- Pre-encoded
                    captures served straight from the Workers deployment. */}
                <img
                  src={shot.src}
                  alt={shot.alt}
                  width={view.frame === 'phone' ? 860 : 2560}
                  height={view.frame === 'phone' ? 1240 : 1600}
                  loading="lazy"
                />
              </span>
              <figcaption>
                <strong>{shot.title}</strong>
                <span>{shot.note}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <p className="proof-note">
        Screens captured directly from our live software rather than marketing
        mockups. Real running tools, built in the open with verifiable workings.{' '}
        <Link className="agency-text-link" href="/products">
          See what is open today <ArrowUpRight size={16} />
        </Link>
      </p>
    </div>
  );
}
