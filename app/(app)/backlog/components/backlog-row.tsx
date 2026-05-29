"use client";

import { useTransition } from "react";
import { ArrowRight, MoreHorizontal, PauseCircle, PlayCircle, X } from "lucide-react";
import {
  acknowledgeHeldNudgeAction,
  addBacklogToTodayPlanAction,
  holdBacklogItemAction,
  resumeBacklogItemAction,
  skipBacklogItemAction,
} from "../actions";

export type BacklogRowItem = {
  id: string;
  subject: "physics" | "chemistry" | "maths" | "revision" | "wellness";
  chapter: string | null;
  topic: string | null;
  taskType: string | null;
  estimatedMinutes: number | null;
  daysOverdue: number;
  priorityWeight: number;
  state: "active" | "held" | "user_added" | "redistributed";
  priority: "urgent" | "normal" | "low";
  /** Set when the row has been held ≥7 days AND not yet acknowledged (PRD §11.7). */
  showHeldNudge?: boolean;
};

const SUBJECT_DOT: Record<string, string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
  revision: "#FBBF24",
  wellness: "#6EE7B7",
};

export function BacklogRow({ item }: { item: BacklogRowItem }) {
  const [pending, startTransition] = useTransition();
  const color = SUBJECT_DOT[item.subject] ?? "#A5B4FC";

  function run(action: () => Promise<unknown>) {
    return () => {
      startTransition(async () => {
        await action();
      });
    };
  }

  const overdueLabel =
    item.daysOverdue === 0
      ? "Today"
      : `${item.daysOverdue} ${item.daysOverdue === 1 ? "day" : "days"} overdue`;

  const isHeld = item.state === "held";
  const isUserAdded = item.state === "user_added";

  return (
    <div
      className="glass relative flex flex-col gap-2 overflow-hidden p-0"
      style={{
        opacity: pending ? 0.6 : 1,
        transition: "all 240ms cubic-bezier(.2,.7,.2,1)",
      }}
    >
      <div className="flex items-stretch">
        <div className="w-1 flex-shrink-0" style={{ background: color }} />
        <div className="flex flex-1 flex-wrap items-center gap-3.5 px-4 py-3">
          <div className="min-w-0 flex-1" style={{ minWidth: 200 }}>
            <div className="text-[15px] font-semibold cream-text">
              <span className="capitalize">{item.subject}</span>
              {item.chapter ? ` · ${item.chapter}` : ""}
            </div>
            {item.topic && (
              <div className="mt-0.5 text-[12.5px] secondary">{item.topic}</div>
            )}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="pill" style={{ padding: "3px 8px", fontSize: 11 }}>
                {overdueLabel}
              </span>
              <span className="pill" style={{ padding: "3px 8px", fontSize: 11 }}>
                weight {item.priorityWeight.toFixed(2)}
              </span>
              {isHeld && (
                <span
                  className="pill"
                  style={{
                    padding: "3px 8px",
                    fontSize: 11,
                    background: "rgba(76, 29, 149, 0.18)",
                    color: "#C4B5FD",
                    border: "1px solid rgba(76, 29, 149, 0.40)",
                  }}
                >
                  Held
                </span>
              )}
              {isUserAdded && (
                <span
                  className="pill"
                  style={{
                    padding: "3px 8px",
                    fontSize: 11,
                    background: "rgba(255, 122, 89, 0.12)",
                    color: "var(--coral-lighter)",
                    border: "1px solid rgba(255, 122, 89, 0.30)",
                  }}
                >
                  You added
                </span>
              )}
              {item.estimatedMinutes != null && (
                <span className="pill" style={{ padding: "3px 8px", fontSize: 11 }}>
                  {item.estimatedMinutes} min
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={run(() => addBacklogToTodayPlanAction(item.id))}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] font-semibold"
              style={{
                background: "rgba(255, 122, 89, 0.15)",
                color: "var(--coral-lighter)",
                borderColor: "rgba(255, 122, 89, 0.30)",
              }}
            >
              Add to plan <ArrowRight size={13} />
            </button>
            {isHeld ? (
              <button
                type="button"
                onClick={run(() => resumeBacklogItemAction(item.id))}
                disabled={pending}
                aria-label="Resume from held"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text-secondary)",
                }}
              >
                <PlayCircle size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={run(() => holdBacklogItemAction(item.id))}
                disabled={pending}
                aria-label="Hold"
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--text-secondary)",
                }}
              >
                <PauseCircle size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={run(() => skipBacklogItemAction(item.id))}
              disabled={pending}
              aria-label="Skip permanently"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border-none"
              style={{ background: "transparent", color: "var(--text-tertiary)" }}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {item.showHeldNudge && (
        <div
          className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-input border px-3 py-2.5 text-[12.5px]"
          style={{
            background: "rgba(76, 29, 149, 0.10)",
            borderColor: "rgba(76, 29, 149, 0.30)",
            color: "var(--text-secondary)",
          }}
        >
          <span>You&apos;ve held this for 7 days. Revisit or skip — no pressure either way.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={run(() => acknowledgeHeldNudgeAction(item.id))}
              disabled={pending}
              className="btn btn-text btn-sm"
            >
              Hold longer
            </button>
            <MoreHorizontal size={14} className="tertiary" />
          </div>
        </div>
      )}
    </div>
  );
}
