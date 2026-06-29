"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { track } from "@/lib/analytics/mixpanel";
import { submitCheckinAction } from "../actions";

const MOODS = [
  { id: "drained", emoji: "😞", label: "Drained" },
  { id: "heavy", emoji: "😐", label: "Heavy" },
  { id: "steady", emoji: "🙂", label: "Steady" },
  { id: "good", emoji: "😊", label: "Good" },
  { id: "strong", emoji: "🔥", label: "Strong" },
] as const;

/**
 * Daily emotional check-in. PRD §3.
 *
 * Rewritten 2026-06-29 to use useTransition (was useFormState). The old
 * pattern waited for parent revalidation to close the modal, which took
 * 1-3s — felt broken. Now we close the modal as soon as the action
 * returns success, then let revalidation refresh the underlying plan.
 *
 * UX rules locked:
 *   • Shown automatically on first load of the day when no checkin row exists.
 *   • Dismissible — "Skip today" never blocks plan access.
 *   • 5 emoji options, single select, submit-or-skip.
 *   • Submit triggers plan generation IF no plan exists yet for today.
 */
export function CheckinModal({
  open,
  onClose,
  showDay2Explainer = false,
}: {
  open: boolean;
  onClose: () => void;
  /** True on day-2 of usage — show the "why we ask" card above (PRD §3.2.3). */
  showDay2Explainer?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [skipPending, startSkipTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens fresh.
  useEffect(() => {
    if (!open) {
      setSelected(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  function submit(skipped: boolean) {
    setError(null);
    const responseValue = skipped ? "" : selected ?? "";
    const transition = skipped ? startSkipTransition : startTransition;
    transition(async () => {
      const fd = new FormData();
      fd.set("response", responseValue);
      fd.set("skipped", skipped ? "true" : "false");
      const result = await submitCheckinAction({ error: null }, fd);
      if (result.error) {
        setError(result.error);
        return;
      }
      track("checkin_submitted", {
        response: skipped ? "skipped" : selected ?? "",
      });
      // Close immediately — server revalidation continues in the background.
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            {showDay2Explainer && (
              <div
                className="mb-4 rounded-input px-3 py-2.5 text-[12.5px] leading-relaxed"
                style={{
                  background: "rgba(76, 29, 149, 0.10)",
                  border: "1px solid rgba(76, 29, 149, 0.30)",
                  color: "var(--text-secondary)",
                }}
              >
                <div className="mb-1 font-semibold cream-text">Why we ask this every morning</div>
                How you feel changes how you should study. Drained day → lighter plan, no pressure.
                Strong day → push harder, you can handle it. We never share this with anyone — it
                just helps us help you.
              </div>
            )}
            <h2 className="t-h3 mb-1.5">How are you feeling today?</h2>
            <p className="t-body-sm secondary">Your plan will adjust to your energy.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border-none flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
            {MOODS.map((m, i) => {
              const active = selected === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m.id)}
                  disabled={pending || skipPending}
                  className="mood-btn flex flex-col items-center justify-center rounded-xl border px-1 py-3 transition-all"
                  style={{
                    background: active ? "rgba(255,122,89,0.15)" : "rgba(255,255,255,0.025)",
                    borderColor: active ? "rgba(255,122,89,0.5)" : "var(--border-default)",
                    transform: active ? "translateY(-2px)" : undefined,
                    boxShadow: active ? "0 0 24px rgba(255,122,89,0.30)" : undefined,
                    transitionDuration: "220ms",
                    transitionTimingFunction: "cubic-bezier(.2,.7,.2,1)",
                    animationDelay: `${i * 40}ms`,
                  }}
                  aria-pressed={active}
                >
                  <span
                    className="text-[26px] sm:text-[28px] leading-none"
                    style={{ transform: active ? "scale(1.1)" : undefined, transition: "transform 220ms" }}
                  >
                    {m.emoji}
                  </span>
                  <span
                    className="mt-1.5 text-[10.5px] sm:text-[11px] font-semibold"
                    style={{ color: active ? "var(--coral-lighter)" : "var(--text-secondary)" }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div
              className="rounded-input px-3 py-2.5 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
                color: "#FCA5A5",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={pending || skipPending}
              className="btn btn-text"
            >
              {skipPending ? "Saving…" : "Skip today"}
            </button>
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={!selected || pending || skipPending}
              className="btn btn-primary"
            >
              {pending ? "Saving…" : "Submit"}
            </button>
          </div>

          <p className="text-center text-[11.5px] tertiary">
            Private. Only used to shape your plan.
          </p>
        </div>

        <style>{`
          .mood-btn:not(:disabled):hover {
            background: rgba(255, 122, 89, 0.10) !important;
            border-color: rgba(255, 122, 89, 0.4) !important;
            transform: translateY(-3px);
            box-shadow: 0 0 24px rgba(255, 122, 89, 0.18);
          }
        `}</style>
      </div>
    </Modal>
  );
}
