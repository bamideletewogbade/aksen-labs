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
          title={<>That page is not here.</>}
          text="It may have moved, or the link may be wrong. The main pages are in the menu above, and the free tools are a good place to land instead."
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
