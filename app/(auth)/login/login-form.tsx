"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { GoogleButton } from "@/components/auth/google-button";
import { loginAction, type LoginState } from "./actions";

const initial: LoginState = { error: null, fieldErrors: {} };

export function LoginForm({
  redirect,
  initialError,
}: {
  redirect?: string;
  initialError?: string;
}) {
  const [state, formAction] = useFormState(loginAction, initial);
  const [stage, setStage] = useState<"social" | "form">("social");
  const surfacedError = state.error ?? initialError ?? null;

  return (
    <div
      className="glass w-full max-w-[440px]"
      style={{
        padding: "44px 36px",
        background: "rgba(20, 8, 40, 0.55)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 80px rgba(76, 29, 149, 0.15)",
      }}
    >
      <div className="mb-7 flex justify-center">
        <Logo size={32} />
      </div>

      <h1 className="t-h2 mb-2 text-center" style={{ fontSize: 28 }}>
        Welcome back.
      </h1>
      <p className="t-body-sm secondary mb-7 text-center">Pick up where you left off.</p>

      {stage === "social" && (
        <div className="flex flex-col gap-2.5">
          <GoogleButton redirect={redirect} />
          <button
            type="button"
            onClick={() => setStage("form")}
            className="flex h-12 w-full items-center justify-center gap-3 rounded-btn border text-sm font-semibold text-text-primary transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "var(--border-default)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.03)";
            }}
          >
            Continue with email
          </button>
        </div>
      )}

      {stage === "form" && (
        <form action={formAction} className="flex flex-col gap-3.5">
          {redirect && <input type="hidden" name="redirect" value={redirect} />}

          <FieldInput
            id="email"
            name="email"
            type="email"
            label="Email address"
            error={state.fieldErrors.email}
            autoFocus
          />
          <FieldInput
            id="password"
            name="password"
            type="password"
            label="Password"
            error={state.fieldErrors.password}
          />

          {surfacedError && (
            <div
              className="rounded-input px-3 py-2.5 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
                color: "#FCA5A5",
              }}
              role="alert"
            >
              {surfacedError}
            </div>
          )}

          <SubmitButton label="Sign in" />

          <button
            type="button"
            onClick={() => setStage("social")}
            className="-mb-2 mt-1 bg-transparent text-[13px] tertiary"
          >
            ← back to other options
          </button>
        </form>
      )}

      <div className="divider my-5" />

      <div className="text-center text-sm secondary">
        New to Prepex?{" "}
        <Link href="/signup" className="font-semibold" style={{ color: "var(--coral-lighter)" }}>
          Create an account
        </Link>
      </div>
    </div>
  );
}

function FieldInput({
  id,
  name,
  type = "text",
  label,
  error,
  autoFocus,
}: {
  id: string;
  name: string;
  type?: string;
  label: string;
  error?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="field">
      <input
        id={id}
        name={name}
        type={type}
        placeholder=" "
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
      />
      <label htmlFor={id}>{label}</label>
      {error && (
        <div className="mt-1.5 px-1 text-xs" style={{ color: "var(--error)" }}>
          {error}
        </div>
      )}
    </div>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary mt-2 w-full"
      style={{ height: 50, fontSize: 15 }}
    >
      {pending ? "Signing in…" : label}
      {!pending && <ArrowRight size={16} />}
    </button>
  );
}
