"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  addDaysISO,
  computeNextInterval,
  todayISO,
  type Difficulty,
} from "@/lib/revision/intervals";
import {
  shouldMaster,
  shouldUnmaster,
  type DifficultyHistoryEntry,
} from "@/lib/revision/transitions";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

type TopicState = Tables<"user_topic_state">;

// Type-safe wrapper (postgrest-js v2 `never`-inference workaround).
async function updateTopicState(id: string, patch: TablesUpdate<"user_topic_state">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("user_topic_state")
    .update(patch as never)
    .eq("id", id);
  return error;
}

async function updateTask(taskId: string, patch: TablesUpdate<"tasks">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("tasks").update(patch as never).eq("id", taskId);
  return error;
}

async function updateDailyPlan(planId: string, patch: TablesUpdate<"daily_plans">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("daily_plans").update(patch as never).eq("id", planId);
  return error;
}

async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// ============================================================
// Submit revision (PRD §2.2 + §2.5.2 + §2.3.2)
//
// Algorithm (locked):
//   1. Append { rating, today } to difficulty_history.
//   2. Compute next interval from current_interval_days + rating.
//   3. Compute next_revision_due = today + next interval.
//   4. Apply phase transition (mastered / un-mastered / stay).
//   5. Insert revision_sessions row.
//   6. If linked to a daily plan task: mark complete + update counters.
// ============================================================
export async function submitRevisionAction(args: {
  topicStateId: string;
  rating: Difficulty;
  durationSeconds?: number;
  /** Optional — when this revision was launched from a /today task. */
  taskId?: string | null;
}): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();
  const today = todayISO();

  // 1. Load current topic state.
  const { data: state } = await supabase
    .from("user_topic_state")
    .select("*")
    .eq("id", args.topicStateId)
    .eq("user_id", user.id)
    .maybeSingle<TopicState>();

  if (!state) return { error: "Topic not found" };

  // 2. Build new history.
  const rawHistory = Array.isArray(state.difficulty_history)
    ? (state.difficulty_history as unknown as DifficultyHistoryEntry[])
    : [];
  const newHistory: DifficultyHistoryEntry[] = [
    ...rawHistory,
    { rating: args.rating, date: today },
  ];

  // 3. Compute next interval + due date.
  const currentInterval = state.current_interval_days ?? 1;
  const nextInterval = computeNextInterval(currentInterval, args.rating);
  const nextDue = addDaysISO(today, nextInterval);

  // 4. Phase transition.
  let nextPhase: Database["public"]["Enums"]["topic_phase_t"] = state.phase;
  if (state.phase === "in_revision") {
    if (
      shouldMaster({
        historyAfterThisRating: newHistory,
        firstStudiedAt: state.first_studied_at,
        today,
      })
    ) {
      nextPhase = "mastered";
    }
  } else if (state.phase === "mastered") {
    if (shouldUnmaster(args.rating)) {
      nextPhase = "in_revision";
    }
  }

  // 5. Update topic state.
  const updateErr = await updateTopicState(state.id, {
    phase: nextPhase,
    last_revised_at: new Date().toISOString(),
    next_revision_due: nextDue,
    current_interval_days: nextInterval,
    latest_difficulty_rating: args.rating,
    difficulty_history: newHistory as never,
    revision_count: (state.revision_count ?? 0) + 1,
  });
  if (updateErr) return { error: updateErr.message };

  // 6. Append to revision_sessions.
  const sessionRow: TablesInsert<"revision_sessions"> = {
    user_id: user.id,
    topic_state_id: state.id,
    task_id: args.taskId ?? null,
    difficulty_rating: args.rating,
    duration_seconds: args.durationSeconds ?? null,
    skipped: false,
  };
  const { error: sessionErr } = await supabase
    .from("revision_sessions")
    .insert(sessionRow as never);
  if (sessionErr) return { error: sessionErr.message };

  // 7. If launched from a /today task, mark it complete + update plan counters.
  if (args.taskId) {
    const { data: task } = await supabase
      .from("tasks")
      .select("id, status, estimated_minutes, plan_id")
      .eq("id", args.taskId)
      .eq("user_id", user.id)
      .maybeSingle<{
        id: string;
        status: Database["public"]["Enums"]["task_status_t"] | null;
        estimated_minutes: number;
        plan_id: string | null;
      }>();

    if (task && task.status !== "completed") {
      await updateTask(task.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        difficulty_rating: args.rating,
      });
      if (task.plan_id) {
        const { data: plan } = await supabase
          .from("daily_plans")
          .select("id, completed_tasks, completed_minutes")
          .eq("id", task.plan_id)
          .maybeSingle<{
            id: string;
            completed_tasks: number | null;
            completed_minutes: number | null;
          }>();
        if (plan) {
          await updateDailyPlan(plan.id, {
            completed_tasks: (plan.completed_tasks ?? 0) + 1,
            completed_minutes:
              (plan.completed_minutes ?? 0) + (task.estimated_minutes ?? 0),
          });
        }
      }
    }
  }

  revalidatePath("/today");
  revalidatePath("/revision");
  return { error: null };
}

// ============================================================
// Skip revision → moves to backlog (PRD §2.5.3)
//
// Behavior locked:
//   • Insert a revision_sessions row with skipped=true (so the pattern
//     "skipped 3+ times" can be detected later for Disengagement signal).
//   • Insert backlog_items row with priority_weight 1.0 (state='active').
//   • Don't change next_revision_due — it stays where it is; the topic
//     remains visibly overdue until completed.
// ============================================================
export async function skipRevisionAction(args: {
  topicStateId: string;
  taskId?: string | null;
}): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();
  const today = todayISO();

  // Need the chapter info for the backlog row.
  const { data: state } = await supabase
    .from("user_topic_state")
    .select("id, chapter_id, topic, chapters(name, subject)")
    .eq("id", args.topicStateId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      chapter_id: string;
      topic: string | null;
      chapters: { name: string; subject: "physics" | "chemistry" | "maths" } | null;
    }>();

  if (!state) return { error: "Topic not found" };

  // Log skipped session.
  const sessionRow: TablesInsert<"revision_sessions"> = {
    user_id: user.id,
    topic_state_id: state.id,
    task_id: args.taskId ?? null,
    difficulty_rating: null,
    duration_seconds: null,
    skipped: true,
  };
  const { error: sessionErr } = await supabase
    .from("revision_sessions")
    .insert(sessionRow as never);
  if (sessionErr) return { error: sessionErr.message };

  // Add to backlog with full priority (weight 1.0). The decay formula
  // (PRD §11.2) recomputes weight on every read — we just set the
  // anchor dates.
  const backlogRow: TablesInsert<"backlog_items"> = {
    user_id: user.id,
    task_id: args.taskId ?? null,
    subject: state.chapters?.subject ?? "revision",
    chapter_id: state.chapter_id,
    chapter: state.chapters?.name ?? null,
    topic: state.topic,
    task_type: "revision",
    estimated_minutes: 20,
    original_date: today,
    last_reviewed_at: today,
    state: "active",
    priority: "normal",
    source: "skipped_revision",
  };
  const { error: backlogErr } = await supabase
    .from("backlog_items")
    .insert(backlogRow as never);
  if (backlogErr) return { error: backlogErr.message };

  revalidatePath("/today");
  revalidatePath("/revision");
  return { error: null };
}
