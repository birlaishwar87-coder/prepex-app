"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { RefreshCw, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useTrackOnSuccess } from "@/lib/analytics/use-track-on-success";
import { regeneratePlanAction, type RegenerateState } from "../actions";

const regenerateInitial: RegenerateState = { error: null };

const REASONS = [
  "Plan feels too heavy",
  "Plan feels too light",
  "Wrong subjects today",
  "Time slots don't work",
  "Just want a fresh take",
] as const;

export function RegenerateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [state, formAction] = useFormState(regeneratePlanAction, regenerateInitial);
  const [reason, setReason] = useState<string | null>(null);

  useTrackOnSuccess(state, "plan_regenerated", { from: "today_modal", reason });

  return (
    <Modal open={open} onClose={onClose} width={440}>
      <div className="p-7">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="t-h3">Regenerate today&apos;s plan?</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>
        <p className="t-body-sm secondary mb-5">Why? (optional, helps us improve)</p>

        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="reason" value={reason ?? ""} />

          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className="flex items-center gap-3 rounded-input border px-3.5 py-3 text-left text-sm transition-all"
              style={{
                background: reason === r ? "rgba(255, 122, 89, 0.10)" : "rgba(255,255,255,0.025)",
                borderColor: reason === r ? "rgba(255, 122, 89, 0.5)" : "var(--border-default)",
                transitionDuration: "180ms",
              }}
            >
              <div
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-[1.5px]"
                style={{
                  borderColor: reason === r ? "var(--coral)" : "var(--border-hover)",
                }}
              >
                {reason === r && (
                  <div className="h-2 w-2 rounded-full" style={{ background: "var(--coral)" }} />
                )}
              </div>
              {r}
            </button>
          ))}

          {state.error && (
            <div
              className="mt-2 rounded-input px-3 py-2.5 text-sm"
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

          <div className="mt-5 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </Modal>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      <RefreshCw size={15} className={pending ? "animate-spin-slow" : ""} />
      {pending ? "Regenerating…" : "Regenerate"}
    </button>
  );
}
