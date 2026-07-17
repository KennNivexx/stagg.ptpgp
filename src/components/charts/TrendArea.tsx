"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { ChartTooltipContent } from "./ChartTooltip";

const SERIES_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

interface TrendAreaProps {
  data: Record<string, unknown>[];
  xKey: string;
  /** One or more numeric keys to plot — 1 series needs no legend, 2+ always does. */
  series: { key: string; label: string }[];
  height?: number;
  valueFormatter?: (v: number) => string;
}

/** Trend-over-time form (dataviz skill). Single series = 1 hue at ~10%-opacity
 * wash; multi-series = fixed categorical order, legend always present. */
export default function TrendArea({ data, xKey, series, height = 260, valueFormatter }: TrendAreaProps) {
  const fmt = valueFormatter || ((v: number) => String(v));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`trend-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="0" stroke="var(--chart-gridline)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--chart-ink-muted)" }} axisLine={{ stroke: "var(--chart-baseline)" }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--chart-ink-muted)" }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <ChartTooltipContent
                title={String(label)}
                rows={payload.map((p, i) => ({
                  label: series.find((s) => s.key === p.dataKey)?.label || String(p.dataKey),
                  value: fmt(Number(p.value)),
                  color: SERIES_COLORS[i % SERIES_COLORS.length],
                }))}
              />
            );
          }}
        />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: "var(--chart-ink-secondary)" }} iconType="plainline" />}
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            fill={`url(#trend-fill-${s.key})`}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--chart-surface)" }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
