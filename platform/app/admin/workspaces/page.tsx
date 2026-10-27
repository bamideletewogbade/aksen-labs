import { BusinessWorkspace } from '@/components/business-workspace';
export const metadata = { title: 'Client records & money | Aksen Workspace' };

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    tab?: string;
    businessId?: string;
    financialId?: string;
  }>;
}) {
  const params = await searchParams;
  const initialTab =
    params?.tab === 'documents' || params?.tab === 'assistant'
      ? params.tab
      : 'finance';
  return (
    <section className="admin-main workspace-main">
      <BusinessWorkspace
        key={`${params?.businessId ?? ''}:${params?.financialId ?? ''}`}
        initialTab={initialTab}
        initialBusinessId={params?.businessId}
        initialFinancialId={params?.financialId}
      />
    </section>
  );
}
