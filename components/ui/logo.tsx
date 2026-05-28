import { cn } from "@/lib/utils/cn";

interface LogoProps {
  size?: number;
  className?: string;
}

// Wordmark "prepex." with the mandatory coral dot. Brand guide §04 rules:
// - always lowercase
// - coral dot is non-negotiable
// - never stretch, skew, rotate, or recolor the dot.
export function Logo({ size = 22, className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-sans font-extrabold leading-none tracking-[-0.04em] text-text-primary",
        className
      )}
      style={{ fontSize: size }}
      aria-label="Prepex"
    >
      prepex<span className="text-coral" aria-hidden>.</span>
    </span>
  );
}
