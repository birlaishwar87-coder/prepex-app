import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/**
 * Wrapper that applies the aurora-bg utility (multi-layer radial gradient
 * fixed to the viewport with a slow drift animation). The root layout
 * already sets `aurora-bg` on <body>, so this is only needed when you want
 * a scoped aurora area inside a non-aurora page.
 */
export function AuroraBackground({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("aurora-bg min-h-screen", className)}>{children}</div>;
}
