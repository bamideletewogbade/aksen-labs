'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Two jobs, both about the gap between clicking a link and the next page
 * arriving. Server-rendered admin pages fetch on navigation, so that gap is
 * real and was previously silent: the old page simply sat there.
 *
 * A bar appears at the top once the wait is long enough to notice, and the new
 * content fades up when it replaces the old. Keying the wrapper on the path
 * restarts that animation per navigation.
 *
 * Nothing here delays rendering. Under prefers-reduced-motion the arrival
 * animation collapses to near zero via the global rule in globals.css, and the
 * page is readable at every frame regardless.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const [navigating, setNavigating] = useState(false);

  // A click on an internal link starts the wait. The pathname changing ends
  // it. Listening at the document means every link is covered without each
  // one having to opt in.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      const link = target?.closest?.('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/') || href.startsWith('//')) return;
      if (link.target && link.target !== '_self') return;
      if (link.hasAttribute('download')) return;
      // Same page, or an anchor within it, involves no fetch.
      if (href === pathname || href.startsWith('#')) return;
      setNavigating(true);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [pathname]);

  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      setNavigating(false);
    }
  }, [pathname]);

  // A navigation that fails, or one the router refuses, must not leave the bar
  // running for ever.
  useEffect(() => {
    if (!navigating) return;
    const timer = setTimeout(() => setNavigating(false), 8000);
    return () => clearTimeout(timer);
  }, [navigating]);

  return (
    <>
      {navigating && (
        <output className="route-progress" aria-live="polite">
          <span className="sr-only">Loading page</span>
        </output>
      )}
      <div key={pathname} className="route-fade">
        {children}
      </div>
    </>
  );
}
