'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { moduleForPath, routeMatches } from '@/lib/admin-navigation';

export function AdminModuleNav() {
  const pathname = usePathname();
  // Same as the sidebar: the tab clicked shows as current straight away, and
  // the real path takes over once the page arrives.
  const [pending, setPending] = useState<{ from: string; href: string }>();
  const section = moduleForPath(pathname);
  if (!section?.pages.length) return null;
  const active =
    pending?.from === pathname
      ? pending
      : [...section.pages]
          .sort((a, b) => b.href.length - a.href.length)
          .find((page) => routeMatches(pathname, page.href));
  return (
    <nav className="admin-module-nav" aria-label={`${section.label} pages`}>
      <span>{section.label}</span>
      <div>
        {section.pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            prefetch={false}
            onClick={(event) => {
              if (!event.metaKey && !event.ctrlKey && !event.shiftKey)
                setPending({ from: pathname, href: page.href });
            }}
            aria-current={active?.href === page.href ? 'page' : undefined}
          >
            {page.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
