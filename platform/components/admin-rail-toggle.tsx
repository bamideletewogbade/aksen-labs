'use client';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useSyncExternalStore } from 'react';

/**
 * Pin the sidebar open, or let it collapse to a rail.
 *
 * The state lives on the document element rather than in React, for one
 * reason: it has to be correct before the first paint. A layout that renders
 * expanded and then collapses on hydration is a visible jump on every
 * navigation, and the inline script in the admin layout sets the attribute
 * before anything is drawn. Reading it back through useSyncExternalStore keeps
 * this button honest about what the page is actually doing without a second
 * copy of the truth that can drift, and without a setState in an effect.
 */

const KEY = 'aksen-rail';
const EVENT = 'aksen-rail-change';

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}
const read = () => document.documentElement.dataset.rail === 'collapsed';

export function AdminRailToggle() {
  // Expanded on the server: the inline script has already corrected the
  // document by the time anyone sees it, so this only decides the first
  // render's markup.
  const collapsed = useSyncExternalStore(subscribe, read, () => false);

  function toggle() {
    const next = collapsed ? 'expanded' : 'collapsed';
    document.documentElement.dataset.rail = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // A blocked storage is a preference that does not survive the tab, which
      // is worth less than the toggle refusing to work.
    }
    window.dispatchEvent(new Event(EVENT));
  }

  return (
    <button
      type="button"
      className="admin-rail-toggle"
      onClick={toggle}
      // The server cannot know what this browser last chose, so the first
      // render says expanded and the store corrects it. That is the intended
      // shape of useSyncExternalStore and not a bug worth warning about.
      suppressHydrationWarning
      aria-pressed={collapsed}
      title={collapsed ? 'Keep the sidebar open' : 'Collapse the sidebar'}
      aria-label={collapsed ? 'Keep the sidebar open' : 'Collapse the sidebar'}
    >
      {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
    </button>
  );
}
