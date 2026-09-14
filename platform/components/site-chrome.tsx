'use client';
import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AksenGuide } from '@/components/aksen-guide';
import { WhatsAppLink } from '@/components/whatsapp-link';
import { Reveal } from './agency-motion';
const navItems = [
  { href: '/solutions', label: 'Services' },
  { href: '/products', label: 'Products' },
  // "Free agents" read as freelancers or transfer windows. What they are is
  // free tools, and the page itself explains they are agents.
  { href: '/business-agents', label: 'Free tools' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/how-it-works', label: 'Approach' },
  { href: '/industries', label: 'Industries' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
];
function Wordmark() {
  return (
    <Link className="agency-wordmark" href="/" aria-label="Aksen Labs home">
      <span className="agency-mark" aria-hidden="true">
        a
      </span>
      <span>
        aksen<span className="agency-wordmark-labs">labs</span>
      </span>
    </Link>
  );
}
export function SiteNav() {
  const [openRoute, setOpenRoute] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const path = usePathname();
  const open = openRoute === path;
  const setOpen = (value: boolean) => setOpenRoute(value ? path : null);
  const toggle = useRef<HTMLButtonElement>(null);
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    const frame = requestAnimationFrame(update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
    };
  }, []);
  // The opening scene sizes itself against the header, so publish the real height.
  // The bar shrinks once you scroll, so only the resting height is recorded.
  useEffect(() => {
    const measure = () => {
      const node = bar.current;
      if (!node || window.scrollY > 24) return;
      const height = Math.round(node.getBoundingClientRect().height);
      if (height > 0)
        document.documentElement.style.setProperty(
          '--site-nav-h',
          `${height}px`,
        );
    };
    const frame = requestAnimationFrame(measure);
    // The bar transitions back to its resting height over 250ms, and web fonts
    // can settle after first paint, so take a second reading.
    const later = window.setTimeout(measure, 400);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(later);
      window.removeEventListener('resize', measure);
    };
  }, [scrolled]);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenRoute(null);
        toggle.current?.focus();
      }
    };
    const wide = window.matchMedia('(min-width: 1061px)');
    const adapt = () => {
      if (wide.matches) setOpenRoute(null);
    };
    document.addEventListener('keydown', close);
    wide.addEventListener('change', adapt);
    return () => {
      document.removeEventListener('keydown', close);
      wide.removeEventListener('change', adapt);
    };
  }, [open]);
  const current = (href: string) =>
    path === href || path?.startsWith(`${href}/`);
  return (
    <>
      <Link className="agency-skip" href="#main-content">
        Skip to content
      </Link>
      <header
        ref={bar}
        className={`agency-header refresh-header ${path === '/' ? 'is-home' : ''} ${scrolled ? 'is-scrolled' : ''}`}
      >
        <nav
          className="agency-nav agency-container"
          aria-label="Main navigation"
        >
          <Wordmark />
          <div className="agency-nav-links">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
          {/* The action stays on the bar rather than moving into the menu: it is
              the only route to an enquiry, and a menu has to be opened first.
              On a narrow phone it carries a shorter label so it fits on one
              line and leaves the menu button its full target. */}
          <Link
            className="agency-nav-cta"
            href="/agent-mapper"
            aria-label="Discuss your business"
          >
            <span className="agency-nav-cta-long">Discuss your business</span>
            <span className="agency-nav-cta-short">Let’s talk</span>
            <ArrowUpRight size={17} />
          </Link>
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
          <nav
            id="agency-mobile-nav"
            className="agency-mobile-nav"
            aria-label="Mobile navigation"
          >
            {navItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current(item.href) ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                <span>0{i + 1}</span>
                {item.label}
                <ArrowUpRight size={18} />
              </Link>
            ))}
            <Link href="/agent-mapper" onClick={() => setOpen(false)}>
              <span>↗</span>Discuss your business
              <ArrowUpRight size={18} />
            </Link>
          </nav>
        )}
      </header>
      <AksenGuide className={path === '/' ? 'is-over-hero' : ''} />
    </>
  );
}
export function SiteChrome() {
  return <SiteNav />;
}
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer
      className={`agency-footer refresh-footer ${compact ? 'is-compact' : ''}`}
    >
      <div className="agency-container">
        {!compact && (
          <Reveal className="refresh-footer-invitation">
            <div>
              <p className="agency-eyebrow">LET’S DISCUSS YOUR BUSINESS</p>
              <h2>
                What would you like
                <br />
                your business to <em>do better?</em>
              </h2>
            </div>
            <Link href="/agent-mapper" className="refresh-footer-cta">
              <span>Discuss your business</span>
              <ArrowUpRight size={30} />
            </Link>
          </Reveal>
        )}
        <Reveal className="refresh-footer-middle" delay={60}>
          <Wordmark />
          <p>
            Helping African businesses prosper
            <br />
            through technology.
          </p>
          <div>
            <Link href="/business-agents">
              Try business agents <ArrowUpRight size={15} />
            </Link>
            <Link href="/agents">
              AI in practice <ArrowUpRight size={15} />
            </Link>
            <Link href="/workspace-demo">
              Workspace demo <ArrowUpRight size={15} />
            </Link>
          </div>
        </Reveal>
        <div className="refresh-footer-bottom">
          <span>
            © {new Date().getFullYear()} Aksen Labs · Based in Ghana
            <WhatsAppLink className="is-footer" label="WhatsApp" showNumber />
          </span>
          <nav aria-label="Footer navigation">
            {navItems.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/privacy">Privacy</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
