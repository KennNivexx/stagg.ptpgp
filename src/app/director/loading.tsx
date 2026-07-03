import { SkeletonStatCard, SkeletonListCard } from "@/components/SkeletonBlocks";

export default function DirectorDashboardLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-pulse">
        <div className="h-6 w-56 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-72 rounded bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonListCard items={4} />
        <SkeletonListCard items={4} />
      </div>
    </div>
  );
}
