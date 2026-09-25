import { BusinessWorkspace } from '@/components/business-workspace';
export const metadata = { title: 'Finances & invoices | Aksen Workspace' };

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const initialTab =
    params?.tab === 'documents' || params?.tab === 'assistant'
      ? params.tab
      : 'finance';
  return (
    <section className="admin-main workspace-main">
      <BusinessWorkspace initialTab={initialTab} />
    </section>
  );
}
