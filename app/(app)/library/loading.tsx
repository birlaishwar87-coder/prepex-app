import { Skeleton, SkeletonCard, SkeletonStyles } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <div>
      <SkeletonStyles />
      <Skeleton className="mb-3 h-9 w-32" />
      <Skeleton className="mb-7 h-4 w-2/3 max-w-[420px]" />

      <Skeleton className="mb-7 h-11 w-full max-w-[520px]" />

      {(["Physics", "Chemistry", "Maths"] as const).map((s) => (
        <section key={s} className="mb-7">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>
      ))}
    </div>
  );
}
