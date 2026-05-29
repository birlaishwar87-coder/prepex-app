"use client";

import { useFormState, useFormStatus } from "react-dom";
import { RefreshCw, Sparkles } from "lucide-react";
import { generateTodayPlanAction, type GenerateState } from "./actions";

const initial: GenerateState = { error: null };

export function GenerateButton({
  regenerate = false,
  label,
}: {
  regenerate?: boolean;
  label: string;
}) {
  const [state, formAction] = useFormState(generateTodayPlanAction, initial);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction} className="inline-flex">
        <input type="hidden" name="regenerate" value={regenerate ? "true" : "false"} />
        <SubmitButton label={label} regenerate={regenerate} />
      </form>

      {state.error && (
        <div
          className="rounded-input px-3 py-2 text-sm"
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
    </div>
  );
}

function SubmitButton({ label, regenerate }: { label: string; regenerate: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={regenerate ? "btn btn-ghost" : "btn btn-primary"}
    >
      {regenerate ? <RefreshCw size={14} /> : <Sparkles size={14} />}
      {pending ? (regenerate ? "Regenerating…" : "Generating…") : label}
    </button>
  );
}
