"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Database,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

type TimerMode = Database["public"]["Enums"]["focus_timer_mode_t"];
type SessionType = Database["public"]["Enums"]["focus_session_type_t"];
type Subject = Database["public"]["Enums"]["subject_t"];
type TerminatedReason = Database["public"]["Enums"]["focus_terminated_t"];
type Difficulty = Database["public"]["Enums"]["difficulty_t"];

// Postgrest v2 returns `never` for update arg — `as never` cast keeps
// TablesUpdate<...> type-safety at the call site (same trick used elsewhere).
async function updateSession(id: string, patch: TablesUpdate<"focus_sessions">) {
  const supabase = getSupabaseServerClient();
  return supabase
    .from("focus_sessions")
    .update(patch as never)
    .eq("id", id);
}

async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return { supabase, user };
}

// ============================================================
// Start session (PRD §15.1 — setup screen submit)
// ============================================================
export interface StartFocusInput {
  mode: TimerMode;
  /** Optional task to link this session to (Daily Plan integration). */
  taskId?: string | null;
  /** Free-form context — pre-filled from the linked task when available. */
  subject?: Subject | null;
  chapter?: string | null;
  topic?: string | null;
  /** For pomodoro_* modes, derived from the mode. For custom, user picks. */
  durationSec?: number | null;
  /** Optional sub-goals the student wants to tick off during the session. */
  milestones?: string[];
}

export type StartFocusResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string };

const DEFAULT_DURATIONS: Record<TimerMode, number | null> = {
  stopwatch: null,
  pomodoro_25: 25 * 60,
  pomodoro_45: 45 * 60,
  pomodoro_60: 60 * 60,
  custom: null,
};

export async function startFocusSessionAction(
  input: StartFocusInput
): Promise<StartFocusResult> {
  const { supabase, user } = await requireUser();

  // If a task is linked, hydrate context from it so the session row
  // captures subject/chapter/topic/task_type even if the client didn't
  // pass them. Also locks the session to the actual task row at start.
  let sessionType: SessionType = input.taskId ? "plan_linked" : "quick_focus";
  let subject = input.subject ?? null;
  let chapter = input.chapter ?? null;
  let topic = input.topic ?? null;
  let taskType: Database["public"]["Enums"]["task_type_t"] | null = null;

  if (input.taskId) {
    const { data: task } = await supabase
      .from("tasks")
      .select("subject, chapter, topic, task_type")
      .eq("id", input.taskId)
      .eq("user_id", user.id)
      .maybeSingle<{
        subject: Subject;
        chapter: string | null;
        topic: string | null;
        task_type: Database["public"]["Enums"]["task_type_t"];
      }>();
    if (task) {
      subject = subject ?? task.subject;
      chapter = chapter ?? task.chapter;
      topic = topic ?? task.topic;
      taskType = task.task_type;
    } else {
      // Task vanished (deleted) — treat as quick focus.
      sessionType = "quick_focus";
    }
  }

  const planned = input.durationSec ?? DEFAULT_DURATIONS[input.mode];
  const milestones = (input.milestones ?? []).filter((m) => m.trim().length > 0);

  const row: TablesInsert<"focus_sessions"> = {
    user_id: user.id,
    linked_task_id: sessionType === "plan_linked" ? input.taskId ?? null : null,
    session_type: sessionType,
    subject,
    chapter,
    topic,
    task_type: taskType,
    timer_mode: input.mode,
    planned_duration_sec: planned,
    actual_duration_sec: 0,
    background_seconds: 0,
    milestones: milestones.map((label, i) => ({ id: i + 1, label, done: false })),
    completed_milestone_count: 0,
    total_milestone_count: milestones.length,
  };

  const { data: session, error } = await supabase
    .from("focus_sessions")
    .insert(row as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !session) {
    return { ok: false, error: error?.message ?? "Couldn't start session" };
  }
  return { ok: true, sessionId: session.id };
}

// ============================================================
// Toggle a milestone mid-session (optimistic on client, persisted here)
// ============================================================
export async function toggleMilestoneAction(args: {
  sessionId: string;
  milestoneId: number;
  done: boolean;
}): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  const { data: session } = await supabase
    .from("focus_sessions")
    .select("milestones")
    .eq("id", args.sessionId)
    .eq("user_id", user.id)
    .maybeSingle<{ milestones: Array<{ id: number; label: string; done: boolean }> | null }>();
  if (!session) return { error: "Session not found" };

  const next = (session.milestones ?? []).map((m) =>
    m.id === args.milestoneId ? { ...m, done: args.done } : m
  );
  const completed = next.filter((m) => m.done).length;

  const { error } = await updateSession(args.sessionId, {
    milestones: next,
    completed_milestone_count: completed,
    total_milestone_count: next.length,
  });
  if (error) return { error: error.message };
  return { error: null };
}

// ============================================================
// Complete session — natural end (timer hit 0 or stopwatch ended)
// ============================================================
export async function completeFocusSessionAction(args: {
  sessionId: string;
  actualDurationSec: number;
  backgroundSeconds?: number;
}): Promise<{ error: string | null }> {
  const { error } = await updateSession(args.sessionId, {
    actual_duration_sec: Math.max(0, Math.round(args.actualDurationSec)),
    background_seconds: Math.max(0, Math.round(args.backgroundSeconds ?? 0)),
    terminated_reason: "completed",
    ended_at: new Date().toISOString(),
  });
  revalidatePath("/today");
  if (error) return { error: error.message };
  return { error: null };
}

// ============================================================
// Terminate early — user clicked "End session" or moved to background too long
// ============================================================
export async function terminateFocusSessionAction(args: {
  sessionId: string;
  actualDurationSec: number;
  reason: TerminatedReason;
  backgroundSeconds?: number;
}): Promise<{ error: string | null }> {
  const { error } = await updateSession(args.sessionId, {
    actual_duration_sec: Math.max(0, Math.round(args.actualDurationSec)),
    background_seconds: Math.max(0, Math.round(args.backgroundSeconds ?? 0)),
    terminated_reason: args.reason,
    ended_at: new Date().toISOString(),
  });
  revalidatePath("/today");
  if (error) return { error: error.message };
  return { error: null };
}

// ============================================================
// Post-session rating (PRD §15.4 — recap screen)
// ============================================================
export async function rateFocusSessionAction(args: {
  sessionId: string;
  rating: Difficulty;
  notes?: string | null;
  /** When true, also mark the linked Daily Plan task as completed. */
  markTaskComplete?: boolean;
}): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  const { error: updErr } = await updateSession(args.sessionId, {
    difficulty_rating: args.rating,
    session_notes: args.notes?.trim() ?? null,
  });
  if (updErr) return { error: updErr.message };

  if (args.markTaskComplete) {
    const { data: session } = await supabase
      .from("focus_sessions")
      .select("linked_task_id")
      .eq("id", args.sessionId)
      .eq("user_id", user.id)
      .maybeSingle<{ linked_task_id: string | null }>();
    if (session?.linked_task_id) {
      await supabase
        .from("tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() } as never)
        .eq("id", session.linked_task_id);
    }
  }

  revalidatePath("/today");
  return { error: null };
}

export type { Difficulty, SessionType, Subject, TerminatedReason, TimerMode };
