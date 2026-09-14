import Link from 'next/link';
import { requireAdminUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { AdminNav } from '@/components/admin-nav';
import { RouteTransition } from '@/components/route-transition';
import './admin-refresh.css';
import './editor.css';
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
  const firstName =
    user.fullName?.split(' ')[0] || user.displayName.split('@')[0];
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
            <strong>{user.displayName}</strong>
            <small>Administrator</small>
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
