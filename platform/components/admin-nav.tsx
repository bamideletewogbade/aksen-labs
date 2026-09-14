'use client';
import Link from 'next/link';
import {
  Activity,
  Bot,
  BookOpen,
  BriefcaseBusiness,
  Menu,
  X,
  MessageSquareText,
  Package,
  Receipt,
  ScrollText,
  ShieldAlert,
  ClipboardList,
  Search,
  SlidersHorizontal,
  Image,
  MonitorPlay,
  Mail,
  ArrowUpRight,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
const groups = [
  {
    label: 'Command',
    items: [
      { href: '/admin', label: 'Overview', icon: Activity },
      { href: '/admin/operations', label: 'Operations desk', icon: Bot },
      { href: '/admin/agent-desk', label: 'Agent desk', icon: ClipboardList },
      { href: '/admin/approvals', label: 'Approvals', icon: ShieldAlert },
    ],
  },
  {
    label: 'Win work',
    items: [
      { href: '/admin/prospects', label: 'Lead Scout', icon: Search },
      { href: '/admin/pipeline', label: 'Enquiries', icon: MessageSquareText },
      { href: '/admin/email', label: 'Email outbox', icon: Mail },
    ],
  },
  {
    label: 'Serve clients',
    items: [
      { href: '/admin/projects', label: 'Projects', icon: BriefcaseBusiness },
      { href: '/admin/workspaces', label: 'Clients & billing', icon: Receipt },
      {
        href: '/admin/support',
        label: 'Conversations',
        icon: MessageSquareText,
      },
      { href: '/admin/templates', label: 'Templates', icon: ScrollText },
    ],
  },
  {
    label: 'Build the brand',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/content', label: 'Blog', icon: BookOpen },
      { href: '/admin/studio', label: 'Media studio', icon: Image },
      { href: '/admin/demos', label: 'Service demos', icon: MonitorPlay },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/agents', label: 'AI activity', icon: Bot },
      { href: '/admin/audit', label: 'Activity log', icon: ScrollText },
      {
        href: '/admin/support/knowledge',
        label: 'Support knowledge',
        icon: BookOpen,
      },
      { href: '/admin/settings', label: 'Settings', icon: SlidersHorizontal },
    ],
  },
];
export function AdminNav({ signOutPath }: { signOutPath: string }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
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
        {groups.map((group) => (
          <div className="admin-nav-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={() => setOpenPath(null)}
                aria-current={pathname === href ? 'page' : undefined}
                className={pathname === href ? 'active' : ''}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </div>
        ))}
        <Link href="/" className="admin-site-link">
          View website <ArrowUpRight size={16} />
        </Link>
        <a className="admin-menu-signout" href={signOutPath}>
          Sign out
        </a>
      </nav>
    </div>
  );
}
