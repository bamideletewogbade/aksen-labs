import { AdminMediaStudio } from '@/components/admin-media-studio';

export const dynamic = 'force-dynamic';

export default function AdminStudioPage() {
  return (
    <section className="admin-main studio-main" id="studio">
      <header className="admin-header">
        <div><small>CREATIVE STUDIO</small><h1>Generate marketing assets.</h1><p>Describe what you need, add reference images to guide the style, and generate an image or a short video. Everything here is a draft for your team to review before it goes anywhere public.</p></div>
      </header>
      <div className="studio-layout">
        <AdminMediaStudio />
      </div>
    </section>
  );
}
