import { Skeleton, SkeletonCard, SkeletonStyles } from "@/components/ui/skeleton";

// Catch-all loading fallback for every app route. Individual routes can
// override with their own loading.tsx for a tighter skeleton match.
export default function AppLoading() {
  return (
    <div className="space-y-6">
      <SkeletonStyles />
      <div>
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="mb-2 h-9 w-2/3 max-w-[420px]" />
        <Skeleton className="h-4 w-1/2 max-w-[320px]" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
