"use client";

import { useTransition } from "react";
import { Shield } from "lucide-react";
import { exitBacklogRecoveryAction } from "../actions";

/**
 * PRD §11.5.2 — visible indicator while Recovery Mode is active.
 * Includes the always-available "End Recovery Mode" button (locked trust feature).
 */
export function RecoveryModeBanner({ dayOf7 }: { dayOf7: number }) {
  const [pending, startTransition] = useTransition();

  function leave() {
    startTransition(async () => {
      await exitBacklogRecoveryAction();
    });
  }

  return (
    <div
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border px-4 py-3"
      style={{
        background: "rgba(255, 122, 89, 0.10)",
        borderColor: "rgba(255, 122, 89, 0.40)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: "rgba(255, 122, 89, 0.20)", color: "var(--coral)" }}
        >
          <Shield size={18} />
        </div>
        <div>
          <div className="text-[14px] font-semibold cream-text">
            Recovery Mode · Day {dayOf7} of 7
          </div>
          <div className="text-[12px] tertiary">
            Plans are 50% backlog · 30% revision · 20% new. Streak is protected.
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={leave}
        disabled={pending}
        className="btn btn-ghost btn-sm"
      >
        {pending ? "Ending…" : "End Recovery Mode"}
      </button>
    </div>
  );
}
