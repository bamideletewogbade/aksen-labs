'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  AlertCircle,
  BriefcaseBusiness,
  FileCheck,
} from 'lucide-react';

export type FounderAction = {
  id: string;
  category: 'ai_strategic' | 'urgent' | 'delivery' | 'decision';
  badge: string;
  tone: 'ai' | 'urgent' | 'delivery' | 'decision';
  label: string;
  detail: string;
  actionText: string;
  href: string;
};

export function FounderActionQueue({
  actions,
}: {
  actions: FounderAction[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(
    () => [
      { id: 'all', label: 'All', count: actions.length },
      {
        id: 'ai_strategic',
        label: 'Strategic Growth',
        count: actions.filter((a) => a.category === 'ai_strategic').length,
      },
      {
        id: 'urgent',
        label: 'Urgent & Cash',
        count: actions.filter((a) => a.category === 'urgent').length,
      },
      {
        id: 'delivery',
        label: 'Delivery & Gates',
        count: actions.filter(
          (a) => a.category === 'delivery' || a.category === 'decision',
        ).length,
      },
    ],
    [actions],
  );

  const visibleActions = useMemo(() => {
    if (selectedCategory === 'all') return actions;
    if (selectedCategory === 'delivery') {
      return actions.filter(
        (a) => a.category === 'delivery' || a.category === 'decision',
      );
    }
    return actions.filter((a) => a.category === selectedCategory);
  }, [actions, selectedCategory]);

  return (
    <div className="founder-queue-desk">
      {/* Category Filter Tabs */}
      <div className="founder-queue-tabs" role="tablist">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`queue-tab ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label} <span className="queue-count">{cat.count}</span>
            </button>
          );
        })}
      </div>

      {visibleActions.length ? (
        <ol className="founder-action-list upgraded">
          {visibleActions.map((action) => (
            <li key={action.id} className={`queue-item tone-${action.tone}`}>
              <div className={`action-indicator ${action.tone}`}>
                {action.tone === 'ai' ? (
                  <Zap size={14} />
                ) : action.tone === 'urgent' ? (
                  <AlertCircle size={14} />
                ) : action.tone === 'delivery' ? (
                  <BriefcaseBusiness size={14} />
                ) : (
                  <FileCheck size={14} />
                )}
              </div>

              <div className="action-body">
                <div className="action-meta-line">
                  <span className={`action-badge badge-${action.tone}`}>
                    {action.badge}
                  </span>
                  <strong className="action-title">{action.label}</strong>
                </div>

                <p className="action-detail">{action.detail}</p>
              </div>

              <div className="action-cta-wrap">
                <Link
                  href={action.href}
                  className={`action-btn btn-${action.tone}`}
                  aria-label={`${action.actionText} for ${action.label}`}
                >
                  <span>{action.actionText}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="founder-clear">
          <CheckCircle2 />
          <strong>No pending items in this category.</strong>
          <span>You&apos;re clear for now.</span>
        </div>
      )}
    </div>
  );
}
