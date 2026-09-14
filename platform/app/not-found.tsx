import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
export default function NotFound() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          label="PAGE NOT FOUND"
          title={
            <>
              A different
              <br />
              <em>way forward.</em>
            </>
          }
          text="This page may have moved, or the link may be incorrect."
        />
        <div className="agency-container refresh-mini-cta">
          <Link className="agency-button" href="/">
            Back to Aksen Labs <ArrowUpRight size={18} />
          </Link>
        </div>
      </main>
      <SiteFooter compact />
    </div>
  );
}
