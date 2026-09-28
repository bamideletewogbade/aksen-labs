'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * The piece of the homepage story that needs a picture rather than a
 * sentence: the size of the problem. The screenshot gallery of our own
 * workspace was removed on 28 Sep 2026; owners judge us on their problem,
 * not on our back office.
 */

function useSeen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setSeen(true);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, seen };
}

/**
 * Forty messages, three of them orders. A number in a sentence is read and
 * forgotten; forty squares with three lit is the same fact in a form the
 * reader can see the shape of.
 */
const ORDERS = new Set([9, 22, 31]);

export function MessageVolume() {
  const { ref, seen } = useSeen<HTMLDivElement>();
  return (
    // The heading beside it already says forty messages and three orders, so
    // the squares are a second telling rather than the only one. Announcing
    // them again would add nothing but noise.
    <div
      className={`volume ${seen ? 'is-seen' : ''}`}
      ref={ref}
      aria-hidden="true"
    >
      <div className="volume-grid">
        {Array.from({ length: 40 }, (_, index) => (
          <span
            key={index}
            className={ORDERS.has(index) ? 'is-order' : ''}
            style={{ '--i': index } as CSSProperties}
          />
        ))}
      </div>
      <div className="volume-key">
        <span>
          <i className="is-order" />3 orders
        </span>
        <span>
          <i />
          37 price checks, questions and people who never replied
        </span>
      </div>
    </div>
  );
}
