'use client';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AksenGuide } from '@/components/aksen-guide';

const navItems = [
  { href: '/solutions', label: 'Services' },
  { href: '/how-it-works', label: 'Approach' },
  { href: '/industries', label: 'Examples' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Insights' },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const wide = window.matchMedia('(min-width: 1061px)');
    const adapt = () => {
      if (wide.matches) setOpen(false);
    };
    document.addEventListener('keydown', close);
    wide.addEventListener('change', adapt);
    return () => {
      document.removeEventListener('keydown', close);
      wide.removeEventListener('change', adapt);
    };
  }, [open]);

  return (
    <>
      <a className="agency-skip" href="#main-content">
        Skip to content
      </a>
      <header className="agency-header">
        <nav className="agency-nav agency-container" aria-label="Main navigation">
          <a className="agency-wordmark" href="/" aria-label="Aksen Labs home">
            <span className="agency-mark" aria-hidden="true">
              a
            </span>
            <span>
              aksen<span className="agency-wordmark-labs">labs</span>
            </span>
          </a>
          <div className="agency-nav-links">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={path === item.href ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </div>
          <a className="agency-nav-cta" href="/agent-mapper">
            Let’s talk <ArrowUpRight size={17} />
          </a>
          <button
            ref={toggle}
            type="button"
            className="agency-menu-toggle"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            aria-expanded={open}
            aria-controls="agency-mobile-nav"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </nav>
        {open && (
          <nav id="agency-mobile-nav" className="agency-mobile-nav" aria-label="Mobile navigation">
            {navItems.map((item, i) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={path === item.href ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                <span>0{i + 1}</span>
                {item.label}
                <ArrowUpRight size={18} />
              </a>
            ))}
            <a href="/agent-mapper" onClick={() => setOpen(false)} style={{ color: '#175b3b', fontWeight: 600 }}>
              <span>↗</span>
              Discuss your business
              <ArrowUpRight size={18} />
            </a>
          </nav>
        )}
      </header>
      <AksenGuide />
    </>
  );
}

export function SiteChrome() {
  return <SiteNav />;
}

export function SiteFooter() {
  return (
    <footer className="agency-footer">
      <div className="agency-container">
        <div className="agency-footer-top">
          <a className="agency-wordmark" href="/">
            <span className="agency-mark" aria-hidden="true">
              a
            </span>
            <span>
              aksen<span className="agency-wordmark-labs">labs</span>
            </span>
          </a>
          <p>
            Helping African businesses
            <br />
            prosper through technology.
          </p>
          <a className="agency-text-link" href="/agent-mapper" style={{ color: '#c2f576' }}>
            Start a conversation
            <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="agency-footer-bottom">
          <span>© {new Date().getFullYear()} Aksen Labs</span>
          <span>Based in Ghana. Working across Africa and beyond.</span>
          <div>
            <a href="/solutions">Services</a>
            <a href="/how-it-works">Approach</a>
            <a href="/industries">Examples</a>
            <a href="/agents">AI in practice</a>
            <a href="/about">About</a>
            <a href="/blog">Insights</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

