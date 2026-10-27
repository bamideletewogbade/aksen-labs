// Main navigation follows daily work. Tools stay inside the job they support.
export const adminModules = [
  {
    group: 'Daily work',
    label: 'Today',
    href: '/admin',
    icon: 'home',
    pages: [],
  },
  {
    group: 'Daily work',
    label: 'Sales',
    href: '/admin/pipeline',
    icon: 'pipeline',
    pages: [
      { href: '/admin/pipeline', label: 'Enquiries' },
      { href: '/admin/prospects', label: 'Find prospects' },
      { href: '/admin/assessment', label: 'Assessment' },
      // Guide answers lives under /admin/support, one link from the
      // conversations it shapes, so this tab stays lit while editing them.
      { href: '/admin/support', label: 'Conversations' },
      { href: '/admin/email', label: 'Email' },
    ],
  },
  {
    group: 'Daily work',
    label: 'Work',
    href: '/admin/projects',
    icon: 'projects',
    pages: [
      { href: '/admin/projects', label: 'Projects' },
      { href: '/admin/workspaces', label: 'Clients' },
      { href: '/admin/operations', label: 'Prepare a draft' },
      { href: '/admin/templates', label: 'Templates' },
    ],
  },
  {
    group: 'Daily work',
    label: 'Money',
    href: '/admin/money',
    icon: 'money',
    pages: [],
  },
  {
    group: 'Company',
    label: 'Marketing',
    href: '/admin/content',
    icon: 'articles',
    pages: [
      { href: '/admin/content', label: 'Articles' },
      { href: '/admin/social', label: 'Social planning' },
      { href: '/admin/studio', label: 'Create media' },
      { href: '/admin/approvals', label: 'Publishing approvals' },
    ],
  },
  {
    group: 'Company',
    label: 'Company',
    href: '/admin/products',
    icon: 'portfolio',
    pages: [
      { href: '/admin/products', label: 'Branches & products' },
      { href: '/admin/waitlist', label: 'Product interest' },
      { href: '/admin/feedback', label: 'Feedback' },
      { href: '/admin/demos', label: 'Demos' },
    ],
  },
  {
    group: 'Manage',
    label: 'Settings',
    href: '/admin/settings',
    icon: 'settings',
    pages: [
      { href: '/admin/settings', label: 'Settings' },
      { href: '/admin/agents', label: 'AI costs & usage' },
      { href: '/admin/audit', label: 'Activity history' },
    ],
  },
] as const;

export function routeMatches(pathname: string, href: string) {
  return (
    pathname === href || (href !== '/admin' && pathname.startsWith(`${href}/`))
  );
}
export function moduleForPath(pathname: string) {
  return adminModules.find((module) =>
    [module.href, ...module.pages.map((page) => page.href)].some((href) =>
      routeMatches(pathname, href),
    ),
  );
}
