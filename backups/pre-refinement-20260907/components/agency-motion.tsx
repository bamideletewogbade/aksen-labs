'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type RevealProps = {
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
  children,
  className = '',
  delay = 0,
  duration = 640,
  direction = 'up',
  distance = 20,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;

    let translateFrom = 'translateY(20px)';
    if (direction === 'up') translateFrom = `translateY(${distance}px)`;
    else if (direction === 'down') translateFrom = `translateY(-${distance}px)`;
    else if (direction === 'left') translateFrom = `translateX(${distance}px)`;
    else if (direction === 'right') translateFrom = `translateX(-${distance}px)`;
    else if (direction === 'none') translateFrom = 'none';

    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!preference.matches) {
          animation = node.animate(
            [
              { opacity: 0.4, transform: `${translateFrom} scale(0.985)` },
              { opacity: 1, transform: 'translate(0, 0) scale(1)' },
            ],
            {
              duration,
              delay,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'backwards',
            }
          );
        }
        observer.disconnect();
      },
      { threshold: 0.08 }
    );

    const stop = () => {
      if (preference.matches) animation?.cancel();
    };

    preference.addEventListener('change', stop);
    observer.observe(node);

    return () => {
      observer.disconnect();
      animation?.cancel();
      preference.removeEventListener('change', stop);
    };
  }, [delay, duration, direction, distance]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * ScrollTextLines: Inspired by motion.dev scroll-text-lines.
 * Reveals lines of text with masked overflow and upward translation.
 */
export function ScrollTextLines({
  lines,
  className = '',
  lineClassName = '',
  delay = 0,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`scroll-text-lines-container ${className}`}>
      {lines.map((line, i) => (
        <div key={line} className="scroll-text-line-mask">
          <span
            className={`scroll-text-line-inner ${lineClassName} ${inView ? 'is-in-view' : ''}`}
            style={{
              transitionDelay: `${delay + i * 90}ms`,
            }}
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * HeroParallax: Inspired by motion.dev react-hero-parallax-layers & scroll-zoom-hero.
 * Performs subtle, hardware-accelerated parallax and zoom on scroll.
 */
export function HeroParallax({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rect = node.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          if (rect.top < windowHeight && rect.bottom > 0) {
            const progress = Math.max(0, Math.min(1, -rect.top / (rect.height || 1)));
            const scale = 1 + progress * 0.06;
            const translateY = progress * 24;
            node.style.setProperty('--parallax-scale', scale.toFixed(3));
            node.style.setProperty('--parallax-y', `${translateY.toFixed(1)}px`);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div ref={ref} className={`hero-parallax-wrapper ${className}`}>
      {children}
    </div>
  );
}

/**
 * VelocityTicker: Inspired by motion.dev vue-scroll-velocity-linked-offset.
 * Continuous smooth horizontal movement that speeds up dynamically.
 */
export function VelocityTicker({
  items,
  speed = 30,
}: {
  items: string[];
  speed?: number;
}) {
  return (
    <div className="velocity-ticker-wrap" aria-hidden="true">
      <div className="velocity-ticker-track" style={{ animationDuration: `${speed}s` }}>
        {items.concat(items).map((item, i) => (
          <span key={`${item}-${i}`} className="velocity-ticker-item">
            <span className="ticker-bullet" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * AnimatedCounter: Counts smoothly from 0 to target value on scroll view.
 */
export function AnimatedCounter({
  target,
  prefix = '',
  suffix = '',
  duration = 1400,
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window)) {
      setValue(target);
      return;
    }

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) {
      setValue(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(easeOut * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value}
      {suffix}
    </span>
  );
}


