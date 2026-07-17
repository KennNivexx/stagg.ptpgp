"use client";

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { ChartTooltipContent } from "./ChartTooltip";

interface CompetencyRadarProps {
  /** One row per competency/skill axis. */
  data: { skill: string; current: number; required: number }[];
  maxLevel?: number;
  height?: number;
}

const CURRENT_COLOR = "var(--chart-1)";
const REQUIRED_COLOR = "var(--chart-6)";

/**
 * Multi-dimension current-vs-required profile comparison — the "tell distinct
 * series apart across several axes" job. 2 fixed series (current / required),
 * always legend + tooltip per the skill's rules.
 */
export default function CompetencyRadar({ data, maxLevel = 5, height = 340 }: CompetencyRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid stroke="var(--chart-gridline)" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "var(--chart-ink-secondary)" }} />
        <PolarRadiusAxis angle={90} domain={[0, maxLevel]} tick={{ fontSize: 10, fill: "var(--chart-ink-muted)" }} axisLine={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <ChartTooltipContent
                title={String(label)}
                rows={payload.map((p) => ({
                  label: p.name === "current" ? "Current Level" : "Required Level",
                  value: String(p.value),
                  color: p.name === "current" ? CURRENT_COLOR : REQUIRED_COLOR,
                }))}
              />
            );
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--chart-ink-secondary)" }} formatter={(v) => (v === "current" ? "Current Level" : "Required Level")} />
        <Radar name="required" dataKey="required" stroke={REQUIRED_COLOR} fill={REQUIRED_COLOR} fillOpacity={0.1} strokeWidth={2} />
        <Radar name="current" dataKey="current" stroke={CURRENT_COLOR} fill={CURRENT_COLOR} fillOpacity={0.18} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
