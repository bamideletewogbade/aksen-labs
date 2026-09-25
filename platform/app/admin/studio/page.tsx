import { AdminStudioDesk } from '@/components/admin-studio-desk';
import './studio-planner.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Create media | Aksen Workspace' };

export default function AdminStudioPage() {
  return (
    <section className="admin-main studio-main" id="studio">
      <header className="admin-header studio-header">
        <div>
          <small>CREATIVE STUDIO</small>
          <h1>Create media</h1>
          <p>
            Produce marketing visuals, short video clips, and structured multi-scene episodes.
          </p>
        </div>
      </header>
      <div className="studio-layout">
        <AdminStudioDesk />
      </div>
    </section>
  );
}
