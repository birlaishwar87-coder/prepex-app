"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

// ============================================================
// Types — mirror the 7-step shape of the wizard
// ============================================================
type Goal = Database["public"]["Enums"]["goal_type"];
type Cls = Database["public"]["Enums"]["class_type"];
type CoachType = Database["public"]["Enums"]["coach_type"];
type TimeWindow = Database["public"]["Enums"]["time_window_t"];

export type GoalInput = { goal: Goal };
export type ExamInput = { examDate: string | null; currentClass: Cls };
export type CoachingInput = {
  coachType: CoachType;
  coachingName?: string | null;
  batch?: string | null;
};
export type HoursInput = {
  hoursWeekday: number;
  hoursWeekend: number;
  sameDailyTarget: boolean;
  windows: TimeWindow[];
};
// chapterIds: only valid chapter UUIDs from the seeded master list.
export type TopicsInput = { chapterIds: string[] };

// ============================================================
// Helpers
// ============================================================
function deriveChronotype(windows: TimeWindow[]) {
  const hasMorning = windows.includes("morning");
  const hasNight = windows.includes("night");
  if (hasNight && !hasMorning) return { chronotype: "night" as const, dayBoundary: "12:00:00" };
  if (hasMorning && !hasNight) return { chronotype: "day" as const, dayBoundary: "05:00:00" };
  return { chronotype: "mixed" as const, dayBoundary: "06:00:00" };
}

async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return { supabase, user };
}

// Profile update goes through this helper to (a) keep type-safety with
// TablesUpdate<'profiles'> at the call-sites and (b) work around a known
// postgrest-js v2.x generic-inference glitch where chained .update()
// resolves the parameter to `never`. The `as never` cast is the standard
// community workaround; the explicit `TablesUpdate<'profiles'>` annotation
// in callers preserves real type-checking on the payload shape.
async function updateProfile(userId: string, patch: TablesUpdate<"profiles">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update(patch as never)
    .eq("id", userId);
  return error;
}

// ============================================================
// Step 2 — Goal
// ============================================================
export async function saveGoalAction(input: GoalInput) {
  const { user } = await requireUser();
  const err = await updateProfile(user.id, {
    goal: input.goal,
    onboarding_current_step: 3,
  });
  if (err) return { error: err.message };
  return { error: null as string | null };
}

// ============================================================
// Step 3 — Exam date + class
// ============================================================
export async function saveExamAction(input: ExamInput) {
  const { user } = await requireUser();
  const err = await updateProfile(user.id, {
    exam_date: input.examDate,
    current_class: input.currentClass,
    onboarding_current_step: 4,
  });
  if (err) return { error: err.message };
  return { error: null as string | null };
}

// ============================================================
// Step 4 — Coaching
// ============================================================
export async function saveCoachingAction(input: CoachingInput) {
  const { user } = await requireUser();
  const err = await updateProfile(user.id, {
    coach_type: input.coachType,
    coaching_name: input.coachType === "yes" ? input.coachingName ?? null : null,
    batch: input.coachType === "yes" ? input.batch ?? null : null,
    onboarding_current_step: 5,
  });
  if (err) return { error: err.message };
  return { error: null as string | null };
}

// ============================================================
// Step 5 — Hours + time windows + derived chronotype/day_boundary
// ============================================================
export async function saveHoursAction(input: HoursInput) {
  const { user } = await requireUser();

  const weekday = Math.max(0, Math.min(24, Math.round(input.hoursWeekday)));
  const weekend = Math.max(0, Math.min(24, Math.round(input.hoursWeekend)));

  // Default to midday + evening if user picked nothing (PRD §1.0.5 default).
  const windows: TimeWindow[] =
    input.windows.length > 0 ? input.windows : ["midday", "evening"];
  const { chronotype, dayBoundary } = deriveChronotype(windows);

  const err = await updateProfile(user.id, {
    daily_hours_weekday: weekday,
    daily_hours_weekend: input.sameDailyTarget ? weekday : weekend,
    same_daily_target: input.sameDailyTarget,
    time_windows: windows,
    chronotype,
    day_boundary_time: dayBoundary,
    onboarding_current_step: 6,
  });
  if (err) return { error: err.message };
  return { error: null as string | null };
}

// ============================================================
// Step 6 — Topics studied (the big one)
// Seeds user_topic_state rows with onboarding_marked=true and
// next_revision_due = today + 7d (PRD §2.2.3 locked logic).
// ============================================================
export async function saveTopicsAction(input: TopicsInput) {
  const { supabase, user } = await requireUser();

  if (input.chapterIds.length > 0) {
    const sevenDaysOut = new Date();
    sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
    const due = sevenDaysOut.toISOString().slice(0, 10);
    const now = new Date().toISOString();

    const rows: TablesInsert<"user_topic_state">[] = input.chapterIds.map((chapterId) => ({
      user_id: user.id,
      chapter_id: chapterId,
      phase: "in_revision",
      first_studied_at: now,
      next_revision_due: due,
      current_interval_days: 7,
      onboarding_marked: true,
    }));

    // ON CONFLICT (user_id, chapter_id, topic): the unique constraint on
    // user_topic_state. Re-running this step idempotently does nothing.
    const { error } = await supabase
      .from("user_topic_state")
      .upsert(rows as never, { onConflict: "user_id,chapter_id,topic", ignoreDuplicates: true });
    if (error) return { error: error.message };
  }

  const err = await updateProfile(user.id, { onboarding_current_step: 7 });
  if (err) return { error: err.message };

  return { error: null as string | null };
}

// ============================================================
// Step 7 — Finalize. Set onboarding_completed_at, redirect to /today.
// Late-night signup behavior (PRD §1.0.4) is handled in Phase 5
// at plan-generation time: it reads onboarding_completed_at vs
// day_boundary_time to decide between today's plan and tomorrow's.
// ============================================================
export async function completeOnboardingAction() {
  const { user } = await requireUser();
  const err = await updateProfile(user.id, {
    onboarding_completed_at: new Date().toISOString(),
    onboarding_current_step: 7,
  });
  if (err) return { error: err.message };
  redirect("/today");
}
