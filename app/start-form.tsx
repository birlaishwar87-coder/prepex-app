"use client";

import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { startMemberSessionAction, type StartState } from "./start-action";

const initialState: StartState = { error: null, fieldError: null };

export function StartForm() {
  const [state, formAction] = useFormState(startMemberSessionAction, initialState);

  return (
    <form action={formAction} className="mx-auto w-full max-w-[420px]">
      <label
        htmlFor="firstName"
        className="t-label tertiary mb-2 block text-left"
      >
        What should we call you?
      </label>
      <input
        id="firstName"
        name="firstName"
        type="text"
        required
        autoComplete="given-name"
        placeholder="Ishwar"
        maxLength={40}
        className="field w-full text-center"
        aria-invalid={state.fieldError ? true : undefined}
        aria-describedby={state.fieldError ? "firstName-error" : undefined}
      />
      {state.fieldError && (
        <p id="firstName-error" className="mt-1.5 text-left text-[12px]" style={{ color: "#FCA5A5" }}>
          {state.fieldError}
        </p>
      )}

      <div className="mt-5 flex justify-center">
        <SubmitButton />
      </div>

      {state.error && (
        <div
          role="alert"
          className="mt-4 rounded-input px-3 py-2.5 text-[12.5px]"
          style={{
            background: "rgba(248, 113, 113, 0.08)",
            border: "1px solid rgba(248, 113, 113, 0.30)",
            color: "#FCA5A5",
          }}
        >
          {state.error}
        </div>
      )}

      <p className="mt-5 text-[12px] tertiary">
        No password, no email needed. Your session lives on this device.
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" /> Getting things ready…
        </>
      ) : (
        <>
          Get started <ArrowRight size={18} />
        </>
      )}
    </button>
  );
}
