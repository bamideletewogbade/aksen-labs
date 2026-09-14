'use client';
import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { Spinner } from '@/components/ui/activity';
import { filterIsActive, type LeadFilter } from '@/lib/lead-filters';

/**
 * Downloading what the filter is currently showing.
 *
 * The count is in the button rather than in a confirmation step, because the
 * mistake this prevents is exporting five leads when you meant five hundred,
 * and that is a question of what is on screen rather than of intent. The filter
 * goes up as query parameters and the server re-applies it, so the file and the
 * screen cannot disagree.
 */

const FORMATS = [
  { id: 'csv', label: 'CSV', note: 'For any spreadsheet or CRM' },
  { id: 'xlsx', label: 'Excel', note: 'Filterable, with a frozen header' },
  { id: 'pdf', label: 'PDF', note: 'One page-block per lead, to send on' },
] as const;

export function LeadExportMenu({
  filter,
  shown,
}: {
  filter: LeadFilter;
  shown: number;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  async function download(format: string) {
    setBusy(format);
    setError('');
    try {
      const query = new URLSearchParams({
        format,
        status: filter.status,
        contact: filter.contact,
        minSources: String(filter.minSources),
        withinDays: String(filter.withinDays),
        runId: filter.runId,
        text: filter.text,
      });
      const response = await fetch(
        `/api/admin/prospects/export?${query.toString()}`,
        { signal: AbortSignal.timeout(60000) },
      );
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error || 'The export could not be built.');
      }
      // Read the whole body before creating the link. A blob URL handed to the
      // browser mid-stream downloads a truncated file with no error anywhere.
      const blob = await response.blob();
      const name =
        /filename="([^"]+)"/
          .exec(response.headers.get('content-disposition') || '')
          ?.at(1) || `aksen-leads.${format}`;
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoked on the next tick rather than immediately: Safari cancels a
      // download whose object URL is released in the same frame as the click.
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      setOpen(false);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The export could not be built.',
      );
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="lead-export" ref={box}>
      <button
        type="button"
        className="lead-export-toggle"
        aria-expanded={open}
        disabled={shown === 0}
        onClick={() => setOpen(!open)}
      >
        <Download size={15} aria-hidden="true" />
        Export {shown}
        {filterIsActive(filter) ? ' filtered' : ''}
      </button>
      {open && (
        <div className="lead-export-menu" role="menu">
          <p className="lead-export-head">
            {shown} {shown === 1 ? 'lead' : 'leads'}, as shown
          </p>
          {FORMATS.map((format) => (
            <button
              key={format.id}
              type="button"
              role="menuitem"
              disabled={!!busy}
              onClick={() => void download(format.id)}
            >
              <span>
                {format.label}
                {busy === format.id && <Spinner />}
              </span>
              <small>{format.note}</small>
            </button>
          ))}
        </div>
      )}
      {error && (
        <p className="lead-export-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
