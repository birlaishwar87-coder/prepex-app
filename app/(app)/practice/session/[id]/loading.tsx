import { Skeleton, SkeletonStyles } from "@/components/ui/skeleton";

export default function PracticeSessionLoading() {
  return (
    <div>
      <SkeletonStyles />
      <div className="mb-4 flex items-center justify-between rounded-input border px-4 py-2.5"
        style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="glass p-5">
        <Skeleton className="mb-3 h-5 w-full max-w-[640px]" />
        <Skeleton className="mb-3 h-5 w-5/6 max-w-[600px]" />
        <Skeleton className="mb-6 h-5 w-2/3 max-w-[440px]" />
        <div className="space-y-2.5">
          {["A", "B", "C", "D"].map((l) => (
            <div
              key={l}
              className="flex items-center gap-3 rounded-input border px-4 py-3"
              style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}
            >
              <Skeleton className="h-6 w-6 rounded-md" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}
