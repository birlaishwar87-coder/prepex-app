"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  /** Set false to disable click-outside-to-close (e.g. destructive confirmations). */
  dismissOnBackdrop?: boolean;
  labelledBy?: string;
}

export function Modal({
  open,
  onClose,
  children,
  width = 520,
  dismissOnBackdrop = true,
  labelledBy,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      // items-start + padding on mobile keeps the modal above the soft
      // keyboard (visualViewport shrinks but layout viewport doesn't).
      // sm:items-center restores desktop behavior.
      // 100dvh tracks the dynamic viewport so the modal never overflows.
      className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center px-3 py-4 sm:p-4 animate-modal-in overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={dismissOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "my-auto max-h-[calc(100dvh-32px)] overflow-auto rounded-modal animate-modal-content-in",
          "border border-border-hover"
        )}
        style={{
          width: `min(${width}px, 100%)`,
          background: "rgba(20, 8, 40, 0.92)",
          backdropFilter: "blur(40px) saturate(140%)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 80px rgba(76, 29, 149, 0.2)",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
