"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, MoreHorizontal, Play, RefreshCw, Target } from "lucide-react";
import type { Tables } from "@/lib/supabase/database.types";
import { track } from "@/lib/analytics/mixpanel";
import { toggleTaskCompletedAction } from "../actions";

type Task = Tables<"tasks">;

const SUBJECT_COLOR: Record<string, string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
  revision: "#FBBF24",
  wellness: "#6EE7B7",
};

const TASK_TYPE_META: Record<
  string,
  { label: string; cta: string; Icon: typeof Play; revisionTinted?: boolean }
> = {
  new_learning: { label: "New learning", cta: "Start session", Icon: Play },
  revision: { label: "Revision", cta: "Start revision", Icon: RefreshCw, revisionTinted: true },
  practice: { label: "Practice", cta: "Practice", Icon: Target },
  dpp: { label: "DPP", cta: "Start DPP", Icon: CheckCircle2 },
  mock_review: { label: "Mock review", cta: "Open mock", Icon: Play },
  wellness: { label: "Wellness", cta: "Mark done", Icon: CheckCircle2 },
};

export function TaskCard({
  task,
  onOpen,
  onStartRevision,
}: {
  task: Task;
  onOpen?: (task: Task) => void;
  /** When set AND task.task_type === 'revision', the primary CTA opens the
   *  revision session instead of the generic detail modal. */
  onStartRevision?: (task: Task) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [optimisticDone, setOptimisticDone] = useState(task.status === "completed");
  const color = SUBJECT_COLOR[task.subject] ?? "#A5B4FC";
  const type = TASK_TYPE_META[task.task_type] ?? TASK_TYPE_META.new_learning;
  const Icon = type.Icon;
  const done = optimisticDone;
  const isRevision = task.task_type === "revision" && !!onStartRevision;
  const timeLabel = formatTaskTime(task.specific_time, task.estimated_minutes);

  function primaryAction() {
    if (isRevision && onStartRevision) onStartRevision(task);
    else onOpen?.(task);
  }

  function onToggle() {
    const wasCompleted = task.status === "completed";
    setOptimisticDone((d) => !d);
    startTransition(async () => {
      const result = await toggleTaskCompletedAction(task.id);
      if (result.error) {
        setOptimisticDone(wasCompleted);
        return;
      }
      // Only track the pending → completed transition.
      if (!wasCompleted) {
        track("task_completed", {
          subject: task.subject,
          task_type: task.task_type,
          is_custom: !!task.is_custom,
          is_backlog: !!task.is_backlog,
        });
      }
    });
  }

  return (
    <div
      className="task-card glass relative flex items-stretch overflow-hidden p-0"
      style={{
        cursor: onOpen ? "pointer" : "default",
        opacity: done ? 0.55 : 1,
        transition: "all 240ms cubic-bezier(.2,.7,.2,1), opacity 320ms",
      }}
      onClick={() => primaryAction()}
    >
      <div className="w-1 flex-shrink-0" style={{ background: color }} />
      <div className="flex flex-1 flex-wrap items-center gap-3.5 px-4 py-3">
        <button
          type="button"
          aria-label={done ? "Mark task as not done" : "Mark task as done"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          disabled={pending}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-all"
          style={{
            border: `1.5px solid ${done ? color : "var(--border-hover)"}`,
            background: done ? color : "transparent",
            transitionDuration: "240ms",
            transitionTimingFunction: "cubic-bezier(.2,.7,.2,1)",
          }}
        >
          {done && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12l5 5 9-11"
                stroke="#050010"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="30"
                strokeDashoffset="0"
                style={{ animation: "checkdraw 320ms ease-out forwards" }}
              />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <div
            className="text-[15px] font-semibold text-cream"
            style={{ textDecoration: done ? "line-through" : "none" }}
          >
            <span className="capitalize">{task.subject}</span>
            {task.chapter ? ` · ${task.chapter}` : ""}
          </div>
          {task.topic && (
            <div className="mt-0.5 text-[12.5px] secondary">{task.topic}</div>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="pill" style={{ padding: "3px 8px", fontSize: 11 }}>
              {type.label}
            </span>
            <span className="pill" style={{ padding: "3px 8px", fontSize: 11 }}>
              {task.estimated_minutes} min
            </span>
            {timeLabel ? (
              <span
                className="pill"
                style={{
                  padding: "3px 8px",
                  fontSize: 11,
                  background: "rgba(255,122,89,0.10)",
                  color: "var(--coral-lighter)",
                  border: "1px solid rgba(255,122,89,0.30)",
                }}
              >
                {timeLabel}
              </span>
            ) : (
              <span className="pill" style={{ padding: "3px 8px", fontSize: 11 }}>
                {task.time_window}
              </span>
            )}
            {task.is_custom && (
              <span
                className="pill"
                style={{
                  padding: "3px 8px",
                  fontSize: 11,
                  background: "rgba(255,122,89,0.10)",
                  color: "var(--coral-lighter)",
                  border: "1px solid rgba(255,122,89,0.30)",
                }}
              >
                Custom
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] font-semibold transition-all"
            style={{
              background: type.revisionTinted
                ? "rgba(167, 139, 250, 0.15)"
                : "rgba(255, 122, 89, 0.15)",
              color: type.revisionTinted ? "#C4B5FD" : "var(--coral-lighter)",
              borderColor: type.revisionTinted
                ? "rgba(167, 139, 250, 0.35)"
                : "rgba(255, 122, 89, 0.3)",
              transitionDuration: "180ms",
            }}
            onClick={(e) => {
              e.stopPropagation();
              primaryAction();
            }}
          >
            <Icon size={13} /> {type.cta}
          </button>
          {onOpen && (
            <button
              type="button"
              onClick={() => onOpen(task)}
              aria-label="Open task details"
              className="flex h-8 w-8 items-center justify-center rounded-lg border-none"
              style={{
                background: "transparent",
                color: "var(--text-tertiary)",
                transition: "all 180ms",
              }}
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes checkdraw { from { stroke-dashoffset: 30; } to { stroke-dashoffset: 0; } }
        .task-card:hover {
          background: rgba(26, 26, 78, 0.45);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
}

/**
 * Format a task's clock time for the pill.
 * Returns "7:00 – 8:00 PM" when specific_time is set.
 * Returns null to fall back to the time_window pill.
 */
function formatTaskTime(
  specificTime: string | null,
  durationMinutes: number
): string | null {
  if (!specificTime) return null;
  const [h, m] = specificTime.split(":").map((s) => parseInt(s, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const start = new Date(2000, 0, 1, h, m);
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const fmt = (d: Date) => {
    const hours = d.getHours();
    const mins = d.getMinutes();
    const am = hours < 12 ? "AM" : "PM";
    const h12 = ((hours + 11) % 12) + 1;
    const mm = mins.toString().padStart(2, "0");
    return mins === 0 ? `${h12} ${am}` : `${h12}:${mm} ${am}`;
  };

  const sameMeridiem =
    (start.getHours() < 12 && end.getHours() < 12) ||
    (start.getHours() >= 12 && end.getHours() >= 12);
  const startFmt = sameMeridiem ? fmt(start).replace(/ (AM|PM)$/, "") : fmt(start);

  return `${startFmt} – ${fmt(end)}`;
}
