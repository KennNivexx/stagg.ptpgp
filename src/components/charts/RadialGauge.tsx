"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface RadialGaugeProps {
  /** 0-100 */
  value: number;
  label: string;
  sublabel?: string;
  size?: number;
  /** Explicit severity override — defaults to computed from value (>=75 good, >=50 warning, else critical). */
  severity?: "good" | "warning" | "critical";
  formatValue?: (v: number) => string;
}

const SEVERITY_COLOR: Record<string, string> = {
  good: "var(--chart-status-good)",
  warning: "var(--chart-status-warning)",
  critical: "var(--chart-status-critical)",
};

function computeSeverity(value: number): "good" | "warning" | "critical" {
  if (value >= 75) return "good";
  if (value >= 50) return "warning";
  return "critical";
}

/**
 * Meter form (dataviz skill): a single ratio against a limit. Fill carries
 * severity; the unfilled track is a lighter step of the accent ramp so state
 * reads across the whole ring even before the number is read.
 */
export default function RadialGauge({ value, label, sublabel, size = 160, severity, formatValue }: RadialGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const sev = severity || computeSeverity(clamped);
  const fillColor = SEVERITY_COLOR[sev];
  const data = [{ value: clamped, fill: fillColor }];
  const displayValue = formatValue ? formatValue(clamped) : `${Math.round(clamped)}%`;

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            barSize={10}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              dataKey="value"
              cornerRadius={5}
              background={{ fill: "var(--chart-seq-100)" }}
              isAnimationActive
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold" style={{ color: "var(--chart-ink-primary)" }}>{displayValue}</span>
          {sublabel && <span className="text-[10px]" style={{ color: "var(--chart-ink-muted)" }}>{sublabel}</span>}
        </div>
      </div>
      <p className="text-xs font-semibold text-center mt-1.5" style={{ color: "var(--chart-ink-secondary)" }}>{label}</p>
    </div>
  );
}
