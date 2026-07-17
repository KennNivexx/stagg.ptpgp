"use client";

interface TooltipRow {
  label: string;
  value: string | number;
  color: string;
}

/** Shared tooltip: values lead (strong), series name follows (secondary),
 * keyed by a short line stroke rather than a filled box — dataviz skill's
 * interaction spec. */
export function ChartTooltipContent({ title, rows }: { title?: string; rows: TooltipRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-lg text-xs"
      style={{ background: "var(--chart-surface)", border: "1px solid var(--chart-gridline)", color: "var(--chart-ink-primary)" }}
    >
      {title && <p className="font-semibold mb-1" style={{ color: "var(--chart-ink-secondary)" }}>{title}</p>}
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block w-3 h-0.5 rounded-full shrink-0" style={{ background: r.color }} />
            <span style={{ color: "var(--chart-ink-secondary)" }}>{r.label}</span>
            <span className="font-bold ml-auto">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
