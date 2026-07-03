"use client";

// Lightweight renderer for guide content: supports **bold**, "- " bullet
// lines, and blank-line-separated paragraphs. Intentionally not a full
// markdown parser — just enough for simple staff-written guides.

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function GuideContent({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);

  return (
    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every(l => l.startsWith("- "));
        if (isList) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {lines.map((l, j) => <li key={j}>{renderInline(l.slice(2))}</li>)}
            </ul>
          );
        }
        return <p key={i}>{lines.map((l, j) => <span key={j}>{renderInline(l)}{j < lines.length - 1 && <br />}</span>)}</p>;
      })}
    </div>
  );
}
