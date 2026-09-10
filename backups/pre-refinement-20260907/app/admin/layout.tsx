import { requireAdminUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { AdminNav } from '@/components/admin-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminUser('/admin');
  const firstName = user.fullName?.split(' ')[0] || user.displayName.split('@')[0];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="wordmark" href="/"><span className="brand-signal" />AKSEN<em>OS</em></a>
        <AdminNav signOutPath={chatGPTSignOutPath('/')} />
        <div className="admin-profile">
          <div>{firstName.slice(0, 1).toUpperCase()}</div>
          <span><strong>{user.displayName}</strong><small>Founder · full access</small></span>
          <a href={chatGPTSignOutPath('/')}>Sign out</a>
        </div>
      </aside>
      {children}
    </main>
  );
}
