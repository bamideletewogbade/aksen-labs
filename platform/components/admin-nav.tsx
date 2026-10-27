'use client';
import Link from 'next/link';
import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  Menu,
  X,
  Package,
  Receipt,
  ArrowUpRight,
  Kanban,
  Settings2,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { adminModules, moduleForPath } from '@/lib/admin-navigation';

const icons = {
  home: Activity,
  portfolio: Package,
  pipeline: Kanban,
  projects: BriefcaseBusiness,
  money: Receipt,
  articles: BookOpen,
  settings: Settings2,
};
export function AdminNav({ signOutPath }: { signOutPath: string }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  // The section clicked, keyed to the page it was clicked from. A slow page
  // used to leave the old section highlighted for seconds, which read as the
  // click not landing. Once the path changes the key no longer matches and
  // the real location takes over, so nothing needs clearing.
  const [pending, setPending] = useState<{ from: string; href: string }>();
  const activeHref =
    pending?.from === pathname ? pending.href : moduleForPath(pathname)?.href;
  const open = openPath === pathname;
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPath(null);
        toggle.current?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return (
    <div className="admin-navigation">
      <button
        ref={toggle}
        className="admin-menu-toggle"
        type="button"
        aria-expanded={open}
        aria-controls="admin-navigation-links"
        onClick={() => setOpenPath(open ? null : pathname)}
      >
        {open ? <X size={18} /> : <Menu size={18} />}{' '}
        {open ? 'Close menu' : 'Menu'}
      </button>
      <nav
        id="admin-navigation-links"
        aria-label="Admin navigation"
        className={open ? 'admin-links is-open' : 'admin-links'}
      >
        <div className="admin-main-links">
          {adminModules.map(({ href, label, icon }) => {
            const Icon = icons[icon];
            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                title={label}
                onClick={(event) => {
                  setOpenPath(null);
                  if (!event.metaKey && !event.ctrlKey && !event.shiftKey)
                    setPending({ from: pathname, href });
                }}
                aria-current={activeHref === href ? 'page' : undefined}
                className={activeHref === href ? 'active' : ''}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="admin-nav-label">{label}</span>
              </Link>
            );
          })}
        </div>
        <Link href="/" className="admin-site-link">
          <span className="admin-nav-label">View website</span>
          <ArrowUpRight size={16} />
        </Link>
        <a className="admin-menu-signout" href={signOutPath}>
          Sign out
        </a>
      </nav>
    </div>
  );
}
