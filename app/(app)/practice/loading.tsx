import { Skeleton, SkeletonCard, SkeletonStyles } from "@/components/ui/skeleton";

export default function PracticeLoading() {
  return (
    <div>
      <SkeletonStyles />
      <Skeleton className="mb-2 h-9 w-32" />
      <Skeleton className="mb-7 h-4 w-2/3 max-w-[420px]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonCard height={140} />
        <SkeletonCard height={140} />
        <SkeletonCard height={140} />
        <SkeletonCard height={140} />
      </div>
    </div>
  );
}
