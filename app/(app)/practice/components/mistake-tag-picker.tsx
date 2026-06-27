"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Eye, HelpCircle, Lightbulb } from "lucide-react";
import { tagMistakeAction, type MistakeTag } from "../actions";

/**
 * PRD §5.5.3 — 4 mistake tag buttons.
 *
 *   silly_mistake → quick miscalc / wrong copy
 *   concept_gap   → didn't know the concept
 *   time_pressure → ran out / rushed
 *   guessed       → no real working
 *
 * Used in two surfaces: instant feedback during a session (after wrong) AND
 * post-session results for any un-tagged wrongs. `onTagged` lets the parent
 * lift the new tag into local state without a refetch.
 */

const OPTIONS: Array<{ tag: MistakeTag; label: string; Icon: typeof Eye; color: string }> = [
  { tag: "silly_error", label: "Silly", Icon: Eye, color: "#A5B4FC" },
  { tag: "conceptual_gap", label: "Concept", Icon: Lightbulb, color: "#FBBF24" },
  { tag: "time_pressure", label: "Time", Icon: Clock, color: "#FF9E7D" },
  { tag: "wild_guess", label: "Guessed", Icon: HelpCircle, color: "#C4B5FD" },
];

export function MistakeTagPicker({
  attemptId,
  initialTag = null,
  onTagged,
  disabled = false,
}: {
  /** null for demo sessions (skip DB write). */
  attemptId: string | null;
  initialTag?: MistakeTag | null;
  onTagged?: (tag: MistakeTag) => void;
  disabled?: boolean;
}) {
  const [picked, setPicked] = useState<MistakeTag | null>(initialTag);
  const [pending, startTransition] = useTransition();

  function choose(tag: MistakeTag) {
    if (disabled || pending) return;
    setPicked(tag);
    onTagged?.(tag);
    if (!attemptId) return; // demo session — no persistence
    startTransition(async () => {
      const { error } = await tagMistakeAction({ attemptId, tag });
      if (error) {
        // Soft fail — leave the optimistic pick visible. Tagging again will retry.
        console.warn("[mistake tag] save failed:", error);
      }
    });
  }

  return (
    <div className="mt-3">
      <div className="t-label tertiary mb-2">Tag this mistake</div>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => {
          const active = picked === o.tag;
          return (
            <button
              key={o.tag}
              type="button"
              onClick={() => choose(o.tag)}
              disabled={disabled || pending}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors"
              style={{
                background: active ? `${o.color}1F` : "rgba(255,255,255,0.04)",
                borderColor: active ? `${o.color}66` : "var(--border-default)",
                color: active ? o.color : "var(--text-secondary)",
                cursor: disabled || pending ? "default" : "pointer",
              }}
              aria-pressed={active}
            >
              <o.Icon size={12} />
              {o.label}
              {active && <Check size={11} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
