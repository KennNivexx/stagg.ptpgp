import { SkeletonTableCard } from "@/components/SkeletonBlocks";

export default function EmployeesLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-56 rounded bg-slate-200" />
          <div className="h-3 w-80 rounded bg-slate-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 rounded-xl bg-slate-100" />
          <div className="h-10 w-40 rounded-xl bg-slate-200" />
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap mb-6 animate-pulse">
        <div className="h-10 w-full max-w-xs rounded-xl bg-slate-100" />
        <div className="h-10 w-36 rounded-xl bg-slate-100" />
        <div className="h-10 w-36 rounded-xl bg-slate-100" />
      </div>

      <SkeletonTableCard rows={8} cols={6} />
    </div>
  );
}
