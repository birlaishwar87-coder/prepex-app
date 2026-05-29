"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateDailyPlan } from "@/lib/groq/generate-plan";
import { getCurrentPlanDate, getFirstPlanDate } from "@/lib/utils/day-boundary";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

type CheckinResponse = Database["public"]["Enums"]["checkin_response_t"];
type Subject = Database["public"]["Enums"]["subject_t"];
type TaskType = Database["public"]["Enums"]["task_type_t"];
type TimeWindow = Database["public"]["Enums"]["time_window_t"];

// ============================================================
// Helpers
// ============================================================

// Type-safe wrapper that survives the postgrest-js v2 "never" inference glitch.
// Same pattern as the onboarding helper.
async function updateProfile(userId: string, patch: TablesUpdate<"profiles">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("profiles").update(patch as never).eq("id", userId);
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

async function resolvePlanDate(userId: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("day_boundary_time, timezone, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle<
      Pick<Tables<"profiles">, "day_boundary_time" | "timezone" | "onboarding_completed_at">
    >();
  if (!profile) throw new Error("Profile not found");

  const { count: priorPlans } = await supabase
    .from("daily_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((priorPlans ?? 0) === 0) {
    return getFirstPlanDate(profile).planDate;
  }
  return getCurrentPlanDate(profile);
}

// ============================================================
// Check-in (PRD §3)
// ============================================================
export type CheckinState = { error: string | null };
const checkinInitial: CheckinState = { error: null };
void checkinInitial; // exported via type only

const VALID_RESPONSES: CheckinResponse[] = ["drained", "heavy", "steady", "good", "strong"];

export async function submitCheckinAction(
  _prev: CheckinState,
  formData: FormData
): Promise<CheckinState> {
  const { supabase, user } = await requireUser();
  const skipped = formData.get("skipped") === "true";
  const responseRaw = formData.get("response") as string | null;
  const response: CheckinResponse | null =
    !skipped && responseRaw && VALID_RESPONSES.includes(responseRaw as CheckinResponse)
      ? (responseRaw as CheckinResponse)
      : null;

  if (!skipped && !response) {
    return { error: "Pick how you're feeling, or tap Skip." };
  }

  const planDate = await resolvePlanDate(user.id);

  const row: TablesInsert<"daily_checkins"> = {
    user_id: user.id,
    checkin_date: planDate,
    response,
    skipped,
  };
  const { error: upsertError } = await supabase
    .from("daily_checkins")
    .upsert(row as never, { onConflict: "user_id,checkin_date" });
  if (upsertError) return { error: upsertError.message };

  // First app open of the day with no plan yet → generate now with the
  // check-in context baked in. PRD §3.2.1: check-in loads first; plan
  // adapts. We deliberately don't auto-regen later same-day check-in
  // changes — it's disruptive. User can hit Regenerate if they want.
  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle<{ id: string }>();

  if (!existingPlan) {
    const result = await generateDailyPlan({ userId: user.id, planDate });
    if (!result.ok) {
      // Check-in still saved; plan failed. Surface a soft message.
      revalidatePath("/today");
      return { error: result.error };
    }
  }

  revalidatePath("/today");
  return { error: null };
}

// ============================================================
// Task completion (PRD §1.3 + streak increment PRD §10)
// ============================================================
export async function toggleTaskCompletedAction(taskId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  // Fetch task + parent plan so we know how to update counters.
  const { data: task } = await supabase
    .from("tasks")
    .select("id, status, estimated_minutes, plan_id, user_id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      status: Database["public"]["Enums"]["task_status_t"] | null;
      estimated_minutes: number;
      plan_id: string | null;
      user_id: string;
    }>();

  if (!task) return { error: "Task not found" };

  const wasCompleted = task.status === "completed";
  const nextStatus = wasCompleted ? "pending" : "completed";

  const taskErr = await updateTask(taskId, {
    status: nextStatus,
    completed_at: wasCompleted ? null : new Date().toISOString(),
  });
  if (taskErr) return { error: taskErr.message };

  if (task.plan_id) {
    const delta = wasCompleted ? -1 : 1;
    const minutesDelta = (wasCompleted ? -1 : 1) * (task.estimated_minutes ?? 0);
    const { data: plan } = await supabase
      .from("daily_plans")
      .select("id, completed_tasks, completed_minutes")
      .eq("id", task.plan_id)
      .maybeSingle<{ id: string; completed_tasks: number | null; completed_minutes: number | null }>();
    if (plan) {
      const before = plan.completed_tasks ?? 0;
      const after = Math.max(0, before + delta);
      await updateDailyPlan(plan.id, {
        completed_tasks: after,
        completed_minutes: Math.max(0, (plan.completed_minutes ?? 0) + minutesDelta),
        status: "active", // even if all done, keep active until day ends
      });

      // Streak qualification (V1 simplified): first completed task of the
      // day bumps the streak. We never decrement on uncheck — that would
      // surprise the student.
      if (!wasCompleted && before === 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("streak_count, best_streak")
          .eq("id", user.id)
          .maybeSingle<{ streak_count: number | null; best_streak: number | null }>();
        if (profile) {
          const next = (profile.streak_count ?? 0) + 1;
          await updateProfile(user.id, {
            streak_count: next,
            best_streak: Math.max(profile.best_streak ?? 0, next),
          });
        }
      }
    }
  }

  revalidatePath("/today");
  return { error: null };
}

// ============================================================
// Regenerate plan with reason capture (PRD §1.3.4)
// ============================================================
export type RegenerateState = { error: string | null; fallback?: boolean };
export const regenerateInitial: RegenerateState = { error: null };

export async function regeneratePlanAction(
  _prev: RegenerateState,
  formData: FormData
): Promise<RegenerateState> {
  const { user } = await requireUser();
  const reason = (formData.get("reason") as string | null) ?? null;

  const result = await generateDailyPlan({
    userId: user.id,
    regenerate: true,
    reason,
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/today");
  return {
    error: null,
    fallback: "fallback" in result && result.fallback,
  };
}

// ============================================================
// Add custom task (PRD §1.4.2)
// ============================================================
export type AddTaskState = { error: string | null };
export const addTaskInitial: AddTaskState = { error: null };

const VALID_SUBJECTS: Subject[] = ["physics", "chemistry", "maths", "revision", "wellness"];
const VALID_TASK_TYPES: TaskType[] = [
  "new_learning",
  "revision",
  "practice",
  "dpp",
  "mock_review",
  "wellness",
];
const VALID_WINDOWS: TimeWindow[] = ["morning", "midday", "evening", "night", "anytime"];

export async function addCustomTaskAction(
  _prev: AddTaskState,
  formData: FormData
): Promise<AddTaskState> {
  const { supabase, user } = await requireUser();
  const planDate = await resolvePlanDate(user.id);

  const subject = formData.get("subject") as string;
  const chapter = ((formData.get("chapter") as string | null) ?? "").trim() || null;
  const topic = ((formData.get("topic") as string | null) ?? "").trim() || null;
  const taskType = formData.get("task_type") as string;
  const duration = parseInt((formData.get("duration") as string) || "30", 10);
  const timeWindow = formData.get("time_window") as string;

  if (!VALID_SUBJECTS.includes(subject as Subject)) return { error: "Pick a subject." };
  if (!VALID_TASK_TYPES.includes(taskType as TaskType)) return { error: "Pick a task type." };
  if (!VALID_WINDOWS.includes(timeWindow as TimeWindow)) return { error: "Pick a time slot." };
  if (Number.isNaN(duration) || duration < 5 || duration > 240) {
    return { error: "Duration must be 5–240 minutes." };
  }

  const { data: plan } = await supabase
    .from("daily_plans")
    .select("id, total_tasks, total_minutes")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle<{ id: string; total_tasks: number | null; total_minutes: number | null }>();

  // task_order = current max + 1
  let taskOrder = 0;
  if (plan) {
    const { data: lastTask } = await supabase
      .from("tasks")
      .select("task_order")
      .eq("plan_id", plan.id)
      .order("task_order", { ascending: false })
      .limit(1)
      .maybeSingle<{ task_order: number | null }>();
    taskOrder = (lastTask?.task_order ?? -1) + 1;
  }

  const taskRow: TablesInsert<"tasks"> = {
    user_id: user.id,
    plan_id: plan?.id ?? null,
    task_order: taskOrder,
    subject: subject as Subject,
    chapter,
    topic,
    task_type: taskType as TaskType,
    estimated_minutes: duration,
    time_window: timeWindow as TimeWindow,
    is_custom: true,
    is_anchor: false,
    source: "user",
    status: "pending",
  };
  const { error } = await supabase.from("tasks").insert(taskRow as never);
  if (error) return { error: error.message };

  if (plan) {
    await updateDailyPlan(plan.id, {
      total_tasks: (plan.total_tasks ?? 0) + 1,
      total_minutes: (plan.total_minutes ?? 0) + duration,
    });
  }

  revalidatePath("/today");
  return { error: null };
}

// ============================================================
// Remove task — delete OR move to backlog (PRD §1.4.3)
// ============================================================
export async function removeTaskAction(
  taskId: string,
  mode: "delete" | "backlog"
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .maybeSingle<Tables<"tasks">>();
  if (!task) return { error: "Task not found" };

  if (mode === "backlog") {
    const planDate = await resolvePlanDate(user.id);
    const backlogRow: TablesInsert<"backlog_items"> = {
      user_id: user.id,
      task_id: task.id,
      subject: task.subject,
      chapter_id: task.chapter_id,
      chapter: task.chapter,
      topic: task.topic,
      task_type: task.task_type,
      estimated_minutes: task.estimated_minutes,
      original_date: planDate,
      last_reviewed_at: planDate,
      state: "active",
      priority: "normal",
      source: task.source ?? "user",
    };
    const { error: backlogErr } = await supabase.from("backlog_items").insert(backlogRow as never);
    if (backlogErr) return { error: backlogErr.message };
  }

  const { error: deleteErr } = await supabase.from("tasks").delete().eq("id", taskId);
  if (deleteErr) return { error: deleteErr.message };

  // Decrement plan counters.
  if (task.plan_id) {
    const { data: plan } = await supabase
      .from("daily_plans")
      .select("id, total_tasks, total_minutes")
      .eq("id", task.plan_id)
      .maybeSingle<{ id: string; total_tasks: number | null; total_minutes: number | null }>();
    if (plan) {
      await updateDailyPlan(plan.id, {
        total_tasks: Math.max(0, (plan.total_tasks ?? 0) - 1),
        total_minutes: Math.max(0, (plan.total_minutes ?? 0) - (task.estimated_minutes ?? 0)),
      });
    }
  }

  revalidatePath("/today");
  return { error: null };
}

// ============================================================
// Acknowledge Bad Day welcome (PRD §4.3.2)
// ============================================================
export async function acknowledgeBadDayAction(): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  // Mark the most recent unseen welcome as seen.
  const { data: row } = await supabase
    .from("bad_day_protocols")
    .select("id")
    .eq("user_id", user.id)
    .eq("welcome_seen", false)
    .order("triggered_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (row) {
    const { error } = await supabase
      .from("bad_day_protocols")
      .update({ welcome_seen: true } as never)
      .eq("id", row.id);
    if (error) return { error: error.message };
  }

  // After acknowledging, ensure a plan exists.
  const planDate = await resolvePlanDate(user.id);
  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle<{ id: string }>();

  if (!existingPlan) {
    const result = await generateDailyPlan({ userId: user.id, planDate });
    if (!result.ok) return { error: result.error };
  }

  revalidatePath("/today");
  return { error: null };
}
