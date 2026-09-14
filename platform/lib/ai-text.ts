/** Plain-text presentation for business prose. Preserve paragraphs, references and meaningful symbols. */
export function cleanAiText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/^[ \t]*```[^\n]*\n?/gm, '')
    .replace(/^[ \t]*~~~[^\n]*\n?/gm, '')
    .replace(/^ {0,3}#{1,6}\s+(.+?)(?:\s+#+)?$/gm, '$1')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/\*\*\*([^\n]+?)\*\*\*/g, '$1')
    .replace(/\*\*([^\n]+?)\*\*/g, '$1')
    .replace(/(^|\s)__([^\n]+?)__(?=$|[\s.,:;!?])/g, '$1$2')
    .replace(/(^|\s)\*([^*\n]+)\*(?=$|[\s.,:;!?])/g, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^[ \t]*[-*+][ \t]+\[([ xX])\]\s+/gm, (_, checked: string) =>
      checked.trim() ? '☑ ' : '☐ ',
    )
    .replace(/^[ \t]*[-*+][ \t]+/gm, '• ')
    .replace(/^[ \t]*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
export function cleanAiValue(value: unknown): unknown {
  if (typeof value === 'string') return cleanAiText(value);
  if (Array.isArray(value)) return value.map(cleanAiValue);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cleanAiValue(item)]),
    );
  return value;
}
