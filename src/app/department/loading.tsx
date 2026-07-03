import { SkeletonHeader, SkeletonStatCard, SkeletonListCard, SkeletonTableCard } from "@/components/SkeletonBlocks";

export default function DepartmentLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <SkeletonHeader withButton />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <SkeletonListCard items={3} />

      <SkeletonTableCard rows={6} cols={5} />
    </div>
  );
}
