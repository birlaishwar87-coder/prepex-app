"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { rateFocusSessionAction, type Difficulty } from "../../../actions";

const RATINGS: Array<{ id: Difficulty; emoji: string; label: string; sub: string; color: string }> = [
  { id: "hard", emoji: "😓", label: "Hard", sub: "Try sooner next time", color: "#F87171" },
  { id: "medium", emoji: "😐", label: "Just right", sub: "Default interval", color: "#FBBF24" },
  { id: "easy", emoji: "😊", label: "Easy", sub: "Space it out more", color: "#34D399" },
];

export function RecapScreen({
  sessionId,
  actualMinutes,
  linkedTaskId,
}: {
  sessionId: string;
  actualMinutes: number;
  linkedTaskId: string | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState<Difficulty | null>(null);
  const [notes, setNotes] = useState("");
  const [markComplete, setMarkComplete] = useState(true);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!rating) return;
    setError(null);
    startTransition(async () => {
      const { error: err } = await rateFocusSessionAction({
        sessionId,
        rating,
        notes: notes.trim() || null,
        markTaskComplete: !!linkedTaskId && markComplete,
      });
      if (err) {
        setError(err);
        return;
      }
      router.push("/today");
    });
  }

  function skip() {
    router.push("/today");
  }

  return (
    <div className="mx-auto max-w-[560px] py-8 text-center">
      <div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255, 122, 89, 0.35), rgba(255, 122, 89, 0.05))",
          border: "1px solid rgba(255, 122, 89, 0.4)",
          color: "var(--coral)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 40px rgba(255, 122, 89, 0.3)",
        }}
      >
        <Sparkles size={36} />
      </div>

      <h2 className="t-h2 mb-1">
        Session done.{" "}
        <span className="secondary">
          {actualMinutes} {actualMinutes === 1 ? "minute" : "minutes"} focused.
        </span>
      </h2>
      <p className="t-body secondary mb-7">How was it?</p>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {RATINGS.map((r) => {
          const active = rating === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRating(r.id)}
              className="rounded-card border p-4 transition-all"
              style={{
                background: active ? `${r.color}1F` : "rgba(255,255,255,0.025)",
                borderColor: active ? r.color : "var(--border-default)",
                transform: active ? "translateY(-3px)" : "none",
                boxShadow: active ? `0 0 24px ${r.color}55` : "none",
                cursor: "pointer",
                transitionDuration: "220ms",
              }}
            >
              <div className="mb-2 text-3xl leading-none">{r.emoji}</div>
              <div className="text-[13px] font-bold cream-text">{r.label}</div>
              <div className="mt-1 text-[10.5px] tertiary">{r.sub}</div>
            </button>
          );
        })}
      </div>

      <div className="mb-5">
        <textarea
          placeholder="Anything to remember? (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={400}
          rows={3}
          className="field w-full text-left"
          style={{ resize: "vertical" }}
        />
      </div>

      {linkedTaskId && (
        <label className="mb-5 flex cursor-pointer items-center justify-center gap-2 text-[13px] secondary">
          <input
            type="checkbox"
            checked={markComplete}
            onChange={(e) => setMarkComplete(e.target.checked)}
            className="accent-[var(--coral)]"
          />
          Mark the linked Daily Plan task as completed
        </label>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-input px-4 py-3 text-[12.5px]"
          style={{
            background: "rgba(248, 113, 113, 0.08)",
            border: "1px solid rgba(248, 113, 113, 0.30)",
            color: "#FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={!rating || pending}
          className="btn btn-primary btn-lg"
        >
          {pending ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              Continue <ArrowRight size={14} />
            </>
          )}
        </button>
        <button type="button" onClick={skip} className="btn btn-ghost btn-lg">
          Skip
        </button>
      </div>
    </div>
  );
}
