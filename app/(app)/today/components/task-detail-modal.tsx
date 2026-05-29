"use client";

import { useTransition } from "react";
import { Check, Play, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { Tables } from "@/lib/supabase/database.types";
import { removeTaskAction, toggleTaskCompletedAction } from "../actions";

type Task = Tables<"tasks">;

const SUBJECT_COLOR: Record<string, string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
  revision: "#FBBF24",
  wellness: "#6EE7B7",
};

const TYPE_LABEL: Record<string, string> = {
  new_learning: "New learning",
  revision: "Revision",
  practice: "Practice",
  dpp: "DPP",
  mock_review: "Mock review",
  wellness: "Wellness",
};

export function TaskDetailModal({
  task,
  onClose,
}: {
  task: Task | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  if (!task) return null;
  const color = SUBJECT_COLOR[task.subject] ?? "#A5B4FC";
  const done = task.status === "completed";

  function withClose(action: () => Promise<unknown>) {
    return () => {
      startTransition(async () => {
        await action();
        onClose();
      });
    };
  }

  return (
    <Modal open={!!task} onClose={onClose} width={520}>
      <div className="relative">
        <div
          className="h-1.5"
          style={{ background: color, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        />
        <div className="p-7">
          <div className="mb-2 flex items-start justify-between">
            <span className="t-label tertiary capitalize">{task.subject}</span>
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
          <h2 className="t-h2 mb-3.5">{task.chapter ?? "Custom task"}</h2>

          <div className="mb-5 flex flex-wrap gap-2">
            <span className="pill">{TYPE_LABEL[task.task_type] ?? task.task_type}</span>
            <span className="pill">{task.estimated_minutes} min</span>
            <span className="pill">{task.time_window}</span>
            {task.is_custom && <span className="pill pill-coral">Custom</span>}
          </div>

          {task.topic && (
            <div className="mb-5">
              <div className="t-label tertiary mb-2">Focus on</div>
              <p className="t-body-sm secondary">{task.topic}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={withClose(() => toggleTaskCompletedAction(task.id))}
              disabled={pending}
              className="btn btn-primary w-full"
            >
              <Check size={16} /> {done ? "Mark not done" : "Mark complete"}
            </button>
            <button type="button" className="btn btn-ghost w-full" disabled>
              <Play size={14} /> Start focus session (Phase 8)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={withClose(() => removeTaskAction(task.id, "backlog"))}
                disabled={pending}
                className="btn btn-text flex-1"
              >
                Move to backlog
              </button>
              <button
                type="button"
                onClick={withClose(() => removeTaskAction(task.id, "delete"))}
                disabled={pending}
                className="btn btn-text flex-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
