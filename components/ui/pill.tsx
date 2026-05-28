import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PillVariant = "default" | "coral" | "purple" | "success" | "warning";

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  leftIcon?: ReactNode;
}

const variantClass: Record<PillVariant, string> = {
  default: "",
  coral: "pill-coral",
  purple: "pill-purple",
  success: "pill-success",
  warning: "pill-warning",
};

export function Pill({
  variant = "default",
  leftIcon,
  className,
  children,
  ...rest
}: PillProps) {
  return (
    <span className={cn("pill", variantClass[variant], className)} {...rest}>
      {leftIcon}
      {children}
    </span>
  );
}
