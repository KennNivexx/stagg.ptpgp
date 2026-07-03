import { SkeletonHeader, SkeletonListCard } from "@/components/SkeletonBlocks";

export default function TrainingsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <SkeletonHeader withButton />
      <SkeletonListCard items={6} />
    </div>
  );
}
