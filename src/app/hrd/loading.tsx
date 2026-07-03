import {
  SkeletonQuickCard,
  SkeletonStatCard,
  SkeletonChartCard,
} from "@/components/SkeletonBlocks";

export default function HRDDashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-6 w-64 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-48 rounded bg-slate-100" />
      </div>

      {/* Quick Access */}
      <div>
        <div className="h-4 w-28 rounded bg-slate-200 mb-2 animate-pulse" />
        <div className="h-3 w-52 rounded bg-slate-100 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonQuickCard key={i} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="h-4 w-36 rounded bg-slate-200 mb-4 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <div className="h-4 w-40 rounded bg-slate-200 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonChartCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
