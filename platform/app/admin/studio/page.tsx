import { AdminMediaStudio } from '@/components/admin-media-studio';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Media studio | Aksen Workspace' };

export default function AdminStudioPage() {
  return (
    <section className="admin-main studio-main" id="studio">
      <header className="admin-header">
        <div>
          <small>CREATIVE STUDIO</small>
          <h1>Media studio</h1>
          <p>
            Create draft images and videos from a brief and references. Review
            each asset before publishing.
          </p>
        </div>
      </header>
      <div className="studio-layout">
        <AdminMediaStudio />
      </div>
    </section>
  );
}
