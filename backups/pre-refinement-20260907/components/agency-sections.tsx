'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, Layers, Briefcase, Sparkles, Building2, ExternalLink } from 'lucide-react';
import { Reveal } from './agency-motion';
import { services, threePillars } from '@/lib/agency-content';

export function DisciplinesBar() {
  const disciplines = [
    'Digital Transformation Strategy',
    'Connected Commerce & Mobile Money',
    'Business Systems & Workspaces',
    'Practical AI & Assistive Workflows',
    'Custom Digital Products',
  ];

  return (
    <div className="agency-disciplines">
      <div className="agency-container">
        {disciplines.map((d, i) => (
          <span key={d} className="agency-discipline-tag">
            <span className="discipline-dot" />
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ServiceList() {
  return (
    <div className="agency-service-list">
      {services.map((service, index) => (
        <Reveal key={service.id} delay={index * 50}>
          <a className="agency-service-row" href={`/solutions#${service.id}`}>
            <span className="agency-service-number">{service.number}</span>
            <div className="agency-service-main">
              <h3>{service.title}</h3>
              <p>{service.short}</p>
              <div className="agency-service-deliverable-hint">
                <strong>Deliverable:</strong> {service.deliverable}
              </div>
            </div>
            <div className="agency-service-tags">
              {service.capabilities.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
            <span className="agency-service-arrow" aria-label={`View ${service.title}`}>
              <ArrowUpRight size={20} />
            </span>
          </a>
        </Reveal>
      ))}
    </div>
  );
}

export function PillarExplorer() {
  const [activeTab, setActiveTab] = useState<string>('company');
  const activePillar = threePillars.find((p) => p.id === activeTab) || threePillars[0];

  const pillarIcons: Record<string, typeof Building2> = {
    company: Building2,
    engagement: Briefcase,
    product: Sparkles,
  };

  return (
    <div className="pillar-explorer">
      <div className="pillar-tabs" role="tablist" aria-label="Explore Aksen architecture">
        {threePillars.map((pillar) => {
          const Icon = pillarIcons[pillar.id] || Layers;
          const isActive = activeTab === pillar.id;
          return (
            <button
              key={pillar.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`pillar-panel-${pillar.id}`}
              id={`pillar-tab-${pillar.id}`}
              className={`pillar-tab-btn ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveTab(pillar.id)}
            >
              <Icon size={18} />
              <div>
                <span className="pillar-tab-title">{pillar.name}</span>
                <span className="pillar-tab-sub">{pillar.badge.split('/')[1]?.trim() || ''}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="pillar-content-card"
        role="tabpanel"
        id={`pillar-panel-${activePillar.id}`}
        aria-labelledby={`pillar-tab-${activePillar.id}`}
      >
        <div className="pillar-card-header">
          <span className="agency-example-label">{activePillar.badge}</span>
          <h3>{activePillar.headline}</h3>
          <p className="pillar-desc">{activePillar.description}</p>
        </div>

        <div className="pillar-grid">
          <div className="pillar-col">
            <span className="pillar-col-label">How this works for you</span>
            <p className="pillar-role-text">{activePillar.role}</p>

            <span className="pillar-col-label" style={{ marginTop: '20px' }}>
              Typical Capabilities & Scope
            </span>
            <ul className="pillar-examples-list">
              {activePillar.examples.map((item) => (
                <li key={item}>
                  <Check size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pillar-precedent-col">
            <span className="pillar-col-label">How We Deliver</span>
            <div className="precedent-box">
              <strong>{activePillar.precedent.name}</strong>
              <p>{activePillar.precedent.context}</p>
              {activePillar.precedent.link && (
                <a
                  href={activePillar.precedent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="precedent-link"
                >
                  View reference <ExternalLink size={14} />
                </a>
              )}
            </div>
            <div className="pillar-action-row">
              <a href="/agent-mapper" className="agency-button-sm">
                Discuss an engagement <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgencyCTA() {
  return (
    <section className="agency-cta">
      <div className="agency-container">
        <Reveal>
          <p className="agency-eyebrow">YOUR NEXT CHAPTER</p>
          <h2>
            What could your
            <br />
            business <em>do next?</em>
          </h2>
          <p>
            Tell us what's slowing down your team or where you want your business to grow. We'll help you map out the first step and build software that works.
          </p>
          <div className="agency-cta-actions">
            <a className="agency-button" href="/agent-mapper">
              Discuss your business <ArrowUpRight size={20} />
            </a>
            <a className="agency-text-link" href="/solutions">
              Review our four services <ArrowUpRight size={18} />
            </a>
          </div>
          <p className="agency-cta-disclaimer">
            Based in Ghana. Working with businesses across Africa and beyond. A real person reviews every inquiry.
          </p>
        </Reveal>
        <span className="agency-cta-arrow" aria-hidden="true">
          <ArrowUpRight strokeWidth={0.7} />
        </span>
      </div>
    </section>
  );
}

