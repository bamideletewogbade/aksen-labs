/* oxlint-disable next/no-img-element -- The captures are local, pre-sized product evidence. */
'use client';

import Link from 'next/link';
import { ArrowUpRight, Check, MousePointer2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const scenes = [
  {
    slug: 'business-agents',
    tab: 'Find the work',
    eyebrow: 'FREE TOOL · NO ACCOUNT',
    name: 'Business agents',
    title: 'Turn a business brief into a useful next step.',
    description:
      'Choose one job, describe the business and get a draft you can review. It prepares the work. You decide what happens next.',
    image: '/captures/product-business-agents.png',
    alt: 'Aksen Business Agents screen with three tasks and a business brief form',
    href: '/business-agents',
    action: 'Run a business agent',
    signal: 'Draft ready for your review',
    points: [
      'Uses the brief you provide',
      'Shows missing evidence',
      'Nothing is sent',
    ],
  },
  {
    slug: 'order-demo',
    tab: 'Handle an order',
    eyebrow: 'INTERACTIVE DEMONSTRATION',
    name: 'Order walkthrough',
    title: 'Follow one enquiry from question to handover.',
    description:
      'See where approved prices and rules can move the order forward, where payment is checked, and where the workshop has to decide.',
    image: '/captures/product-order-demo.png',
    alt: 'Aksen fictional order walkthrough showing enquiry and quote review steps',
    href: '/order-demo',
    action: 'Walk through the order',
    signal: 'Fictional order · no payment created',
    points: [
      'Specifications made clear',
      'Quote rules stay visible',
      'Workshop confirms the date',
    ],
  },
  {
    slug: 'support-demo',
    tab: 'Answer customers',
    eyebrow: 'INTERACTIVE DEMONSTRATION',
    name: 'Support assistant',
    title: 'Answer from approved information. Refuse to guess.',
    description:
      'Try a question the fictional business can answer, then one it cannot. The useful moment is the handoff, not a confident invention.',
    image: '/captures/product-support-demo.png',
    alt: 'Aksen support assistant with fictional business scenarios and suggested questions',
    href: '/support-demo',
    action: 'Try the assistant',
    signal: 'Approved knowledge only',
    points: [
      'Answers what is known',
      'Asks for missing details',
      'Hands uncertainty to staff',
    ],
  },
  {
    slug: 'workspace-demo',
    tab: 'Prepare a draft',
    eyebrow: 'INTERACTIVE DEMONSTRATION',
    name: 'Workspace',
    title: 'Bring the source in. Take a reviewed draft out.',
    description:
      'The assistant prepares a brief or proposed scope from supplied material. A person edits and approves it before it counts as decided.',
    image: '/captures/product-workspace-demo.png',
    alt: 'Aksen workspace demonstration showing source material, a useful draft and a human decision',
    href: '/workspace-demo',
    action: 'Explore the workspace',
    signal: 'A person keeps the decision',
    points: [
      'Source material stays visible',
      'Drafts remain editable',
      'Approval belongs to a person',
    ],
  },
] as const;

export function ProductTheatre() {
  const [active, setActive] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const scene = scenes[active];

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty('--theatre-x', '0deg');
      node.style.setProperty('--theatre-y', '0deg');
    };
    const move = (event: PointerEvent) => {
      if (reduced.matches || !fine.matches) return;
      const box = node.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        node.style.setProperty('--theatre-x', `${-y * 2.2}deg`);
        node.style.setProperty('--theatre-y', `${x * 3.2}deg`);
      });
    };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', reset);
    reduced.addEventListener('change', reset);
    return () => {
      reset();
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerleave', reset);
      reduced.removeEventListener('change', reset);
    };
  }, []);

  return (
    <div className="product-theatre">
      <div
        className="product-theatre-tabs"
        role="tablist"
        aria-label="Things to try"
      >
        {scenes.map((item, index) => (
          <button
            key={item.slug}
            id={`product-tab-${item.slug}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls="product-scene"
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
          >
            <span>0{index + 1}</span>
            {item.tab}
          </button>
        ))}
      </div>

      <div
        ref={stage}
        id="product-scene"
        className="product-theatre-stage"
        role="tabpanel"
        aria-labelledby={`product-tab-${scene.slug}`}
      >
        <div className="product-theatre-globe" aria-hidden="true" />
        <div className="product-theatre-copy" key={`${scene.slug}-copy`}>
          <p className="product-theatre-eyebrow">{scene.eyebrow}</p>
          <p className="product-theatre-name">{scene.name}</p>
          <h3>{scene.title}</h3>
          <p>{scene.description}</p>
          <Link href={scene.href}>
            {scene.action} <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="product-theatre-visual" key={`${scene.slug}-visual`}>
          <figure>
            <div className="product-window-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>aksen labs · {scene.name.toLowerCase()}</span>
            </div>
            <img src={scene.image} alt={scene.alt} width="1440" height="900" />
          </figure>

          <div className="product-float-card is-signal">
            <span>
              <Check size={16} strokeWidth={3} />
            </span>
            <p>
              <small>WHAT THE SCREEN PROVES</small>
              {scene.signal}
            </p>
          </div>

          <div className="product-float-card is-details">
            <MousePointer2 size={17} />
            <ul>
              {scene.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
