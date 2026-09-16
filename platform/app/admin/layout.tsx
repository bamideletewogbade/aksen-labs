import Link from 'next/link';
import { requireAdminUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { AdminNav } from '@/components/admin-nav';
import { AdminRailToggle } from '@/components/admin-rail-toggle';
import { RouteTransition } from '@/components/route-transition';
import { greetingName, workspaceProfile } from '@/lib/workspace-settings';
import './admin-refresh.css';
import './editor.css';
import './destructive.css';
import './activity.css';
import './settings.css';
import './social.css';
import './knowledge.css';
// Last, so it can correct what the palette conversion could not reach. The
// stylesheets above are rewritten wholesale by scripts/relight-admin when the
// palette changes; this one is written by hand and survives that.
import './admin-light.css';
export const metadata = {
  title: 'Aksen Workspace',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdminUser('/admin');
  const profile = await workspaceProfile(user.userId);
  const shownName = greetingName(profile, user.fullName, user.displayName);
  const firstName = shownName;
  return (
    <div className="admin-shell admin-refresh">
      {/* Before the first paint, not after hydration. The rail's width decides
          the page's whole layout, so reading the preference in an effect would
          draw the sidebar open and then snap it shut on every navigation. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{document.documentElement.dataset.rail=localStorage.getItem('aksen-rail')||'expanded'}catch(e){document.documentElement.dataset.rail='expanded'}`,
        }}
      />
      <a className="admin-skip" href="#admin-content">
        Skip to admin content
      </a>
      <aside className="admin-sidebar">
        <div className="admin-rail-head">
          <Link className="admin-brand" href="/admin" prefetch={false}>
            <span>a</span>
            <div>
              aksen <small>WORKSPACE</small>
            </div>
          </Link>
          <AdminRailToggle />
        </div>
        <AdminNav signOutPath={chatGPTSignOutPath('/')} />
        <div className="admin-profile">
          <div>{firstName.slice(0, 1).toUpperCase()}</div>
          <span>
            {/* The name, then the account it belongs to. The name used to be a
                literal in the session and the email was shown as if it were a
                name. */}
            <strong>{shownName}</strong>
            <Link href="/admin/settings">Edit profile</Link>
          </span>
          <a href={chatGPTSignOutPath('/')}>Sign out</a>
        </div>
      </aside>
      <main id="admin-content" className="admin-content">
        <RouteTransition>{children}</RouteTransition>
      </main>
    </div>
  );
}
