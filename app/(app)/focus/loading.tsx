import { Skeleton, SkeletonStyles } from "@/components/ui/skeleton";

export default function FocusSetupLoading() {
  return (
    <div className="space-y-5">
      <SkeletonStyles />
      <Skeleton className="mb-3 h-3 w-32" />
      <div>
        <Skeleton className="mb-2 h-9 w-44" />
        <Skeleton className="h-4 w-2/3 max-w-[480px]" />
      </div>
      <div>
        <Skeleton className="mb-3 h-3 w-24" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass p-4">
              <Skeleton className="mb-2 h-9 w-9 rounded-xl" />
              <Skeleton className="mb-1 h-4 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
