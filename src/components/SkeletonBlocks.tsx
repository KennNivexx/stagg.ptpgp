// Shared building blocks for route-level loading.tsx skeleton screens.
// Pure presentational, static (no "use client" needed), no data fetching.

export function SkeletonStatCard() {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-20 rounded bg-slate-100" />
          <div className="h-4 w-12 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonQuickCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-2.5 w-full rounded bg-slate-100" />
          <div className="h-2.5 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonChartCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
      <div className="mb-4 space-y-2">
        <div className="h-3 w-40 rounded bg-slate-200" />
        <div className="h-2.5 w-56 rounded bg-slate-100" />
      </div>
      <div className="h-32 w-full rounded-lg bg-slate-100" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-slate-50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <div className="h-3 w-full max-w-[120px] rounded bg-slate-100 animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTableCard({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 animate-pulse">
        <div className="h-3 w-32 rounded bg-slate-200 mb-2" />
        <div className="h-2.5 w-48 rounded bg-slate-100" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} cols={cols} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div className="p-4 border-b border-slate-50 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="h-2.5 w-1/2 rounded bg-slate-100" />
        </div>
        <div className="h-6 w-16 rounded-lg bg-slate-100 shrink-0" />
      </div>
    </div>
  );
}

export function SkeletonListCard({ items = 5 }: { items?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}

export function SkeletonHeader({ withButton = false }: { withButton?: boolean }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3 animate-pulse">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded bg-slate-200" />
        <div className="h-3 w-72 rounded bg-slate-100" />
      </div>
      {withButton && <div className="h-10 w-32 rounded-xl bg-slate-200" />}
    </div>
  );
}
