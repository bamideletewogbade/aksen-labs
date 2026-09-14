/* oxlint-disable next/no-img-element -- Responsive WebP assets are pre-encoded for the Workers runtime. */
'use client';
import Link from 'next/link';
import { ArrowDown, ArrowUpRight, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Reveal } from './agency-motion';

// Three businesses an owner recognises, not three abstractions. The labels and
// order match /industries so the same story is told in both places. One medium
// throughout: these are photographs of the kind of business we build for, never
// presented as our own clients.
const heroStories = [
  {
    label: 'Retail',
    tab: 'Retail',
    headline: 'Take more orders.',
    headlineEm: 'Not more messages.',
    title: 'An order nobody has to chase.',
    image: 'retail-commerce',
    alt: 'Shop staff taking an order at the counter while a delivery rider waits',
    caption: 'FROM ENQUIRY TO DELIVERED ORDER',
    note: 'An agent answers first on WhatsApp.',
    lead: 'Customers message your shop on WhatsApp and Instagram. An agent answers there, takes the order with the details complete, and your team sees every one in a single place.',
  },
  {
    label: 'Hospitality',
    tab: 'Hospitality',
    headline: 'Fill more rooms.',
    headlineEm: 'Not more spreadsheets.',
    title: 'A booking the next shift can see.',
    image: 'hospitality-tourism',
    alt: 'Guests checking in at a hotel reception desk',
    caption: 'FROM REQUEST TO ARRIVAL',
    note: 'AI drafts replies. Staff confirm.',
    lead: 'Guests ask about rooms on WhatsApp and Instagram long before they call. An agent answers, captures the request, and the next shift sees it without being told.',
  },
  {
    // The bar has room for one word on a phone; the chip carries the sector
    // name that /industries uses.
    label: 'Professional services',
    tab: 'Consulting',
    headline: 'Win more work.',
    headlineEm: 'Not more admin.',
    title: 'A quote out while it still matters.',
    image: 'professional-services-workflow',
    alt: 'A consultant reviewing documents with a client in an office',
    caption: 'FROM BRIEF TO AGREED SCOPE',
    note: 'AI prepares drafts. You decide.',
    lead: 'Enquiries arrive by email and WhatsApp at the worst moment. An agent qualifies them and prepares the draft, so your quote goes out while it still matters.',
  },
];
// Three connected nodes, the same motif as the field behind the hero. A plain
// mark reads as this business rather than as stock AI decoration.
function NodeMark() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path
        d="M6 17.5 12 6.5 18 15 6 17.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        opacity=".55"
      />
      <circle cx="6" cy="17.5" r="2.1" fill="currentColor" />
      <circle cx="12" cy="6.5" r="2.1" fill="currentColor" />
      <circle cx="18" cy="15" r="2.1" fill="currentColor" />
    </svg>
  );
}
const points = [
  [3, 22],
  [12, 12],
  [21, 28],
  [32, 13],
  [45, 24],
  [58, 10],
  [68, 27],
  [81, 14],
  [95, 30],
  [7, 51],
  [20, 62],
  [33, 47],
  [47, 62],
  [59, 43],
  [73, 59],
  [88, 46],
  [97, 69],
  [10, 84],
  [29, 88],
  [49, 83],
  [65, 92],
  [82, 80],
];
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
export function HeroShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    reducedMotion,
    () => true,
  );
  const hero = useRef<HTMLElement>(null);
  const running = !paused && !engaged && visible && !reduced;
  useEffect(() => {
    const node = hero.current;
    if (!node) return;
    let intersecting = true;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        update();
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % heroStories.length),
      7000,
    );
    return () => window.clearInterval(timer);
  }, [running, active]);

  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scene.current;
    if (!node) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty('--scene-x', '0deg');
      node.style.setProperty('--scene-y', '0deg');
    };
    const move = (event: PointerEvent) => {
      if (preference.matches || !pointer.matches) return;
      const box = node.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--scene-x', `${-y * 5}deg`);
        node.style.setProperty('--scene-y', `${x * 7}deg`);
      });
    };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', reset);
    preference.addEventListener('change', reset);
    return () => {
      reset();
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', reset);
      preference.removeEventListener('change', reset);
    };
  }, []);
  return (
    <section
      ref={hero}
      className={`ambition-hero immersive-hero ${running ? 'is-playing' : 'is-paused'}`}
      aria-labelledby="home-title"
    >
      <div className="hero-atmosphere" aria-hidden="true" />
      <svg
        className="hero-network"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {points.flatMap(([x, y], i) =>
          points
            .slice(i + 1)
            .map(([tx, ty], offset) =>
              Math.hypot(tx - x, ty - y) < 25 ? (
                <line key={`${i}-${offset}`} x1={x} y1={y} x2={tx} y2={ty} />
              ) : null,
            ),
        )}
        {points.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r=".28"
            style={{ animationDelay: `${i * -0.65}s` }}
          />
        ))}
      </svg>
      <div className="agency-container ambition-grid">
        <div className="ambition-copy">
          <Reveal>
            <p className="agency-eyebrow">
              DIGITAL TRANSFORMATION FOR AFRICAN BUSINESSES
            </p>
          </Reveal>
          {/* One heading holding three stacked variants, so a longer line
              cannot change the height and push the paragraph and buttons down.
              aria-hidden alone did not keep the inactive ones out of the
              heading's accessible name: the tree read back all three run
              together. The label states the name outright, so the page has one
              main heading that says exactly what is on screen. */}
          <Reveal delay={70}>
            <h1
              id="home-title"
              className="ambition-headline"
              aria-label={`${heroStories[active].headline} ${heroStories[active].headlineEm}`}
            >
              {heroStories.map((story, index) => (
                <span
                  key={story.label}
                  className={index === active ? 'is-current' : ''}
                  aria-hidden={index !== active}
                >
                  {story.headline}
                  <br />
                  <em>{story.headlineEm}</em>
                </span>
              ))}
            </h1>
          </Reveal>
          <Reveal delay={130}>
            {/* All three stack in one grid cell, so the tallest sets the height
                and swapping the copy cannot move the buttons underneath it. */}
            <div className="ambition-leads">
              {heroStories.map((story, index) => (
                <p
                  key={story.label}
                  className={`ambition-description ${index === active ? 'is-current' : ''}`}
                  aria-hidden={index !== active}
                >
                  {story.lead}
                </p>
              ))}
            </div>
            <div className="agency-actions">
              <Link className="agency-button" href="/agent-mapper">
                Discuss your business <ArrowUpRight size={19} />
              </Link>
              <Link className="agency-text-link" href="#what-we-do">
                Explore our services <ArrowDown size={17} />
              </Link>
            </div>
          </Reveal>
        </div>
        <div
          className="ambition-scene"
          ref={scene}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') setEngaged(true);
          }}
          onPointerLeave={() => setEngaged(false)}
        >
          <div className="hero-story-lines">
            {heroStories.map((story, index) => (
              <p
                key={story.label}
                className={index === active ? 'is-current' : ''}
                aria-hidden={index !== active}
              >
                {story.title}
              </p>
            ))}
          </div>
          <div className="ambition-orbit" aria-hidden="true" />
          <figure className="ambition-machine">
            {heroStories.map((story, index) => (
              <div
                key={story.label}
                className={`hero-story-image ${index === active ? 'is-current' : ''}`}
                aria-hidden={index !== active}
              >
                <img
                  src={`/${story.image}.webp`}
                  srcSet={`/${story.image}-768.webp 768w, /${story.image}.webp 1440w`}
                  sizes="(max-width:760px) 90vw, 50vw"
                  width="1440"
                  height="960"
                  alt={story.alt}
                  fetchPriority={index === 0 ? 'high' : 'low'}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            ))}
            <figcaption>
              <span className="ambition-status-dot" />
              {heroStories[active].caption}
            </figcaption>
          </figure>
          <Link className="ambition-ai-chip" href="/agents">
            <span>
              <NodeMark />
            </span>
            <div key={active} className="ambition-ai-chip-copy">
              <small>{heroStories[active].label.toUpperCase()}</small>
              <strong>{heroStories[active].note}</strong>
            </div>
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="agency-container ambition-bottom">
        <div
          className="hero-story-controls"
          aria-label="Hero stories"
          onFocusCapture={() => setEngaged(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setEngaged(false);
          }}
        >
          {heroStories.map((story, index) => (
            <button
              key={story.label}
              type="button"
              className={active === index ? 'is-current' : ''}
              aria-pressed={active === index}
              onClick={() => {
                setActive(index);
                setPaused(true);
              }}
            >
              <span className="hero-story-number">0{index + 1}</span>
              {story.tab}
              <span
                key={`${active}-${paused}`}
                className="hero-story-progress"
                aria-hidden="true"
              />
            </button>
          ))}
          <button
            className="hero-play-toggle"
            type="button"
            disabled={reduced}
            onClick={() => setPaused((value) => !value)}
            aria-label={
              reduced
                ? 'Automatic motion disabled by your preference'
                : paused
                  ? 'Play hero animation'
                  : 'Pause hero animation'
            }
          >
            {paused || reduced ? <Play size={16} /> : <Pause size={16} />}
          </button>
        </div>
        <Link href="/products">
          <span>MADE BY AKSEN</span>Discover our products{' '}
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
