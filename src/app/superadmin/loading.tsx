import { SkeletonStatCard, SkeletonQuickCard } from "@/components/SkeletonBlocks";

export default function SuperadminDashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="animate-pulse">
        <div className="h-6 w-56 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-64 rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonQuickCard key={i} />
        ))}
      </div>
    </div>
  );
}
