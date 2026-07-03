import { SkeletonHeader, SkeletonStatCard, SkeletonTableCard } from "@/components/SkeletonBlocks";

export default function PayrollLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <SkeletonHeader />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <SkeletonTableCard rows={8} cols={8} />
    </div>
  );
}
