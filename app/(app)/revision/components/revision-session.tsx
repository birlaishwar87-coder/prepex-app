"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, Brain, Check, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { submitRevisionAction, skipRevisionAction } from "../actions";
import type { Difficulty } from "@/lib/revision/intervals";

const SUBJECT_DOT: Record<string, string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
  revision: "#FBBF24",
};

const RATINGS: Array<{ id: Difficulty; label: string; sub: string; color: string }> = [
  { id: "hard", label: "Hard", sub: "Lost the thread. Revisit soon.", color: "#FCA5A5" },
  { id: "medium", label: "Medium", sub: "Recalled with effort. Stay on track.", color: "#FBBF24" },
  { id: "easy", label: "Easy", sub: "Smooth recall. Push it further.", color: "#6EE7B7" },
];

export type RevisionTarget = {
  topicStateId: string;
  chapter: string;
  subject: "physics" | "chemistry" | "maths" | "revision";
  topic?: string | null;
  lastRevisedAt?: string | null;
  /** When launched from a /today task card, used to mark the task complete. */
  linkedTaskId?: string | null;
};

/**
 * Shared revision session UX (PRD §2.5.2 — simplified for V1).
 *
 * Two-step flow:
 *   1. Self-quiz prompt + optional textarea (5-min recall reminder).
 *   2. Difficulty rating (Hard / Medium / Easy).
 *
 * On submit:
 *   • submitRevisionAction recomputes next_revision_due + interval, logs
 *     a revision_sessions row, and updates the linked task if any.
 *   • Skip is a separate action that moves the topic to backlog (PRD §2.5.3).
 *
 * Real recall questions + reference materials ship in PHASE_2 (question
 * bank + curated resources from PRD §18 aren't in V1).
 */
export function RevisionSession({
  target,
  onClose,
}: {
  target: RevisionTarget | null;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"intro" | "rating">("intro");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Reset state when target changes.
  useEffect(() => {
    if (target) {
      setStage("intro");
      setNotes("");
      setError(null);
      startTimeRef.current = Date.now();
    }
  }, [target]);

  if (!target) return null;

  function durationSecondsSinceStart() {
    if (!startTimeRef.current) return undefined;
    return Math.max(0, Math.round((Date.now() - startTimeRef.current) / 1000));
  }

  function submit(rating: Difficulty) {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const result = await submitRevisionAction({
        topicStateId: target.topicStateId,
        rating,
        durationSeconds: durationSecondsSinceStart(),
        taskId: target.linkedTaskId ?? null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function skip() {
    if (!target) return;
    setError(null);
    startTransition(async () => {
      const result = await skipRevisionAction({
        topicStateId: target.topicStateId,
        taskId: target.linkedTaskId ?? null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  const color = SUBJECT_DOT[target.subject] ?? "#A5B4FC";
  const lastRevisedDays = target.lastRevisedAt
    ? Math.max(0, Math.round((Date.now() - new Date(target.lastRevisedAt).getTime()) / 86_400_000))
    : null;

  return (
    <Modal open={!!target} onClose={onClose} width={560}>
      <div className="relative">
        <div
          className="h-1.5"
          style={{ background: color, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        />
        <div className="p-7">
          <div className="mb-2 flex items-start justify-between gap-3">
            <span className="t-label tertiary capitalize">{target.subject} · Revision</span>
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
          <h2 className="t-h2 mb-2">{target.chapter}</h2>
          {target.topic && <p className="t-body-sm secondary mb-4">{target.topic}</p>}

          {lastRevisedDays != null && (
            <p className="mb-4 text-[12px] tertiary">
              Last revised {lastRevisedDays === 0 ? "today" : `${lastRevisedDays} days ago`}.
            </p>
          )}

          {stage === "intro" && (
            <>
              <div
                className="mb-4 flex items-start gap-3 rounded-card border px-4 py-3"
                style={{
                  background: "rgba(76, 29, 149, 0.10)",
                  borderColor: "rgba(76, 29, 149, 0.30)",
                }}
              >
                <Brain size={18} style={{ color: "#C4B5FD", marginTop: 2, flexShrink: 0 }} />
                <div className="text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
                  <div className="mb-1 font-semibold cream-text">Take 5 minutes</div>
                  Try to remember the 3 most important ideas from this chapter before checking
                  notes. Recall first, review second.
                </div>
              </div>

              <div className="field mb-2">
                <textarea
                  id="quiz"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder=" "
                  rows={5}
                  style={{ minHeight: 120 }}
                />
                <label htmlFor="quiz">3 key insights (optional, just for you)</label>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={skip}
                  disabled={pending}
                  className="btn btn-text"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Skip this revision
                </button>
                <button
                  type="button"
                  onClick={() => setStage("rating")}
                  disabled={pending}
                  className="btn btn-primary"
                >
                  Rate it <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}

          {stage === "rating" && (
            <>
              <p className="t-body-sm secondary mb-4">How was that recall?</p>
              <div className="grid grid-cols-1 gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => submit(r.id)}
                    disabled={pending}
                    className="flex items-center gap-4 rounded-card border px-4 py-3.5 text-left transition-all"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      borderColor: "var(--border-default)",
                      transitionDuration: "180ms",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,122,89,0.06)";
                      e.currentTarget.style.borderColor = "rgba(255,122,89,0.30)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                      e.currentTarget.style.borderColor = "var(--border-default)";
                    }}
                  >
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `${r.color}22`,
                        color: r.color,
                        border: `1px solid ${r.color}55`,
                      }}
                    >
                      <Check size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold cream-text">{r.label}</div>
                      <div className="mt-0.5 text-[12.5px] tertiary">{r.sub}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStage("intro")}
                  disabled={pending}
                  className="btn btn-text"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={skip}
                  disabled={pending}
                  className="btn btn-text"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Skip this revision
                </button>
              </div>
            </>
          )}

          {error && (
            <div
              className="mt-4 rounded-input px-3 py-2.5 text-sm"
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
        </div>
      </div>
    </Modal>
  );
}
