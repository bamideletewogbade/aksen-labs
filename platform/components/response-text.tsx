import { cleanAiText } from '@/lib/ai-text';
export function ResponseText({ text }: { text: string }) {
  const blocks = cleanAiText(text).split(/\n\n+/).filter(Boolean);
  return (
    <div className="response-text">
      {blocks.map((block, index) => {
        const lines = block.split('\n');
        if (lines.every((line) => /^•\s/.test(line)))
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>{line.replace(/^•\s/, '')}</li>
              ))}
            </ul>
          );
        if (lines.every((line) => /^\d+[.)]\s/.test(line)))
          return (
            <ol key={index} start={parseInt(lines[0], 10)}>
              {lines.map((line, i) => (
                <li key={i}>{line.replace(/^\d+[.)]\s/, '')}</li>
              ))}
            </ol>
          );
        return <p key={index}>{block}</p>;
      })}
    </div>
  );
}
