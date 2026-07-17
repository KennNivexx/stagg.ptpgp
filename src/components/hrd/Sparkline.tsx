/** Minimal server-safe sparkline (no chart library, no client boundary) —
 * plain SVG polyline from a numeric series. Used for KPI card mini trends
 * where a real short time-series exists; never fabricated when there's no
 * data (callers should skip rendering it in that case). */
export default function Sparkline({
  values, width = 72, height = 24, positive = true,
}: {
  values: number[]; width?: number; height?: number; positive?: boolean;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * stepX).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(" ");
  const color = positive ? "#1A2530" : "var(--color-pgp-red)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
}
