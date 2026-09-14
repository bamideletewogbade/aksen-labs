/* oxlint-disable next/no-img-element -- Images use pre-encoded WebP sizes; the Workers deployment needs no image optimisation service. */
'use client';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
const industries = [
  {
    name: 'Retail',
    image: 'retail-commerce',
    alt: 'Retail staff preparing orders together',
    title: 'From browsing to buying. Less friction along the way.',
    challenge:
      'Enquiries, payments and order updates live in different places.',
    opportunity:
      'Bring the storefront and the team’s order records together, so customers and staff can follow the next step.',
    steps: [
      [
        'Discover',
        'A clear catalogue helps a customer choose or request a custom option.',
      ],
      [
        'Confirm',
        'Your team reviews the request. Checkout records payment through the agreed provider.',
      ],
      [
        'Deliver',
        'The order reaches the right person, with its details and delivery status in one place.',
      ],
    ],
  },
  {
    name: 'Professional services',
    image: 'professional-services-workflow',
    alt: 'Professionals planning a client project',
    title: 'A clearer path from first enquiry to finished work.',
    challenge:
      'Client briefs, proposals and approvals are scattered across messages.',
    opportunity:
      'Give each engagement a shared record, clear milestones and a place for clients to review progress.',
    steps: [
      [
        'Enquire',
        'A structured intake captures the client’s goals and context.',
      ],
      [
        'Agree',
        'Your team confirms the scope, responsibilities and milestones.',
      ],
      [
        'Deliver',
        'A shared workspace keeps documents, feedback and approvals together.',
      ],
    ],
  },
  {
    name: 'Hospitality',
    image: 'hospitality-tourism',
    alt: 'A hospitality setting welcoming guests',
    title: 'A better guest experience starts before arrival.',
    challenge:
      'Booking requests and guest needs are easy to lose between shifts.',
    opportunity:
      'Connect direct bookings, guest information and staff handovers around a single reservation.',
    steps: [
      ['Book', 'A guest checks the offer and requests a reservation.'],
      [
        'Prepare',
        'Confirmed booking details and requests reach the responsible staff.',
      ],
      [
        'Welcome',
        'Your team follows through on arrival, service and guest feedback.',
      ],
    ],
  },
  {
    name: 'Property',
    image: 'property-workflow',
    alt: 'Property professionals reviewing a building',
    title: 'Help the right people find the right property.',
    challenge:
      'Outdated listings and repeated questions slow down serious enquiries.',
    opportunity:
      'Connect property information, viewing requests and follow-up records so your team can focus its attention.',
    steps: [
      [
        'Explore',
        'Clear listings explain the available properties and requirements.',
      ],
      [
        'View',
        'An enquiry collects preferences and supports viewing arrangements.',
      ],
      [
        'Follow up',
        'Your team tracks conversations, documents and next actions.',
      ],
    ],
  },
  {
    name: 'Creative businesses',
    image: 'creator-campaign',
    alt: 'Creative professionals collaborating on a campaign',
    title: 'Keep good ideas moving through the work.',
    challenge:
      'Briefs, files and feedback compete for attention in separate threads.',
    opportunity:
      'Give each project a clear home for assets, review rounds and client decisions.',
    steps: [
      [
        'Brief',
        'Capture the objective, audience, deliverables and constraints.',
      ],
      [
        'Create',
        'Keep current files and feedback attached to the right project.',
      ],
      [
        'Approve',
        'Clients review the work and your team records the decision.',
      ],
    ],
  },
];
export function IndustryExplorer() {
  const [selected, setSelected] = useState(0);
  const [step, setStep] = useState(0);
  const item = industries[selected];
  return (
    <div className="refresh-industry-explorer">
      <fieldset
        className="refresh-industry-options"
        aria-label="Choose an industry"
      >
        {industries.map((industry, i) => (
          <button
            type="button"
            key={industry.name}
            aria-pressed={selected === i}
            onClick={() => {
              setSelected(i);
              setStep(0);
            }}
          >
            {industry.name}
            <ArrowUpRight size={16} />
          </button>
        ))}
      </fieldset>
      <div className="refresh-industry-panel" key={item.name}>
        <div className="refresh-industry-image">
          <img
            src={`/${item.image}.webp`}
            srcSet={`/${item.image}-768.webp 768w, /${item.image}.webp 1440w`}
            sizes="(max-width:760px) 100vw, 45vw"
            width="1440"
            height="810"
            alt={item.alt}
          />
          <span>{item.name}</span>
        </div>
        <div className="refresh-industry-copy">
          <p className="agency-eyebrow">A POSSIBLE STARTING POINT</p>
          <h2>{item.title}</h2>
          <p>
            <strong>The challenge.</strong> {item.challenge}
          </p>
          <p>{item.opportunity}</p>
          <Link className="agency-text-link" href="/agent-mapper">
            Discuss a similar challenge <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
      <div className="refresh-workflow">
        <div>
          <p className="agency-eyebrow">HOW THE PIECES COULD CONNECT</p>
          <fieldset
            aria-label="Explore the workflow"
            className="refresh-workflow-buttons"
          >
            {item.steps.map(([label], i) => (
              <button
                type="button"
                key={label}
                aria-pressed={step === i}
                onClick={() => setStep(i)}
              >
                <span>0{i + 1}</span>
                {label}
                {i < 2 && <ArrowRight size={15} />}
              </button>
            ))}
          </fieldset>
        </div>
        <p aria-live="polite" aria-atomic="true">
          <strong>{item.steps[step][0]}.</strong> {item.steps[step][1]}
        </p>
      </div>
    </div>
  );
}
