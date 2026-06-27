import { Skeleton, SkeletonStyles } from "@/components/ui/skeleton";

export default function FocusSessionLoading() {
  return (
    <div>
      <SkeletonStyles />
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="flex flex-col items-center gap-8 py-6">
        <Skeleton className="h-[280px] w-[280px] rounded-full" />
        <div className="w-full max-w-[540px]">
          <Skeleton className="mb-3 h-3 w-24" />
          <div className="glass p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
