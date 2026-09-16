'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Tabs for a workspace screen that had grown into one long scroll.
 *
 * The marketing PageTabs solves a different problem (search engines, Ctrl+F on
 * a public page) and carries the site's styling. In the admin the job is only
 * to stop a screen doing four things at once, so this one is plainer, but it
 * keeps the two properties that made PageTabs worth copying:
 *
 * Every panel stays mounted and is only hidden. A half-typed brief in one tab
 * must still be there after a look at another, and a form that remounted on
 * every switch would quietly throw that work away.
 *
 * Each tab has an address. /admin/prospects#queue opens on the queue, so a link
 * from the home screen can land on the part it is talking about.
 *
 * Pass `active` and `onChange` when the screen itself needs to move between
 * tabs, for example to show the queue once a search has finished.
 */

export type AdminTab = {
  id: string;
  label: string;
  /** A count or short qualifier shown beside the label. */
  note?: string | number;
  panel: ReactNode;
};

export function AdminTabs({
  tabs,
  label,
  active: controlled,
  onChange,
  className = '',
}: {
  tabs: AdminTab[];
  /** Names the tablist for screen readers. */
  label: string;
  active?: string;
  onChange?: (id: string) => void;
  className?: string;
}) {
  const [own, setOwn] = useState(tabs[0]?.id);
  const active = controlled ?? own;
  const strip = useRef<HTMLDivElement>(null);

  const choose = (id: string) => {
    setOwn(id);
    onChange?.(id);
    // replaceState, not location.hash, so switching does not scroll the page
    // or fill the back button with tab clicks.
    window.history.replaceState(null, '', `#${id}`);
  };

  // Keyed on the ids alone, so a count changing in a label does not re-read
  // the hash and undo a tab the reader has just chosen.
  const ids = tabs.map((tab) => tab.id).join('|');
  useEffect(() => {
    const valid = ids.split('|');
    const read = () => {
      const id = window.location.hash.replace('#', '');
      if (!id || !valid.includes(id)) return;
      setOwn(id);
      onChange?.(id);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [ids, onChange]);

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const step =
      event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + tabs.length) % tabs.length;
    choose(tabs[next].id);
    strip.current
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  };

  return (
    <div className={`admin-tabs ${className}`.trim()}>
      <div
        className="admin-tabs-strip"
        role="tablist"
        aria-label={label}
        ref={strip}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`admin-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`admin-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            className="admin-tab"
            onClick={() => choose(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
            {tab.note !== undefined && tab.note !== '' && (
              <span className="admin-tab-note">{tab.note}</span>
            )}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`admin-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`admin-tab-${tab.id}`}
          hidden={active !== tab.id}
          className="admin-tab-panel"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
