import Link from 'next/link';
import { requireAdminUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { AdminNav } from '@/components/admin-nav';
import { RouteTransition } from '@/components/route-transition';
import { greetingName, workspaceProfile } from '@/lib/workspace-settings';
import './admin-refresh.css';
import './editor.css';
import './destructive.css';
import './activity.css';
import './settings.css';
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
      <a className="admin-skip" href="#admin-content">
        Skip to admin content
      </a>
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin" prefetch={false}>
          <span>a</span>
          <div>
            aksen <small>WORKSPACE</small>
          </div>
        </Link>
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
