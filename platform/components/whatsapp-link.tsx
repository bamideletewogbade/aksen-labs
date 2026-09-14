'use client';
import { usePathname } from 'next/navigation';
import { whatsappLink, whatsappDisplay } from '@/lib/contact-channels';

/**
 * Opens a real conversation with the team, as distinct from the WhatsApp
 * demonstrations elsewhere on the site, which use fictional businesses and say
 * so. The wording here has to make that difference obvious, because a visitor
 * who has just tried the Cedar Home demo has no reason to assume this one is
 * answered by a person.
 *
 * A link, not an integration. No API, no webhook, no per-message cost. It
 * exists to find out whether anyone uses the channel before a fortnight goes
 * into Meta verification for one that nobody wants.
 */
export function WhatsAppLink({
  className = '',
  label = 'Message us on WhatsApp',
  showNumber = false,
}: {
  className?: string;
  label?: string;
  showNumber?: boolean;
}) {
  const pathname = usePathname();
  return (
    <a
      className={`whatsapp-link ${className}`.trim()}
      href={whatsappLink(pathname)}
      target="_blank"
      rel="noopener noreferrer"
      // The accessible name says where the link goes and that it leaves the
      // site, which the visible label alone does not.
      aria-label={`${label}. Opens WhatsApp in a new tab.`}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 8.24 8.24c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.19 3.7.58.26 1.04.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
      </svg>
      <span>{label}</span>
      {showNumber && <small>{whatsappDisplay}</small>}
    </a>
  );
}
