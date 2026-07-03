import { SkeletonTableCard, SkeletonStatCard } from "@/components/SkeletonBlocks";

export default function AttendanceLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="h-3 w-72 rounded bg-slate-100" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-slate-200" />
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-slate-100" />
        <div className="h-10 w-full max-w-xs rounded-xl bg-slate-100" />
        <div className="h-10 w-32 rounded-xl bg-slate-100" />
      </div>

      <SkeletonTableCard rows={8} cols={7} />
    </div>
  );
}
