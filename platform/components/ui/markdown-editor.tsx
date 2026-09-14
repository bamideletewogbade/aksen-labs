'use client';
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Code,
  Quote,
  Eye,
  PenLine,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ---------------- rendering ----------------
 *
 * The preview is built as React elements, never as an HTML string handed to
 * dangerouslySetInnerHTML. Markdown here is written by an administrator, but
 * "the author is trusted" is a property of today's access rules rather than of
 * this component, and a preview that cannot inject script does not need that
 * assumption to hold. Link targets are still checked, because a javascript:
 * URL is a click away from running with the admin session.
 */

function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (/^(https?:|mailto:)/i.test(value)) return value;
  // A bare path or anchor stays internal, which cannot carry a scheme.
  if (/^[/#]/.test(value) && !value.startsWith('//')) return value;
  return null;
}

/** Bold, italic, inline code and links, in one left-to-right pass. */
function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern =
    /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${n++}`;
    if (match[2] !== undefined) out.push(<strong key={key}>{match[2]}</strong>);
    else if (match[4] !== undefined) out.push(<em key={key}>{match[4]}</em>);
    else if (match[5] !== undefined)
      out.push(<code key={key}>{match[5]}</code>);
    else if (match[6] !== undefined) {
      const href = safeHref(match[7] || '');
      out.push(
        href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer">
            {match[6]}
          </a>
        ) : (
          // Refused rather than dropped, so the author sees why it is inert.
          <span key={key} title="Link removed: unsupported address">
            {match[6]}
          </span>
        ),
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function render(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let k = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(<p key={`p${k++}`}>{inline(paragraph.join(' '), `p${k}`)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, i) => (
      <li key={i}>{inline(item, `li${k}-${i}`)}</li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={`l${k++}`}>{items}</ol>
      ) : (
        <ul key={`l${k++}`}>{items}</ul>
      ),
    );
    list = null;
  };
  const flushQuote = () => {
    if (!quote.length) return;
    blocks.push(
      <blockquote key={`q${k++}`}>
        {inline(quote.join(' '), `q${k}`)}
      </blockquote>,
    );
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of lines) {
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const quoted = /^>\s?(.*)$/.exec(line);

    if (!line.trim()) {
      flushAll();
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll();
      blocks.push(<hr key={`h${k++}`} />);
      continue;
    }
    if (heading) {
      flushAll();
      const level = Math.min(heading[1].length + 1, 6);
      const Tag = `h${level}` as 'h2';
      blocks.push(<Tag key={`t${k++}`}>{inline(heading[2], `t${k}`)}</Tag>);
      continue;
    }
    if (quoted) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]);
      continue;
    }
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const ordered = !!numbered;
      const item = (bullet ? bullet[1] : numbered![1]) || '';
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(item);
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }
  flushAll();
  return blocks;
}

/* ---------------- editing ---------------- */

type Tool = {
  icon: typeof Bold;
  label: string;
  before: string;
  after: string;
  /** Applied at the start of each selected line rather than around the whole selection. */
  linePrefix?: string;
  shortcut?: string;
};

const tools: Tool[] = [
  { icon: Bold, label: 'Bold', before: '**', after: '**', shortcut: 'b' },
  { icon: Italic, label: 'Italic', before: '_', after: '_', shortcut: 'i' },
  {
    icon: Heading2,
    label: 'Heading',
    before: '',
    after: '',
    linePrefix: '## ',
  },
  { icon: List, label: 'Bullet list', before: '', after: '', linePrefix: '- ' },
  {
    icon: ListOrdered,
    label: 'Numbered list',
    before: '',
    after: '',
    linePrefix: '1. ',
  },
  { icon: Quote, label: 'Quote', before: '', after: '', linePrefix: '> ' },
  { icon: Code, label: 'Code', before: '`', after: '`' },
  {
    icon: Link2,
    label: 'Link',
    before: '[',
    after: '](https://)',
    shortcut: 'k',
  },
];

export function MarkdownEditor({
  value,
  onChange,
  id,
  name,
  maxLength = 20000,
  minHeight = 260,
  disabled,
  placeholder,
  describedBy,
  required,
}: {
  value: string;
  onChange: (next: string) => void;
  id: string;
  name?: string;
  maxLength?: number;
  minHeight?: number;
  disabled?: boolean;
  placeholder?: string;
  describedBy?: string;
  required?: boolean;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  // Grows with the writing instead of scrolling a small window, bounded so a
  // long article cannot push the save button off the screen.
  useEffect(() => {
    const el = box.current;
    if (!el || preview) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(minHeight, Math.min(el.scrollHeight + 2, 720))}px`;
  }, [value, preview, minHeight]);

  // Not wrapped in useCallback: the React compiler memoises this, and a
  // hand-written dependency list here was both redundant and wrong.
  const apply = (tool: Tool) => {
    const el = box.current;
    if (!el) return;
    const from = el.selectionStart;
    const to = el.selectionEnd;
    const selected = value.slice(from, to);
    let next: string;
    let caret: number;

    if (tool.linePrefix) {
      // Whole lines, so a heading or bullet lands at the start of each rather
      // than in the middle of the words the cursor happened to be inside.
      const start = value.lastIndexOf('\n', from - 1) + 1;
      const endBreak = value.indexOf('\n', to);
      const end = endBreak === -1 ? value.length : endBreak;
      const block = value.slice(start, end);
      const already = block
        .split('\n')
        .every((l) => l.startsWith(tool.linePrefix!));
      const changed = block
        .split('\n')
        .map((l) =>
          already ? l.slice(tool.linePrefix!.length) : tool.linePrefix + l,
        )
        .join('\n');
      next = value.slice(0, start) + changed + value.slice(end);
      caret = start + changed.length;
    } else {
      next =
        value.slice(0, from) +
        tool.before +
        selected +
        tool.after +
        value.slice(to);
      // With nothing selected the caret lands between the markers, ready to
      // type; with a selection it lands after it.
      caret = selected
        ? to + tool.before.length + tool.after.length
        : from + tool.before.length;
    }

    if (next.length > maxLength) return;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = caret;
    });
  };

  const near = value.length > maxLength * 0.9;

  return (
    <div className="md-editor" data-preview={preview || undefined}>
      <div className="md-toolbar" role="toolbar" aria-label="Formatting">
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={
              tool.shortcut
                ? `${tool.label} (Ctrl+${tool.shortcut.toUpperCase()})`
                : tool.label
            }
            aria-label={tool.label}
            disabled={disabled || preview}
            onClick={() => apply(tool)}
          >
            <tool.icon size={15} aria-hidden="true" />
          </button>
        ))}
        <span className="md-toolbar-spacer" />
        <span className={near ? 'md-count is-near' : 'md-count'}>
          {value.length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
        <button
          type="button"
          className="md-preview-toggle"
          aria-pressed={preview}
          disabled={disabled}
          onClick={() => setPreview((p) => !p)}
        >
          {preview ? <PenLine size={15} /> : <Eye size={15} />}
          {preview ? 'Write' : 'Preview'}
        </button>
      </div>

      {preview ? (
        <div className="md-preview arrive" aria-live="polite">
          {value.trim() ? (
            render(value)
          ) : (
            <p className="md-preview-empty">Nothing written yet.</p>
          )}
        </div>
      ) : (
        <textarea
          id={id}
          name={name}
          ref={box}
          className="md-input"
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-describedby={describedBy}
          spellCheck
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
              const tool = tools.find(
                (t) => t.shortcut && t.shortcut === e.key.toLowerCase(),
              );
              if (tool) {
                e.preventDefault();
                apply(tool);
                return;
              }
            }
            // Prose is written as an outline, so Tab indents. Shift+Tab still
            // moves focus, which keeps a keyboard route out of the field.
            if (e.key === 'Tab' && !e.shiftKey) {
              e.preventDefault();
              const el = e.currentTarget;
              const from = el.selectionStart;
              const next =
                value.slice(0, from) + '  ' + value.slice(el.selectionEnd);
              if (next.length > maxLength) return;
              onChange(next);
              requestAnimationFrame(() => {
                el.selectionStart = el.selectionEnd = from + 2;
              });
            }
          }}
        />
      )}
      {/* Hidden twin so an uncontrolled <form> submission still carries the
          value while the preview is open and the textarea is unmounted. */}
      {preview && name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}

export { render as renderMarkdown };
