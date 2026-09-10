'use client';

import { Activity, Bot, BookOpen, BriefcaseBusiness, Menu, X, MessageSquareText, Receipt, ScrollText, ShieldAlert, Sparkle, Users } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Command centre', icon: Activity },
  { href: '/admin/pipeline', label: 'Pipeline', icon: Users },
  { href: '/admin/workspaces', label: 'Clients & billing', icon: Receipt },
  { href: '/admin/projects', label: 'Projects', icon: BriefcaseBusiness },
  { href: '/admin/content', label: 'Content', icon: BookOpen },
  { href: '/admin/studio', label: 'Creative Studio', icon: Sparkle },
  { href: '/admin/agents', label: 'Agent operations', icon: Bot },
  { href: '/admin/support', label: 'Support inbox', icon: MessageSquareText },
  { href: '/admin/approvals', label: 'Approvals', icon: ShieldAlert },
  { href: '/admin/audit', label: 'Activity record', icon: ScrollText },
];

export function AdminNav({ signOutPath }: { signOutPath: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  function closeOnEscape(event: React.KeyboardEvent) {
    if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
  }
  return (
    <div className="admin-navigation" onKeyDown={closeOnEscape}>
    <button ref={toggle} className="admin-menu-toggle" type="button" aria-expanded={open} aria-controls="admin-navigation-links" onClick={() => setOpen(current => !current)}>
      {open ? <X size={18} /> : <Menu size={18} />} {open ? 'Close menu' : 'Menu'}
    </button>
    <nav id="admin-navigation-links" aria-label="Admin navigation" className={open ? 'admin-links is-open' : 'admin-links'}>
      {navItems.map(({ href, label, icon: Icon }) => (
        <a key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? 'page' : undefined} className={pathname === href ? 'active' : ''}><Icon /> {label}</a>
      ))}
      <a className="admin-menu-signout" href={signOutPath}>Sign out</a>
    </nav>
    </div>
  );
}
