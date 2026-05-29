"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPlanDate, getFirstPlanDate } from "@/lib/utils/day-boundary";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

type Subject = Database["public"]["Enums"]["subject_t"];
type BacklogPriority = Database["public"]["Enums"]["backlog_priority_t"];

// postgrest-js v2 `never`-inference workaround helpers
async function updateBacklog(id: string, patch: TablesUpdate<"backlog_items">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("backlog_items")
    .update(patch as never)
    .eq("id", id);
  return error;
}

async function updateRecovery(id: string, patch: TablesUpdate<"recovery_modes">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("recovery_modes")
    .update(patch as never)
    .eq("id", id);
  return error;
}

async function updateDailyPlan(planId: string, patch: TablesUpdate<"daily_plans">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("daily_plans")
    .update(patch as never)
    .eq("id", planId);
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

  if ((priorPlans ?? 0) === 0) return getFirstPlanDate(profile).planDate;
  return getCurrentPlanDate(profile);
}

// ============================================================
// Manual add (PRD §11.6)
// Accepts an array of { chapterId, priority } — one row per chapter.
// Idempotent within a session — re-adding the same chapter just
// resets last_reviewed_at + priority.
// ============================================================
export type AddBacklogInput = {
  items: Array<{ chapterId: string; priority: BacklogPriority }>;
};

export async function addBacklogItemsAction(
  input: AddBacklogInput
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();
  if (input.items.length === 0) return { error: null };

  const today = await resolvePlanDate(user.id);

  // Fetch chapter metadata for the rows.
  const chapterIds = input.items.map((i) => i.chapterId);
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name, subject")
    .in("id", chapterIds)
    .returns<Array<{ id: string; name: string; subject: "physics" | "chemistry" | "maths" }>>();

  const chapterById = new Map(chapters?.map((c) => [c.id, c]) ?? []);

  const rows: TablesInsert<"backlog_items">[] = input.items.flatMap((it) => {
    const chapter = chapterById.get(it.chapterId);
    if (!chapter) return [];
    return [
      {
        user_id: user.id,
        chapter_id: chapter.id,
        chapter: chapter.name,
        subject: chapter.subject as Subject,
        task_type: "new_learning",
        estimated_minutes: 45,
        original_date: today,
        last_reviewed_at: today,
        state: "user_added",
        priority: it.priority,
        source: "manual_add",
      },
    ];
  });

  if (rows.length === 0) return { error: "No valid chapters selected." };

  const { error } = await supabase.from("backlog_items").insert(rows as never);
  if (error) return { error: error.message };

  revalidatePath("/backlog");
  revalidatePath("/today");
  return { error: null };
}

// ============================================================
// Hold (PRD §11)
// Move item to state='held' and stamp held_since. The 7-day nudge
// (PRD §11.7) is rendered by /backlog on read.
// ============================================================
export async function holdBacklogItemAction(
  itemId: string
): Promise<{ error: string | null }> {
  const { user } = await requireUser();
  const err = await updateBacklog(itemId, {
    state: "held",
    held_since: new Date().toISOString(),
    nudge_sent: false,
  });
  void user;
  if (err) return { error: err.message };
  revalidatePath("/backlog");
  return { error: null };
}

// ============================================================
// Resume from held → back to 'active' and reset last_reviewed_at
// so the priority weight is fresh.
// ============================================================
export async function resumeBacklogItemAction(
  itemId: string
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();
  const today = await resolvePlanDate(user.id);
  void supabase;
  const err = await updateBacklog(itemId, {
    state: "active",
    held_since: null,
    nudge_sent: false,
    last_reviewed_at: today,
  });
  if (err) return { error: err.message };
  revalidatePath("/backlog");
  return { error: null };
}

// ============================================================
// Skip permanently — delete the row.
// PRD §11 — students can clear items they no longer want.
// ============================================================
export async function skipBacklogItemAction(
  itemId: string
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("backlog_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/backlog");
  return { error: null };
}

// ============================================================
// Add to today's plan as a task — sets state='redistributed' so
// it no longer shows up on /backlog.
// ============================================================
export async function addBacklogToTodayPlanAction(
  itemId: string
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  const { data: item } = await supabase
    .from("backlog_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle<Tables<"backlog_items">>();
  if (!item) return { error: "Item not found" };

  const planDate = await resolvePlanDate(user.id);
  const { data: plan } = await supabase
    .from("daily_plans")
    .select("id, total_tasks, total_minutes")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle<{
      id: string;
      total_tasks: number | null;
      total_minutes: number | null;
    }>();

  if (!plan) return { error: "No plan today yet — open /today first." };

  // Find next task_order.
  const { data: lastTask } = await supabase
    .from("tasks")
    .select("task_order")
    .eq("plan_id", plan.id)
    .order("task_order", { ascending: false })
    .limit(1)
    .maybeSingle<{ task_order: number | null }>();

  const taskRow: TablesInsert<"tasks"> = {
    user_id: user.id,
    plan_id: plan.id,
    task_order: (lastTask?.task_order ?? -1) + 1,
    subject: item.subject,
    chapter_id: item.chapter_id,
    chapter: item.chapter,
    topic: item.topic,
    task_type: item.task_type ?? "new_learning",
    estimated_minutes: item.estimated_minutes ?? 45,
    time_window: "anytime",
    is_anchor: false,
    is_custom: false,
    is_backlog: true,
    source: "backlog_redistribution",
    status: "pending",
  };

  const { error: taskErr } = await supabase.from("tasks").insert(taskRow as never);
  if (taskErr) return { error: taskErr.message };

  // Mark the backlog item as redistributed (preserves history; doesn't delete).
  const upd = await updateBacklog(item.id, { state: "redistributed" });
  if (upd) return { error: upd.message };

  // Bump plan counters.
  await updateDailyPlan(plan.id, {
    total_tasks: (plan.total_tasks ?? 0) + 1,
    total_minutes: (plan.total_minutes ?? 0) + (item.estimated_minutes ?? 45),
  });

  revalidatePath("/backlog");
  revalidatePath("/today");
  return { error: null };
}

// ============================================================
// Acknowledge held-nudge (PRD §11.7) — one-time, marks nudge_sent.
// ============================================================
export async function acknowledgeHeldNudgeAction(
  itemId: string
): Promise<{ error: string | null }> {
  const err = await updateBacklog(itemId, { nudge_sent: true });
  if (err) return { error: err.message };
  revalidatePath("/backlog");
  return { error: null };
}

// ============================================================
// Recovery Mode — student-initiated only (PRD §11.5)
// Activates 50/30/20 split via system prompt rule 3a.
// ============================================================
export async function enterBacklogRecoveryAction(): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  // Don't double-enter.
  const { data: existing } = await supabase
    .from("recovery_modes")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "backlog")
    .eq("active", true)
    .maybeSingle<{ id: string }>();
  if (existing) return { error: null };

  const row: TablesInsert<"recovery_modes"> = {
    user_id: user.id,
    type: "backlog",
    active: true,
    duration_days: 7,
  };
  const { error } = await supabase.from("recovery_modes").insert(row as never);
  if (error) return { error: error.message };

  revalidatePath("/backlog");
  revalidatePath("/today");
  return { error: null };
}

export async function exitBacklogRecoveryAction(): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();
  const { data: existing } = await supabase
    .from("recovery_modes")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "backlog")
    .eq("active", true)
    .maybeSingle<{ id: string }>();
  if (!existing) return { error: null };

  const err = await updateRecovery(existing.id, {
    active: false,
    ended_at: new Date().toISOString(),
    end_reason: "student_ended",
  });
  if (err) return { error: err.message };

  revalidatePath("/backlog");
  revalidatePath("/today");
  return { error: null };
}
