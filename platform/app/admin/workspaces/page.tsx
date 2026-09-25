import { BusinessWorkspace } from '@/components/business-workspace';
export const metadata = { title: 'Finances & invoices | Aksen Workspace' };

export default function WorkspacesPage() {
  return (
    <section className="admin-main workspace-main">
      <BusinessWorkspace />
    </section>
  );
}
