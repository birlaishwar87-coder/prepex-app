import { Skeleton, SkeletonStyles } from "@/components/ui/skeleton";

export default function MistakesLoading() {
  return (
    <div>
      <SkeletonStyles />
      <Skeleton className="mb-3 h-3 w-32" />
      <div className="mb-6 flex flex-wrap justify-between gap-3">
        <div className="flex-1">
          <Skeleton className="mb-2 h-9 w-56" />
          <Skeleton className="h-4 w-2/3 max-w-[440px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-1 rounded-full" />
            <div className="flex-1">
              <Skeleton className="mb-1 h-3 w-32" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
