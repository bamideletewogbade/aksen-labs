import { EmailDesk } from '@/components/email-desk';
export const metadata = { title: 'Email | Aksen Workspace' };
export default function Page() {
  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>CLIENT COMMUNICATION</small>
          <h1>Email</h1>
          <p>
            Write to one person or a group from a template, read every copy,
            then send through Resend. Nothing leaves until you confirm it.
          </p>
        </div>
      </header>
      <EmailDesk />
    </section>
  );
}
