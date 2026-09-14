'use client';
import Link from 'next/link';

import {
  ArrowRight,
  Building2,
  Check,
  Headphones,
  Hotel,
  Megaphone,
  Search,
  ShoppingBag,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { agentCatalog, agentCategories } from '@/lib/agent-catalog';

const icons = {
  'property-concierge': Building2,
  'guest-concierge': Hotel,
  'sales-order-guide': ShoppingBag,
  'client-intake-guide': UsersRound,
  'team-knowledge-guide': Search,
  'campaign-companion': Megaphone,
};

export function AgentGallery() {
  const [filter, setFilter] = useState<(typeof agentCategories)[number]>('All');
  const agents = useMemo(
    () =>
      filter === 'All'
        ? agentCatalog
        : agentCatalog.filter((agent) => agent.category === filter),
    [filter],
  );

  return (
    <div className="agent-gallery-experience">
      <fieldset
        className="agent-filter"
        aria-label="Filter AI examples by the work they help with"
      >
        {agentCategories.map((category) => (
          <button
            type="button"
            aria-pressed={category === filter}
            className={category === filter ? 'active' : ''}
            onClick={() => setFilter(category)}
            key={category}
          >
            {category}
          </button>
        ))}
      </fieldset>
      <div className="agent-card-grid">
        {agents.map((agent, index) => {
          const Icon = icons[agent.slug as keyof typeof icons] || Headphones;
          return (
            <article className="agent-card" key={agent.slug}>
              <div className="agent-card-top">
                <span className="agent-card-icon">
                  <Icon size={22} />
                </span>
                <span className="agent-number">
                  A{String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="agent-tags">
                <span>{agent.category}</span>
                <span>{agent.industry}</span>
                {agent.liveDemo && (
                  <span className="live-tag">
                    <i /> Live demo
                  </span>
                )}
              </div>
              <h2>{agent.name}</h2>
              <p>{agent.promise}</p>
              <ul>
                {agent.work.slice(0, 3).map((item) => (
                  <li key={item}>
                    <Check size={13} /> {item}
                  </li>
                ))}
              </ul>
              <Link href={`/agents/${agent.slug}`}>
                View use case <ArrowRight size={17} />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
