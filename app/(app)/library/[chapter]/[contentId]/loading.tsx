import { Skeleton, SkeletonStyles } from "@/components/ui/skeleton";

export default function ContentViewerLoading() {
  return (
    <div className="flex h-screen flex-col">
      <SkeletonStyles />
      <Skeleton className="mb-3 h-3 w-32" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="h-6 w-2/3 max-w-[480px]" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="mb-3 h-12 w-full" />
      <div className="glass flex-1" style={{ minHeight: 500 }}>
        <div className="flex h-full items-center justify-center">
          <span className="t-body-sm tertiary">Loading viewer…</span>
        </div>
      </div>
    </div>
  );
}
