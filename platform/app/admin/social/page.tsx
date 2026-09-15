import { Share2 } from 'lucide-react';
import { requireAdminUser } from '@/app/chatgpt-auth';
import { SocialHub } from '@/components/social-hub';
import { socialWorkspace } from '@/lib/social-context';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Social Hub | Aksen Workspace',
  robots: { index: false, follow: false },
};

export default async function SocialHubPage() {
  const user = await requireAdminUser('/admin/social');
  const workspace = await socialWorkspace(user.userId);
  const providers = [
    {
      id: 'linkedin' as const,
      label: 'LinkedIn',
      credentialReady: Boolean(
        process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET,
      ),
      credentialNames: 'LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET',
      developerUrl: 'https://www.linkedin.com/developers/apps',
    },
    {
      id: 'instagram' as const,
      label: 'Instagram',
      credentialReady: Boolean(
        process.env.META_APP_ID && process.env.META_APP_SECRET,
      ),
      credentialNames: 'META_APP_ID + META_APP_SECRET',
      developerUrl: 'https://developers.facebook.com/apps/',
    },
    {
      id: 'tiktok' as const,
      label: 'TikTok',
      credentialReady: Boolean(
        process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET,
      ),
      credentialNames: 'TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET',
      developerUrl: 'https://developers.tiktok.com/apps/',
    },
    {
      id: 'x' as const,
      label: 'X',
      credentialReady: Boolean(
        process.env.X_CLIENT_ID && process.env.X_CLIENT_SECRET,
      ),
      credentialNames: 'X_CLIENT_ID + X_CLIENT_SECRET',
      developerUrl: 'https://developer.x.com/en/portal/dashboard',
    },
  ];

  return (
    <section className="admin-main social-hub" id="social-hub">
      <header className="admin-header">
        <div>
          <small>MARKETING</small>
          <h1>Social Hub</h1>
          <p>
            Keep every channel close, give AI the right Aksen context, and turn
            one useful thought into drafts you approve before anything leaves
            the workspace.
          </p>
        </div>
        <Share2 />
      </header>
      <SocialHub initialWorkspace={workspace} providers={providers} />
    </section>
  );
}
