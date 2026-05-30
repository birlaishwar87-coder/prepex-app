"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useTrackOnSuccess } from "@/lib/analytics/use-track-on-success";
import { submitCheckinAction, type CheckinState } from "../actions";

const initial: CheckinState = { error: null };

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
  const [state, formAction] = useFormState(submitCheckinAction, initial);

  useTrackOnSuccess(state, "checkin_submitted", { response: selected ?? "skipped" });

  // Close on successful submit
  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  // When the action returns with no error, the page will revalidate and the
  // parent will close the modal. Nothing to do here.

  return (
    <Modal open={open} onClose={onClose} width={520}>
      <div className="p-7">
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "var(--text-secondary)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form action={formAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="response" value={selected ?? ""} />
          <input type="hidden" name="skipped" value="false" />

          <div className="grid grid-cols-5 gap-2.5">
            {MOODS.map((m, i) => {
              const active = selected === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m.id)}
                  className="mood-btn flex flex-col items-center justify-center rounded-xl border px-1.5 py-3 transition-all"
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
                    className="text-[28px] leading-none"
                    style={{ transform: active ? "scale(1.1)" : undefined, transition: "transform 220ms" }}
                  >
                    {m.emoji}
                  </span>
                  <span
                    className="mt-1.5 text-[11px] font-semibold"
                    style={{ color: active ? "var(--coral-lighter)" : "var(--text-secondary)" }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {state.error && (
            <div
              className="rounded-input px-3 py-2.5 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
                color: "#FCA5A5",
              }}
              role="alert"
            >
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <SkipButton onClose={onClose} />
            <SubmitButton hasSelection={!!selected} />
          </div>

          <p className="text-center text-[11.5px] tertiary">
            Private. Only used to shape your plan.
          </p>
        </form>

        <style>{`
          .mood-btn:hover {
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

function SubmitButton({ hasSelection }: { hasSelection: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={!hasSelection || pending}
      className="btn btn-primary"
    >
      {pending ? "Saving…" : "Submit"}
    </button>
  );
}

function SkipButton({ onClose }: { onClose: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="skipped"
      value="true"
      disabled={pending}
      onClick={(e) => {
        // The native button has value=true; but the hidden input above has
        // skipped=false. We need to override on this submission.
        const form = (e.currentTarget as HTMLButtonElement).form;
        if (form) {
          const skippedInput = form.querySelector<HTMLInputElement>('input[name="skipped"]');
          if (skippedInput) skippedInput.value = "true";
        }
        // Don't close — let the form action complete + revalidate + parent close.
        void onClose;
      }}
      className="btn btn-text"
    >
      Skip today
    </button>
  );
}
