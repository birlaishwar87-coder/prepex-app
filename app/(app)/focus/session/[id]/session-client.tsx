"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, ChevronRight, Loader2, X } from "lucide-react";
import { FocusTimer } from "./components/focus-timer";
import { RecapScreen } from "./components/recap-screen";
import {
  completeFocusSessionAction,
  terminateFocusSessionAction,
  toggleMilestoneAction,
  type TerminatedReason,
  type TimerMode,
} from "../../actions";
import { Logo } from "@/components/ui/logo";
import { labelForSubject } from "@/lib/practice/question-utils";

export interface SessionData {
  id: string;
  timerMode: TimerMode;
  plannedSec: number | null;
  subject: string | null;
  chapter: string | null;
  topic: string | null;
  taskType: string | null;
  linkedTaskId: string | null;
  milestones: Array<{ id: number; label: string; done: boolean }>;
  startedAtMs: number;
  alreadyEnded: boolean;
  /** Pre-existing elapsed seconds (in case session was refreshed mid-flight). */
  resumeElapsedSec: number;
}

const TIMER_LABEL: Record<TimerMode, string> = {
  stopwatch: "STOPWATCH",
  pomodoro_25: "25 MIN",
  pomodoro_45: "45 MIN",
  pomodoro_60: "60 MIN",
  custom: "CUSTOM",
};

type Phase = "active" | "recap";

export function SessionClient({ data }: { data: SessionData }) {
  // If reopened after completion, jump straight to recap.
  const [phase, setPhase] = useState<Phase>(data.alreadyEnded ? "recap" : "active");

  const [elapsed, setElapsed] = useState<number>(data.resumeElapsedSec);
  const [milestones, setMilestones] = useState(data.milestones);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingEnd, startEnd] = useTransition();
  const [autoCompleted, setAutoCompleted] = useState(false);
  const completedRef = useRef(false);

  // Tick clock at 1Hz. Stopwatch counts up forever; pomodoro counts down,
  // and when remaining hits 0 we auto-complete.
  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Auto-complete when pomodoro reaches planned duration.
  useEffect(() => {
    if (phase !== "active") return;
    if (!data.plannedSec) return;
    if (elapsed < data.plannedSec) return;
    if (completedRef.current) return;
    completedRef.current = true;
    setAutoCompleted(true);
    startEnd(async () => {
      await completeFocusSessionAction({
        sessionId: data.id,
        actualDurationSec: data.plannedSec ?? elapsed,
      });
      setPhase("recap");
    });
  }, [elapsed, phase, data.plannedSec, data.id]);

  async function manualEnd(reason: TerminatedReason) {
    if (completedRef.current) return;
    completedRef.current = true;
    startEnd(async () => {
      await terminateFocusSessionAction({
        sessionId: data.id,
        actualDurationSec: elapsed,
        reason,
      });
      setPhase("recap");
    });
  }

  function toggleMilestone(id: number, done: boolean) {
    // Optimistic
    setMilestones((arr) =>
      arr.map((m) => (m.id === id ? { ...m, done } : m))
    );
    void toggleMilestoneAction({
      sessionId: data.id,
      milestoneId: id,
      done,
    });
  }

  if (phase === "recap") {
    const actualMinutes = Math.max(1, Math.round(elapsed / 60));
    return <RecapScreen sessionId={data.id} actualMinutes={actualMinutes} linkedTaskId={data.linkedTaskId} />;
  }

  const subjectLabel = labelForSubject(data.subject ?? undefined);
  const breadcrumb = [subjectLabel, data.chapter, data.topic]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="relative">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="inline-flex items-center gap-1.5 text-[13px] tertiary"
        >
          <X size={14} /> End session
        </button>
        {breadcrumb && (
          <div className="flex items-center gap-1.5 text-[12px] tertiary">
            {breadcrumb}
            {data.taskType && (
              <>
                <ChevronRight size={11} />
                <span className="coral-text font-semibold capitalize">
                  {data.taskType.replace("_", " ")}
                </span>
              </>
            )}
          </div>
        )}
        <Logo size={18} />
      </div>

      {/* Center */}
      <div className="flex flex-col items-center gap-9 py-6">
        <FocusTimer
          elapsedSec={elapsed}
          plannedSec={data.plannedSec}
          running
          size={300}
          label={TIMER_LABEL[data.timerMode]}
        />

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="w-full max-w-[540px]">
            <div className="t-label tertiary mb-3 text-center">This session</div>
            <div className="glass p-2">
              {milestones.map((m) => {
                const checked = m.done;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMilestone(m.id, !checked)}
                    className="flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-left transition-colors"
                    style={{
                      background: checked ? "rgba(255,255,255,0.025)" : "transparent",
                    }}
                  >
                    <span
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md"
                      style={{
                        border: `1.5px solid ${checked ? "var(--coral)" : "var(--border-hover)"}`,
                        background: checked ? "var(--coral)" : "transparent",
                        transition: "all 200ms",
                      }}
                    >
                      {checked && <Check size={12} stroke="#050010" strokeWidth={3.5} />}
                    </span>
                    <span
                      className="flex-1 text-[13.5px]"
                      style={{
                        color: checked
                          ? "var(--text-tertiary)"
                          : "var(--text-primary)",
                        textDecoration: checked ? "line-through" : "none",
                      }}
                    >
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {pendingEnd && !autoCompleted && (
          <div className="flex items-center gap-2 text-[12.5px] tertiary">
            <Loader2 size={12} className="animate-spin" /> Wrapping up…
          </div>
        )}
      </div>

      {/* Exit confirm */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="glass w-full max-w-[420px] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="t-h4 mb-2">End this session?</h3>
            <p className="t-body-sm secondary mb-4">
              You&apos;ve focused for {Math.max(1, Math.round(elapsed / 60))} minutes. We&apos;ll
              save what you did and ask how it went.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  void manualEnd("manual_end");
                }}
                className="btn btn-primary btn-sm"
                disabled={pendingEnd}
              >
                End session
              </button>
              <Link href="/today" className="btn btn-ghost btn-sm">
                Leave without saving
              </Link>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="btn btn-text btn-sm"
              >
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
