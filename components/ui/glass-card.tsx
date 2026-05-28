import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  tilt?: boolean;
  /** Padding in px — matches the 8px scale. */
  padding?: number;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { tilt = false, padding = 24, className, style, children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn("glass", tilt && "glass-tilt", className)}
      style={{ padding, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
});
