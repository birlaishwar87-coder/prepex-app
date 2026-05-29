"use client";

import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { acknowledgeBadDayAction } from "../actions";

/**
 * PRD §4.3.2 — The Welcome Screen.
 *
 * Tone is locked:
 *   "You took a break. That's completely okay. Every JEE warrior has
 *    tough days. What matters is showing up again."
 *   (PRD wording, with the word "warrior" removed per banned-list — we
 *   say "JEE aspirant" instead.)
 *
 * Critical rules:
 *   • NO backlog count anywhere on this screen (PRD §4.3.4).
 *   • Streak silently reset to 0 (PRD §4.3.5) — handled server-side.
 *   • One CTA: "Start fresh" → generates a 3-task light plan.
 */
export function BadDayWelcome({
  firstName,
  daysAway,
}: {
  firstName: string;
  daysAway: number;
}) {
  const [pending, startTransition] = useTransition();

  function onStart() {
    startTransition(async () => {
      await acknowledgeBadDayAction();
    });
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <div
        className="glass relative overflow-hidden p-10"
        style={{
          background: "linear-gradient(135deg, rgba(76, 29, 149, 0.25), rgba(26, 26, 78, 0.4))",
          border: "1px solid rgba(76, 29, 149, 0.35)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,122,89,0.30), transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <h1 className="t-h2 mb-2.5">Hey {firstName}.</h1>
        <p className="t-body cream-text mb-4">
          You took a break. That&apos;s completely okay.
        </p>
        <p className="t-body-sm secondary mb-7">
          {daysAway > 7
            ? "It's been a while. What matters is showing up again."
            : "Every JEE aspirant has tough days. What matters is showing up again."}
        </p>

        <div
          className="mb-7 rounded-card border p-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "var(--border-default)",
          }}
        >
          <p className="t-body-sm cream-text mb-1">Let&apos;s start fresh today.</p>
          <p className="t-body-sm tertiary">
            Just one small task to begin. We&apos;ll build from there.
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={pending}
          className="btn btn-primary btn-lg"
        >
          {pending ? "Preparing…" : "Start fresh"}
          {!pending && <ArrowRight size={16} />}
        </button>

        <p className="mt-5 text-[12px] tertiary">
          No catching up. No guilt. Just today.
        </p>
      </div>
    </div>
  );
}
