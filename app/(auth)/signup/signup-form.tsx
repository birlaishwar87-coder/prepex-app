"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { GoogleButton } from "@/components/auth/google-button";
import { signupAction, type SignupState } from "./actions";

const initial: SignupState = { error: null, fieldErrors: {} };

const COUNTRIES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+65", label: "🇸🇬 +65" },
];

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, initial);
  const [stage, setStage] = useState<"social" | "form">("social");

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
        Welcome to Prepex.
      </h1>
      <p className="t-body-sm secondary mb-7 text-center">
        Plan, execute, survive. Real prep that shows up.
      </p>

      {stage === "social" && (
        <div className="flex flex-col gap-2.5">
          <GoogleButton />
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
            helper="At least 8 characters."
            error={state.fieldErrors.password}
          />
          <FieldInput
            id="firstName"
            name="firstName"
            label="First name"
            error={state.fieldErrors.firstName}
          />
          <div className="flex gap-2.5">
            <div className="field w-[110px] flex-shrink-0 relative">
              <select
                name="country"
                defaultValue="+91"
                className="h-14 w-full rounded-input border text-[15px] outline-none"
                style={{
                  background: "var(--bg-input)",
                  borderColor: "var(--border-default)",
                  color: "var(--cream)",
                  padding: "22px 12px 8px",
                  appearance: "none",
                  fontFamily: "inherit",
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span
                className="pointer-events-none absolute left-3 top-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--coral)", letterSpacing: "0.04em" }}
              >
                Country
              </span>
            </div>
            <div className="flex-1">
              <FieldInput
                id="phone"
                name="phone"
                type="tel"
                label="Phone number"
                error={state.fieldErrors.phone}
              />
            </div>
          </div>
          <p className="-mt-2 text-[11.5px] tertiary leading-relaxed">
            We use this only for important account events. Never for marketing.
          </p>

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

          <SubmitButton label="Create account" />

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
        Already have an account?{" "}
        <Link href="/login" className="font-semibold" style={{ color: "var(--coral-lighter)" }}>
          Sign in
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
  helper,
  error,
  autoFocus,
}: {
  id: string;
  name: string;
  type?: string;
  label: string;
  helper?: string;
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
      {error ? (
        <div className="mt-1.5 px-1 text-xs" style={{ color: "var(--error)" }}>
          {error}
        </div>
      ) : helper ? (
        <div className="mt-1.5 px-1 text-[11.5px] tertiary leading-relaxed">{helper}</div>
      ) : null}
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
      {pending ? "Creating account…" : label}
      {!pending && <ArrowRight size={16} />}
    </button>
  );
}
