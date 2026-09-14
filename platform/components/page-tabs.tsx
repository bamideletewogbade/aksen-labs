'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Tabs for a marketing page.
 *
 * Two constraints shaped this. Every panel has to be in the HTML whether or not
 * it is the open one, because a section that only exists after a click is a
 * section search engines and a reader hitting Ctrl+F will never find. So the
 * panels are server-rendered children and the tab only sets `hidden`.
 *
 * And each tab needs an address. Someone linking to the free tools should be
 * able to send /products#free-tools and have it open there. The hash is read on
 * mount and written on change, which also means the existing in-page anchors
 * pointing at these ids keep working instead of scrolling to a hidden element.
 */

export type Tab = {
  id: string;
  label: string;
  /** Shown beside the label, for a count or a short qualifier. */
  note?: string;
  panel: ReactNode;
};

export function PageTabs({
  tabs,
  label,
  id,
}: {
  tabs: Tab[];
  /** Names the tablist for screen readers, e.g. "Products and tools". */
  label: string;
  /** Anchor for links that should land on the tabs rather than inside a panel. */
  id?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.replace('#', '');
      if (id && tabs.some((tab) => tab.id === id)) setActive(id);
    };
    fromHash();
    // Back and forward should move between tabs, since each one is an address.
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [tabs]);

  const choose = (id: string) => {
    setActive(id);
    // replaceState rather than assigning location.hash: the latter scrolls the
    // panel under the sticky header, and the tab strip is already in view.
    if (typeof window !== 'undefined')
      window.history.replaceState(null, '', `#${id}`);
  };

  // Arrow keys move between tabs, which is what the pattern promises and what
  // anyone navigating by keyboard will try.
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
    <div className="page-tabs" id={id}>
      <div
        className="page-tabs-strip agency-container"
        role="tablist"
        aria-label={label}
        ref={strip}
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            className="page-tab"
            onClick={() => choose(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
            {tab.note && <span>{tab.note}</span>}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className="page-tab-panel"
          // Panels are long, so the panel itself is not focusable; the headings
          // inside it are the landmarks worth landing on.
          tabIndex={-1}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
