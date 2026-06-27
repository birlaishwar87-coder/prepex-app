"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, RefreshCw } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import type { Tables } from "@/lib/supabase/database.types";
import { CheckinModal } from "./components/checkin-modal";
import { TaskCard } from "./components/task-card";
import { TaskDetailModal } from "./components/task-detail-modal";
import { AddTaskModal } from "./components/add-task-modal";
import { RegenerateModal } from "./components/regenerate-modal";
import { FallbackBanner } from "./components/fallback-banner";
import {
  RevisionSession,
  type RevisionTarget,
} from "../revision/components/revision-session";

type Task = Tables<"tasks">;

interface TodayClientProps {
  firstName: string;
  daysToExam: number | null;
  planDate: string;
  isLateNight: boolean;
  plan: Tables<"daily_plans"> | null;
  tasks: Task[];
  checkinExists: boolean;
  checkinResponse: string | null;
  showDay2Explainer: boolean;
  fallback: boolean;
  fallbackReason: string | null;
  /** Map of chapter_id → user_topic_state.id, for routing revision tasks
   *  on the Daily Plan to the spaced-repetition session UX. */
  revisionTopicStateByChapter: Record<string, string>;
  /** chapter_id → chapter row (name, subject) for fast lookup. */
  chapterMetaById: Record<string, { name: string; subject: "physics" | "chemistry" | "maths" }>;
}

export function TodayClient({
  firstName,
  daysToExam,
  planDate,
  isLateNight,
  plan,
  tasks,
  checkinExists,
  checkinResponse,
  showDay2Explainer,
  fallback,
  fallbackReason,
  revisionTopicStateByChapter,
  chapterMetaById,
}: TodayClientProps) {
  // Show check-in modal automatically on first load if no checkin row exists.
  const [checkinOpen, setCheckinOpen] = useState(!checkinExists);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [revisionTarget, setRevisionTarget] = useState<RevisionTarget | null>(null);

  function onStartRevision(task: Task) {
    // Only route to RevisionSession if we have a topic_state for this chapter.
    if (!task.chapter_id) {
      setSelectedTask(task);
      return;
    }
    const topicStateId = revisionTopicStateByChapter[task.chapter_id];
    if (!topicStateId) {
      setSelectedTask(task);
      return;
    }
    const meta = chapterMetaById[task.chapter_id];
    setRevisionTarget({
      topicStateId,
      chapter: meta?.name ?? task.chapter ?? "Revision",
      subject: (meta?.subject as RevisionTarget["subject"]) ?? "revision",
      topic: task.topic ?? null,
      linkedTaskId: task.id,
    });
  }

  // If a revalidation closes the gap (server now has a checkin), close modal.
  useEffect(() => {
    if (checkinExists) setCheckinOpen(false);
  }, [checkinExists]);

  const done = tasks.filter((t) => t.status === "completed").length;
  const totalHours = (tasks.reduce((a, t) => a + (t.estimated_minutes ?? 0), 0) / 60).toFixed(1);

  // Friendly date string. Built manually to avoid SSR/client hydration
  // mismatch — toLocaleDateString(undefined, ...) infers locale from the
  // runtime (Node = en-US "Sat, Jun 27", browser = en-IN "Sat, 27 Jun").
  const planDateLabel = (() => {
    const d = new Date(planDate + "T12:00:00Z");
    const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  })();

  return (
    <>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">
            {isLateNight ? `Hey ${firstName}.` : `Good morning, ${firstName}.`}
          </h1>
          <div className="flex flex-wrap items-center gap-2.5 text-sm secondary">
            {daysToExam != null && (
              <span className="tabular">{daysToExam} days to JEE</span>
            )}
            {checkinResponse && (
              <Pill variant="coral">
                Feeling {checkinResponse} today
              </Pill>
            )}
          </div>
        </div>
        <Pill leftIcon={<Calendar size={12} />}>{planDateLabel}</Pill>
      </div>

      {fallback && <FallbackBanner reason={fallbackReason} />}

      {isLateNight && !plan && (
        <div
          className="glass mb-6"
          style={{
            padding: 24,
            background: "linear-gradient(135deg, rgba(76, 29, 149, 0.18), rgba(26, 26, 78, 0.30))",
            border: "1px solid rgba(76, 29, 149, 0.30)",
          }}
        >
          <h3 className="t-h4 mb-2">Setting you up for tomorrow.</h3>
          <p className="t-body-sm secondary">
            You signed up late. Today&apos;s mostly behind us. Let&apos;s make tomorrow count.
          </p>
        </div>
      )}

      {/* Plan header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="t-label coral">Today&apos;s plan</div>
          <h2 className="t-h3 mt-1">
            {tasks.length === 0
              ? "No plan yet"
              : `${tasks.length} tasks · ${totalHours}h`}
          </h2>
        </div>
        {tasks.length > 0 && (
          <span className="tabular text-[13px] secondary">
            {done}/{tasks.length} done
          </span>
        )}
      </div>

      {/* Empty state — covered by Phase 5's generate path. */}
      {tasks.length === 0 && !checkinOpen && (
        <div className="glass" style={{ padding: 28 }}>
          <p className="t-body-sm secondary">
            Tap the check-in icon up top to start your day. We&apos;ll build your plan from there.
          </p>
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={() => setCheckinOpen(true)}
          >
            Open check-in
          </button>
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onOpen={setSelectedTask}
              onStartRevision={onStartRevision}
            />
          ))}
        </div>
      )}

      {/* Bottom actions */}
      {plan && (
        <div className="mt-7 flex flex-wrap gap-2.5">
          <button type="button" className="btn btn-ghost" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Add custom task
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setRegenOpen(true)}>
            <RefreshCw size={14} /> Regenerate plan
          </button>
        </div>
      )}

      {/* Modals */}
      <CheckinModal
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        showDay2Explainer={showDay2Explainer}
      />
      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} />
      <RegenerateModal open={regenOpen} onClose={() => setRegenOpen(false)} />
      <RevisionSession target={revisionTarget} onClose={() => setRevisionTarget(null)} />
    </>
  );
}
