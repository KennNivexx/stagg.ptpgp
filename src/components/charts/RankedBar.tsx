"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine, LabelList } from "recharts";
import { ChartTooltipContent } from "./ChartTooltip";

interface RankedBarDatum {
  label: string;
  value: number;
  /** Optional explicit color (e.g. status palette for semantic buckets like
   * excellent/good/needs-improvement) — overrides the default sequential fill. */
  color?: string;
}

interface RankedBarProps {
  data: RankedBarDatum[];
  height?: number;
  /** Function props can't cross the Server->Client boundary when this chart
   * is rendered from a Server Component page — use this for client-only
   * call sites. Server Component pages should use `valueSuffix` instead. */
  valueFormatter?: (v: number) => string;
  /** Serializable alternative to valueFormatter (e.g. "%", " orang") — safe
   * to pass from a Server Component. */
  valueSuffix?: string;
  /** "sequential" (default): one hue, magnitude by category, horizontal.
   *  "diverging": bars grow from a centered zero baseline (positive/negative split). */
  variant?: "sequential" | "diverging";
  barLabel?: string;
}

/**
 * Magnitude-by-category comparison (dataviz skill's bar/column form,
 * horizontal for long category names) — polished with rounded data-ends and
 * a sequential fill instead of flat CSS-width divs. The diverging variant is
 * for above/below-baseline comparisons (skill's diverging bar job).
 */
export default function RankedBar({ data, height, valueFormatter, valueSuffix, variant = "sequential", barLabel }: RankedBarProps) {
  const fmt = valueFormatter || ((v: number) => `${v}${valueSuffix || ""}`);
  const h = height || Math.max(160, data.length * 44);
  const defaultColor = variant === "diverging" ? undefined : "var(--chart-seq-400)";

  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, left: 4, bottom: 4 }} barCategoryGap={10}>
        <CartesianGrid strokeDasharray="0" stroke="var(--chart-gridline)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "var(--chart-ink-muted)" }} axisLine={{ stroke: "var(--chart-baseline)" }} tickLine={false} />
        <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 11, fill: "var(--chart-ink-secondary)" }} axisLine={false} tickLine={false} />
        {variant === "diverging" && <ReferenceLine x={0} stroke="var(--chart-baseline)" />}
        <Tooltip
          cursor={{ fill: "var(--chart-gridline)", opacity: 0.4 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0];
            const datum = p.payload as RankedBarDatum;
            return (
              <ChartTooltipContent
                rows={[{
                  label: barLabel ? `${datum.label} — ${barLabel}` : datum.label,
                  value: fmt(Number(p.value)),
                  color: datum.color || defaultColor || "var(--chart-1)",
                }]}
              />
            );
          }}
        />
        <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={24}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={d.color || (variant === "diverging" ? (d.value >= 0 ? "var(--chart-div-pos)" : "var(--chart-div-neg)") : defaultColor)}
            />
          ))}
          <LabelList dataKey="value" position="right" formatter={(v: unknown) => fmt(Number(v))} style={{ fill: "var(--chart-ink-secondary)", fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
