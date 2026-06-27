import { Skeleton, SkeletonCard, SkeletonStyles } from "@/components/ui/skeleton";

export default function ChapterDetailLoading() {
  return (
    <div>
      <SkeletonStyles />
      <Skeleton className="mb-3 h-3 w-32" />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex-1">
          <Skeleton className="mb-2 h-3 w-20" />
          <Skeleton className="mb-1 h-9 w-2/3 max-w-[420px]" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-44" />
      </div>

      {["Notes", "Formula sheets", "Concept maps"].map((s) => (
        <section key={s} className="mb-7">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>
      ))}
    </div>
  );
}
