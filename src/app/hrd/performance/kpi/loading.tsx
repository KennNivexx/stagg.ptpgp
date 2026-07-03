import { SkeletonHeader, SkeletonStatCard, SkeletonTableCard } from "@/components/SkeletonBlocks";

export default function KpiLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <SkeletonHeader />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <SkeletonTableCard rows={6} cols={5} />
    </div>
  );
}
