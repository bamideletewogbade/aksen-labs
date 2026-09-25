'use client';
import Link from 'next/link';
import {
  Activity,
  FilePenLine,
  Gauge,
  BookOpen,
  BriefcaseBusiness,
  Menu,
  X,
  MessageSquareText,
  Package,
  Receipt,
  ScrollText,
  ClipboardList,
  Lightbulb,
  Search,
  SlidersHorizontal,
  Image,
  MonitorPlay,
  Mail,
  MailPlus,
  ArrowUpRight,
  ChevronDown,
  Share2,
  Kanban,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
/**
 * The sidebar lists places you go. Two things were here that are not places.
 *
 * Approvals was a destination for a queue that has never had anything in it,
 * and can only ever hold one kind of item: a request to publish an article.
 * The same person writes the article and approves it, so it is a step in
 * publishing rather than somewhere to visit. It now lives on Articles, next to
 * the drafts it gates, and the dashboard still raises it when something is
 * actually waiting.
 *
 * Templates was a page for reading document templates that Daily work already
 * lets you pick from and draft with. A separate destination for the same
 * material is a library nobody has a reason to walk into.
 *
 * Both pages still exist and still work. They are reachable from the place
 * where you would want them, which is not the same as deserving a permanent
 * line in the navigation.
 */
const groups = [
  {
    label: 'Today',
    items: [
      { href: '/admin', label: 'Home', icon: Activity },
      { href: '/admin/agent-desk', label: 'AI tools', icon: ClipboardList },
    ],
  },
  {
    // Demand, in the order it arrives: people we found, people who wrote to
    // us, what that turned into, and what we send back. Support conversations
    // come from the public assistant, so they are strangers asking questions
    // rather than clients with problems, and filing them under delivery buried
    // inbound interest underneath work already won.
    label: 'Sales',
    items: [
      {
        href: '/admin/pipeline',
        label: 'Sales pipeline',
        icon: Kanban,
      },
      { href: '/admin/prospects', label: 'Find leads', icon: Search },
      { href: '/admin/support', label: 'Messages', icon: MessageSquareText },
      // People waiting on a product rather than asking about a service. They
      // arrive through the products page, not the enquiry funnel, so they never
      // appear in the pipeline and would otherwise have nowhere to be read.
      { href: '/admin/waitlist', label: 'Product waitlist', icon: MailPlus },
      { href: '/admin/email', label: 'Email drafts', icon: Mail },
    ],
  },
  {
    label: 'Client work',
    items: [
      {
        href: '/admin/projects',
        label: 'Client projects',
        icon: BriefcaseBusiness,
      },
      { href: '/admin/operations', label: 'Client drafts', icon: FilePenLine },
      { href: '/admin/templates', label: 'Document templates', icon: ScrollText },
      { href: '/admin/workspaces', label: 'Finances & invoices', icon: Receipt },
    ],
  },
  {
    label: 'Marketing',
    items: [
      // Not "Products": the page covers everything public, and there is one
      // product against four free tools.
      { href: '/admin/products', label: 'Public site', icon: Package },
      // Suggestions from the public board. It sits under Marketing rather than
      // Sales because a suggestion is not a lead: most of the people who leave
      // one are already using something, and the decision it needs is what to
      // build, not who to call.
      { href: '/admin/feedback', label: 'Feature requests', icon: Lightbulb },
      { href: '/admin/content', label: 'Articles', icon: BookOpen },
      { href: '/admin/social', label: 'Social hub', icon: Share2 },
      { href: '/admin/studio', label: 'Create media', icon: Image },
      { href: '/admin/demos', label: 'Demos', icon: MonitorPlay },
    ],
  },
  {
    label: 'Manage',
    items: [
      { href: '/admin/agents', label: 'AI usage & model costs', icon: Gauge },
      { href: '/admin/audit', label: 'Activity history', icon: ScrollText },
      {
        href: '/admin/support/knowledge',
        label: 'Help answers',
        icon: BookOpen,
      },
      {
        href: '/admin/settings',
        label: 'Workspace settings',
        icon: SlidersHorizontal,
      },
    ],
  },
];
export function AdminNav({ signOutPath }: { signOutPath: string }) {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const activeGroup = groups.find((group) =>
    group.items.some(({ href }) => pathname === href),
  )?.label;
  const [expandedGroup, setExpandedGroup] = useState(activeGroup ?? 'Today');
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
        {groups.map((group) => {
          const expanded = expandedGroup === group.label;
          return (
            <div
              className={
                expanded ? 'admin-nav-group is-expanded' : 'admin-nav-group'
              }
              key={group.label}
            >
              <button
                className="admin-nav-group-toggle"
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpandedGroup(expanded ? '' : group.label)}
              >
                <span>{group.label}</span>
                <ChevronDown size={15} />
              </button>
              <div className="admin-nav-group-items">
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
                    {/* Wrapped because a bare text node cannot be selected,
                        and the collapsed rail has to hide the words while
                        keeping the icon. */}
                    <span className="admin-nav-label">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
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
