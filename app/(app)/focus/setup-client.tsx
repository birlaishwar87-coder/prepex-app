"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Play, Plus, Timer, X, Zap } from "lucide-react";
import { startFocusSessionAction, type TimerMode } from "./actions";
import { labelForSubject, colorForSubject } from "@/lib/practice/question-utils";

const MODE_OPTIONS: Array<{
  id: TimerMode;
  label: string;
  sub: string;
  Icon: typeof Timer;
  accent: string;
}> = [
  {
    id: "pomodoro_25",
    label: "25 min",
    sub: "Pomodoro · short cycle",
    Icon: Timer,
    accent: "#FF7A59",
  },
  {
    id: "pomodoro_45",
    label: "45 min",
    sub: "Pomodoro · deep work",
    Icon: Timer,
    accent: "#A78BFA",
  },
  {
    id: "pomodoro_60",
    label: "60 min",
    sub: "Pomodoro · full hour",
    Icon: Timer,
    accent: "#6EE7B7",
  },
  {
    id: "stopwatch",
    label: "Stopwatch",
    sub: "Count up · end manually",
    Icon: Clock,
    accent: "#A5B4FC",
  },
  {
    id: "custom",
    label: "Custom",
    sub: "Pick your own duration",
    Icon: Zap,
    accent: "#FBBF24",
  },
];

export interface TaskCtx {
  id: string;
  subject: string;
  chapter: string | null;
  topic: string | null;
  estimatedMinutes: number;
  taskType: string;
}

export function SetupClient({ taskContext }: { taskContext: TaskCtx | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<TimerMode>("pomodoro_25");
  const [customMin, setCustomMin] = useState(30);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addMilestone() {
    const t = draft.trim();
    if (t.length === 0 || milestones.length >= 6) return;
    setMilestones([...milestones, t]);
    setDraft("");
  }

  function removeMilestone(i: number) {
    setMilestones(milestones.filter((_, idx) => idx !== i));
  }

  function start() {
    setError(null);
    startTransition(async () => {
      const durationSec =
        mode === "custom"
          ? Math.max(5, Math.min(180, customMin)) * 60
          : undefined;
      const r = await startFocusSessionAction({
        mode,
        taskId: taskContext?.id ?? null,
        durationSec,
        milestones,
      });
      if (r.ok) {
        router.push(`/focus/session/${r.sessionId}`);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Task context card */}
      {taskContext && (
        <div
          className="glass flex flex-wrap items-center gap-3 p-4"
          style={{ borderColor: "rgba(255,122,89,0.30)", background: "rgba(255,122,89,0.05)" }}
        >
          <div
            className="h-10 w-1 rounded-full"
            style={{ background: colorForSubject(taskContext.subject) }}
          />
          <div className="min-w-0 flex-1">
            <div className="t-label coral mb-1 capitalize">
              Linked to · {labelForSubject(taskContext.subject)}
            </div>
            <div className="text-[14.5px] cream-text font-semibold">
              {taskContext.chapter ?? "—"}
              {taskContext.topic ? <span className="secondary"> · {taskContext.topic}</span> : null}
            </div>
            <div className="mt-1 text-[12px] tertiary">
              Planned {taskContext.estimatedMinutes} min · {taskContext.taskType.replace("_", " ")}
            </div>
          </div>
        </div>
      )}

      {/* Mode picker */}
      <div>
        <div className="t-label tertiary mb-3">Timer mode</div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {MODE_OPTIONS.map((opt) => {
            const active = mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setMode(opt.id)}
                className="glass relative flex flex-col items-start gap-2 p-4 text-left"
                style={{
                  borderColor: active ? `${opt.accent}88` : "var(--border-default)",
                  background: active ? `${opt.accent}14` : undefined,
                  cursor: "pointer",
                  transition: "all 200ms",
                  boxShadow: active ? `0 0 0 3px ${opt.accent}22` : undefined,
                }}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{
                    background: `${opt.accent}26`,
                    border: `1px solid ${opt.accent}66`,
                    color: opt.accent,
                  }}
                >
                  <opt.Icon size={16} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold cream-text">{opt.label}</div>
                  <div className="text-[11.5px] tertiary">{opt.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom duration */}
      {mode === "custom" && (
        <div className="glass p-4">
          <div className="t-label tertiary mb-2">Duration ({customMin} min)</div>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={customMin}
            onChange={(e) => setCustomMin(parseInt(e.target.value, 10))}
            className="w-full accent-[var(--coral)]"
          />
          <div className="mt-1 flex justify-between text-[11.5px] tertiary">
            <span>5 min</span>
            <span>60 min</span>
            <span>120 min</span>
          </div>
        </div>
      )}

      {/* Milestones (optional) */}
      <div>
        <div className="t-label tertiary mb-2">Sub-goals (optional)</div>
        <div
          className="glass space-y-2 p-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          {milestones.length === 0 && (
            <p className="text-[12.5px] tertiary">
              Optional checklist that lives next to the timer. Tick off as you go. Up to 6.
            </p>
          )}
          {milestones.map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-md px-3 py-1.5"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <span className="flex-1 text-[13.5px] cream-text">{m}</span>
              <button
                type="button"
                onClick={() => removeMilestone(i)}
                className="tertiary"
                aria-label={`Remove milestone ${i + 1}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {milestones.length < 6 && (
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMilestone();
                  }
                }}
                placeholder='e.g. "Read NCERT pp 88–94"'
                maxLength={80}
                className="field flex-1"
              />
              <button
                type="button"
                onClick={addMilestone}
                disabled={draft.trim().length === 0}
                className="btn btn-ghost btn-sm"
              >
                <Plus size={12} /> Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="rounded-input px-4 py-3 text-[13px]"
          style={{
            background: "rgba(248, 113, 113, 0.08)",
            border: "1px solid rgba(248, 113, 113, 0.30)",
            color: "#FCA5A5",
          }}
        >
          {error}
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={start}
        disabled={pending}
        className="btn btn-primary btn-lg w-full"
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Starting…
          </>
        ) : (
          <>
            <Play size={16} /> Start focus session
          </>
        )}
      </button>
    </div>
  );
}
