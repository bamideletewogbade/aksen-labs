'use client';
import { lazy, Suspense, useCallback, useState } from 'react';

const GuidePanel = lazy(() =>
  import('@/components/aksen-guide-panel').then((module) => ({
    default: module.GuidePanel,
  })),
);

export function AksenGuide({ className = '' }: { className?: string }) {
  const [requested, setRequested] = useState(false);
  const [open, setOpen] = useState(false);
  // Fetched on intent so the panel is usually ready by the time it is clicked,
  // while a visitor who never reaches for it never downloads it at all.
  const preload = useCallback(() => setRequested(true), []);
  return (
    <>
      <button
        type="button"
        className={`aksen-guide-trigger ${className}`.trim()}
        aria-label="Open Ask Aksen support"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={preload}
        onFocus={preload}
        onClick={() => {
          setRequested(true);
          setOpen(true);
        }}
      >
        <span className="brand-signal" />
        <span>Ask Aksen</span>
      </button>
      {requested && (
        <Suspense fallback={null}>
          <GuidePanel open={open} onOpenChange={setOpen} />
        </Suspense>
      )}
    </>
  );
}
