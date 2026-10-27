'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { DailyAction } from '@/lib/daily-work';

const AREAS = ['All', 'Sales', 'Work', 'Money'] as const;

export function DailyActionList({ actions }: { actions: DailyAction[] }) {
  const [area, setArea] = useState<(typeof AREAS)[number]>('All');
  const [expanded, setExpanded] = useState(false);
  const filtered = actions.filter(
    (item) => area === 'All' || item.area === area,
  );
  const visible = expanded ? filtered : filtered.slice(0, 3);
  const countFor = (value: (typeof AREAS)[number]) =>
    value === 'All'
      ? actions.length
      : actions.filter((item) => item.area === value).length;
  return (
    <>
      <fieldset className="daily-filters" aria-label="Filter next steps">
        {AREAS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={area === value}
            onClick={() => {
              setArea(value);
              setExpanded(false);
            }}
          >
            {value}
            <span className="daily-filter-count">{countFor(value)}</span>
          </button>
        ))}
      </fieldset>
      {visible.length ? (
        <ol className="daily-actions" id="daily-action-list">
          {visible.map((item) => (
            <li key={item.id} data-urgent={item.priority === 0}>
              <div>
                <p className="daily-meta">
                  <span className="daily-area">{item.area}</span>
                  <span className="daily-reason">{item.reason}</span>
                </p>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
              {/* The link covers the whole row (see daily-work.css), so the
                  record is one tap away wherever the eye lands. */}
              <Link
                href={item.href}
                prefetch={false}
                aria-label={`Open ${item.title}: ${item.reason}`}
              >
                Open <ArrowUpRight size={16} />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-admin">
          <strong>
            No next steps to show
            {area === 'All' ? '' : ` in ${area.toLowerCase()}`}.
          </strong>
          <span>
            Check your records for work or dates that have not been added yet.
          </span>
        </div>
      )}
      {filtered.length > 3 && (
        <button
          className="daily-show-more"
          type="button"
          aria-expanded={expanded}
          aria-controls="daily-action-list"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? 'Show fewer'
            : `Show ${filtered.length - 3} more next steps`}
        </button>
      )}
    </>
  );
}
