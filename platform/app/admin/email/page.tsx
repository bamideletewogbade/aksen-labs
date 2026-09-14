import { EmailDesk } from '@/components/email-desk';
export const metadata = { title: 'Email outbox | Aksen Workspace' };
export default function Page() {
  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>CLIENT COMMUNICATION</small>
          <h1>Email outbox</h1>
          <p>
            Draft, review and send individual service emails through Resend.
          </p>
        </div>
      </header>
      <EmailDesk />
    </section>
  );
}
