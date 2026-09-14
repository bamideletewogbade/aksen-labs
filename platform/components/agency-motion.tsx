'use client';
import { useEffect, useRef, type ReactNode } from 'react';

type RevealProps = {
  as?: 'div' | 'article' | 'aside' | 'section' | 'li';
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
};

/**
 * Reveal: Smooth intersection-triggered reveal with configurable direction,
 * custom spring-like cubic bezier easing, and full prefers-reduced-motion safety.
 */
export function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  delay = 0,
  duration = 520,
  direction = 'up',
  distance = 12,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (
      !node ||
      !('IntersectionObserver' in window) ||
      typeof node.animate !== 'function'
    )
      return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;

    let translateFrom = 'translateY(20px)';
    if (direction === 'up') translateFrom = `translateY(${distance}px)`;
    else if (direction === 'down') translateFrom = `translateY(-${distance}px)`;
    else if (direction === 'left') translateFrom = `translateX(${distance}px)`;
    else if (direction === 'right')
      translateFrom = `translateX(-${distance}px)`;
    else if (direction === 'none') translateFrom = 'none';

    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!preference.matches && !node.contains(document.activeElement)) {
          animation = node.animate(
            [
              { opacity: 0.72, transform: translateFrom },
              { opacity: 1, transform: 'none' },
            ],
            {
              duration,
              delay: Math.min(160, Math.max(0, delay)),
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'backwards',
            },
          );
        }
        observer.disconnect();
      },
      { threshold: 0.08 },
    );

    const stop = () => {
      if (preference.matches) animation?.cancel();
    };
    const focus = () => animation?.cancel();

    preference.addEventListener('change', stop);
    node.addEventListener('focusin', focus);
    observer.observe(node);

    return () => {
      observer.disconnect();
      animation?.cancel();
      preference.removeEventListener('change', stop);
      node.removeEventListener('focusin', focus);
    };
  }, [delay, duration, direction, distance]);

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        ref.current = node;
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
