'use client';
import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, MoveUpRight } from 'lucide-react';

/* ================================================================
   Hero slide data — each slide has a headline accent word, lead text,
   image path, and structured caption data. The hero rotates through
   these on a timer, keeping text and visual in sync.
   ================================================================ */
export type HeroSlide = {
  id: string;
  pill: string;
  accent: string;
  lead: string;
  detail: string;
  image: string;
  alt: string;
  tag: string;
  captionTitle: string;
  captionSub: string;
};

/**
 * HeroAnimated: Orchestrates staggered entrance animations for the hero.
 * Each child element (.hero-anim-word, .hero-anim-line) gets sequenced
 * reveals via Web Animations API. Respects prefers-reduced-motion.
 */
export function HeroAnimated({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) {
      node.classList.add('hero-anim-ready');
      return;
    }

    const animations: Animation[] = [];

    // Stagger words in the headline
    const words = node.querySelectorAll<HTMLElement>('.hero-anim-word');
    words.forEach((word, i) => {
      const anim = word.animate(
        [
          { opacity: 0, transform: 'translateY(38px) rotateX(35deg)', filter: 'blur(4px)' },
          { opacity: 1, transform: 'translateY(0) rotateX(0)', filter: 'blur(0)' },
        ],
        {
          duration: 720,
          delay: 150 + i * 80,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        }
      );
      animations.push(anim);
    });

    // Animate lines (lead paragraph, detail, location)
    const lines = node.querySelectorAll<HTMLElement>('.hero-anim-line');
    lines.forEach((line, i) => {
      const anim = line.animate(
        [
          { opacity: 0, transform: 'translateY(22px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        {
          duration: 640,
          delay: 550 + i * 110,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'both',
        }
      );
      animations.push(anim);
    });

    // Eyebrow slide-in
    const eyebrow = node.querySelector<HTMLElement>('.hero-anim-eyebrow');
    if (eyebrow) {
      animations.push(
        eyebrow.animate(
          [
            { opacity: 0, transform: 'translateX(-16px)' },
            { opacity: 1, transform: 'translateX(0)' },
          ],
          { duration: 550, delay: 60, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
        )
      );
    }

    // CTA buttons
    const ctas = node.querySelectorAll<HTMLElement>('.hero-anim-cta');
    ctas.forEach((cta, i) => {
      animations.push(
        cta.animate(
          [
            { opacity: 0, transform: 'translateY(14px) scale(0.94)' },
            { opacity: 1, transform: 'translateY(0) scale(1)' },
          ],
          { duration: 560, delay: 800 + i * 90, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
        )
      );
    });

    // Image reveal (clip-path wipe from left)
    const visual = node.querySelector<HTMLElement>('.hero-anim-visual');
    if (visual) {
      animations.push(
        visual.animate(
          [
            { clipPath: 'inset(0 100% 0 0)', opacity: 0.4 },
            { clipPath: 'inset(0 0% 0 0)', opacity: 1 },
          ],
          { duration: 900, delay: 300, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' }
        )
      );
    }

    // Determine when all animations finish
    const longest = animations.reduce((max, a) => {
      const t = a.effect?.getComputedTiming();
      const end = (typeof t?.delay === 'number' ? t.delay : 0) + (typeof t?.duration === 'number' ? t.duration : 0);
      return end > max ? end : max;
    }, 0);
    const timer = setTimeout(() => node.classList.add('hero-anim-ready'), longest);

    const onPrefChange = () => {
      if (reduced.matches) {
        animations.forEach((a) => a.cancel());
        node.classList.add('hero-anim-ready');
      }
    };
    reduced.addEventListener('change', onPrefChange);

    return () => {
      clearTimeout(timer);
      animations.forEach((a) => a.cancel());
      reduced.removeEventListener('change', onPrefChange);
    };
  }, []);

  return (
    <div ref={ref} className={`hero-animated-root ${className}`}>
      {children}
    </div>
  );
}

/**
 * SplitWords: Wraps each word in children text in a <span> for staggered animation.
 */
export function SplitWords({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const nodes = Array.isArray(children) ? children : [children];
  const spans: ReactNode[] = [];

  nodes.forEach((child, ci) => {
    if (typeof child === 'string') {
      child
        .split(/\s+/)
        .filter(Boolean)
        .forEach((word, wi) => {
          spans.push(
            <span key={`${ci}-${wi}`} className="hero-anim-word">
              {word}
            </span>
          );
        });
    } else {
      spans.push(
        <span key={`jsx-${ci}`} className="hero-anim-word">
          {child}
        </span>
      );
    }
  });

  return <span className={`hero-split-words ${className}`}>{spans}</span>;
}

/**
 * GlowWord: Wraps a word with an animated gradient underline in agency green.
 */
export function GlowWord({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`hero-glow-word ${className}`}>
      {children}
      <span className="hero-glow-underline" aria-hidden="true" />
    </span>
  );
}

export const defaultHeroSlides: HeroSlide[] = [
  {
    id: 'commerce',
    pill: '01 Commerce',
    accent: 'grow.',
    lead: 'Aksen Labs helps you improve how your business sells, serves customers, and gets work done. We build modern storefronts, connect Mobile Money and card checkout, and automate order fulfillment.',
    detail: 'From customer inquiry to verified payment and warehouse dispatch—everything connects without manual re-entry.',
    image: '/hero-commerce.jpg',
    alt: 'African business owner managing retail orders on a tablet in a modern shop',
    tag: 'CUSTOMER EXPERIENCE & COMMERCE',
    captionTitle: 'Sell online. Get paid faster.',
    captionSub: 'Direct MoMo & card checkout with instant WhatsApp order updates.',
  },
  {
    id: 'operations',
    pill: '02 Operations',
    accent: 'connect.',
    lead: 'We replace scattered spreadsheets and manual handoffs with connected workspaces. Your customer inquiries, pricing, invoices, and fulfillment flow through one clear system.',
    detail: 'Your team spends less time searching across WhatsApp messages and spreadsheets, and more time delivering for clients.',
    image: '/hero-operations.jpg',
    alt: 'African professionals collaborating on business dashboards in a modern office',
    tag: 'BUSINESS SYSTEMS & WORKSPACES',
    captionTitle: 'One connected workspace.',
    captionSub: 'Inventory, client records, and team handoffs in sync.',
  },
  {
    id: 'products',
    pill: '03 Products',
    accent: 'build.',
    lead: 'Turn your operational expertise or new idea into custom software. We design and engineer web applications, client portals, and mobile-ready tools tailored to African markets.',
    detail: 'Scoped in practical sprints with verified milestones, human-reviewed data, and localized payment rails.',
    image: '/hero-product.jpg',
    alt: 'African entrepreneur launching a digital product with mobile app interface',
    tag: 'DIGITAL PRODUCTS & SERVICES',
    captionTitle: 'Software built to be used.',
    captionSub: 'From validated concept to production launch.',
  },
];

/**
 * HeroShowcase: Synchronized hero experience where headline accent word,
 * narrative lead, 3D visual, and pill controls stay perfectly in sync.
 */
export function HeroShowcase({
  slides = defaultHeroSlides,
  interval = 5500,
}: {
  slides?: HeroSlide[];
  interval?: number;
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches || isPaused) return;

    timerRef.current = setInterval(next, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, interval, isPaused]);

  const slide = slides[current];

  return (
    <section
      className="agency-hero agency-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Aksen Labs Hero Showcase"
    >
      {/* LEFT COLUMN: HERO COPY & DYNAMIC NARRATIVE */}
      <div className="agency-hero-copy">
        <p className="agency-eyebrow hero-anim-eyebrow">
          <span /> DIGITAL TRANSFORMATION AGENCY · GHANA
        </p>

        <h1 className="hero-headline">
          Technology that helps your business{' '}
          <span className="hero-accent-slot" key={slide.accent}>
            <em className="hero-accent-word">{slide.accent}</em>
            <span className="hero-accent-underline" aria-hidden="true" />
          </span>
        </h1>

        <div className="hero-dynamic-text-wrap" key={slide.id}>
          <p className="agency-lead hero-dynamic-lead">{slide.lead}</p>
          <p className="agency-hero-detail hero-dynamic-detail">{slide.detail}</p>
        </div>

        <div className="agency-actions">
          <a className="agency-button" href="/agent-mapper">
            Discuss your business <ArrowUpRight size={19} />
          </a>
          <a className="agency-text-link" href="#services">
            Explore our services <ArrowDown size={17} />
          </a>
        </div>

        <p className="agency-location">
          BASED IN GHANA <span /> WORKING ACROSS AFRICA &amp; BEYOND
        </p>
      </div>

      {/* RIGHT COLUMN: 3D HERO VISUAL & SLIDE CONTROLS */}
      <div className="agency-hero-visual hero-visual-stage">
        {/* Carousel image layer */}
        <div className="hero-carousel-track">
          {slides.map((s, i) => (
            <div
              key={s.id}
              className={`hero-slide-layer ${i === current ? 'is-active' : ''}`}
              aria-hidden={i !== current}
            >
              <img
                src={s.image}
                alt={s.alt}
                width="1672"
                height="941"
                className="hero-slide-img"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : undefined}
              />
            </div>
          ))}
        </div>

        {/* Gradient vignette for text contrast */}
        <div className="hero-visual-vignette" aria-hidden="true" />

        {/* Slide navigation pills */}
        <div className="hero-slide-pills" role="tablist" aria-label="Select capability">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              className={`hero-pill-btn ${i === current ? 'is-active' : ''}`}
              onClick={() => goTo(i)}
            >
              <span>{s.pill}</span>
              {i === current && !isPaused && (
                <span
                  className="hero-pill-progress"
                  style={{ animationDuration: `${interval}ms` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Caption overlay at bottom */}
        <div className="agency-photo-caption hero-caption-area" key={`caption-${slide.id}`}>
          <span className="hero-caption-tag">{slide.tag}</span>
          <p className="hero-caption-title">{slide.captionTitle}</p>
          <p className="hero-caption-sub">{slide.captionSub}</p>
        </div>

        {/* Interactive jump link to services */}
        <a
          className="agency-photo-link"
          href="#services"
          aria-label="Explore our services"
        >
          <MoveUpRight />
        </a>
      </div>
    </section>
  );
}

/** Legacy wrappers preserved for compatibility */
export function HeroRotator({ slides, interval = 5000 }: { slides: HeroSlide[]; interval?: number }) {
  return <HeroShowcase slides={slides} interval={interval} />;
}

export function HeroDynamicAccent({ words }: { words: string[]; interval?: number }) {
  return <span className="hero-accent-word">{words[0] || 'grow.'}</span>;
}

