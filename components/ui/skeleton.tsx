// Skeleton primitives shared across loading.tsx files. Pure CSS shimmer
// (no client JS) so they ship as static markup inside Next.js route
// loading boundaries.

import { cn } from "@/lib/utils/cn";

export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeletonShimmer 1.6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonCard({
  className,
  height = 92,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn("glass", className)}
      style={{ padding: 16, minHeight: height }}
    >
      <Skeleton className="mb-2 h-3 w-24" />
      <Skeleton className="mb-3 h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonStyles() {
  // Injected once via root loading.tsx so the keyframes exist even if no
  // route-level loading.tsx is currently mounted. Cheap to repeat.
  return (
    <style>{`
      @keyframes skeletonShimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}
