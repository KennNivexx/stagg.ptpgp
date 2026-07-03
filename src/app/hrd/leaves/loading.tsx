import { SkeletonHeader, SkeletonStatCard, SkeletonListCard } from "@/components/SkeletonBlocks";

export default function LeavesLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <SkeletonHeader withButton />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <SkeletonListCard items={6} />
    </div>
  );
}
