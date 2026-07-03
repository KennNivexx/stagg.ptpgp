import { SkeletonStatCard, SkeletonTableCard } from "@/components/SkeletonBlocks";

export default function RecruitmentLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="animate-pulse">
        <div className="h-6 w-48 rounded bg-slate-200 mb-2" />
        <div className="h-3 w-72 rounded bg-slate-100" />
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap animate-pulse">
          <div className="h-10 w-full max-w-sm rounded-xl bg-slate-100" />
          <div className="h-10 w-36 rounded-xl bg-slate-100" />
          <div className="h-10 w-40 rounded-xl bg-slate-100" />
        </div>

        <SkeletonTableCard rows={6} cols={7} />
      </div>
    </div>
  );
}
