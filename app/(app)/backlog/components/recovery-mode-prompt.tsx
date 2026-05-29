"use client";

import { useTransition } from "react";
import { Lightbulb } from "lucide-react";
import { enterBacklogRecoveryAction } from "../actions";

/**
 * PRD §11.5.1 — Activation prompt shown at 25+ backlog items.
 * Student-initiated only — NEVER auto-converted (PRD §11.10).
 */
export function RecoveryModePrompt({ backlogCount }: { backlogCount: number }) {
  const [pending, startTransition] = useTransition();

  function enter() {
    startTransition(async () => {
      await enterBacklogRecoveryAction();
    });
  }

  return (
    <div
      className="rounded-card border p-6"
      style={{
        background: "linear-gradient(135deg, rgba(255, 122, 89, 0.12), rgba(76, 29, 149, 0.08))",
        borderColor: "rgba(255, 122, 89, 0.30)",
      }}
    >
      <div className="mb-3 flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: "rgba(255, 122, 89, 0.15)", color: "var(--coral)" }}
        >
          <Lightbulb size={18} />
        </div>
        <h3 className="t-h4">Want to enter Backlog Recovery Mode?</h3>
      </div>

      <p className="t-body-sm secondary mb-2">
        For the next 7 days, your plans will shift to:
      </p>
      <ul className="mb-4 ml-4 list-disc text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
        <li>50% backlog clearing</li>
        <li>30% revision</li>
        <li>20% new learning</li>
      </ul>

      <p className="t-body-sm tertiary mb-5">
        This way you catch up without falling further behind on revisions. Streak protection
        kicks in automatically — choosing recovery doesn&apos;t cost you anything.
      </p>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={enter}
          disabled={pending}
          className="btn btn-primary"
        >
          {pending ? "Activating…" : `Recover for 7 days (${backlogCount} items)`}
        </button>
        <span className="text-[12px] tertiary">
          You can leave any time — nothing locks.
        </span>
      </div>
    </div>
  );
}
