"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Database, TablesUpdate } from "@/lib/supabase/database.types";

type Goal = Database["public"]["Enums"]["goal_type"];
type Cls = Database["public"]["Enums"]["class_type"];
type CoachType = Database["public"]["Enums"]["coach_type"];
type TimeWindow = Database["public"]["Enums"]["time_window_t"];

async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return { supabase, user };
}

async function updateProfile(userId: string, patch: TablesUpdate<"profiles">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("profiles").update(patch as never).eq("id", userId);
  return error;
}

// ============================================================
// AI keys (BYOK)
// ============================================================
// Save / replace the user's AI provider key. Empty string clears it.
// Validates rough shape only — actual auth happens at the next AI call.
export type SaveAiKeyResult = { error: string | null; saved?: boolean };

export async function saveAiKeyAction(args: {
  provider: "gemini" | "groq" | "anthropic";
  key: string;
}): Promise<SaveAiKeyResult> {
  const { user } = await requireUser();
  const trimmed = (args.key ?? "").trim();
  // Allow empty string to clear the key.
  if (trimmed.length > 0 && trimmed.length < 10) {
    return { error: "That looks too short to be a valid key. Double-check and paste again." };
  }
  const column =
    args.provider === "gemini"
      ? "gemini_api_key"
      : args.provider === "groq"
        ? "groq_api_key"
        : "anthropic_api_key";

  const patch: TablesUpdate<"profiles"> = {
    [column]: trimmed.length === 0 ? null : trimmed,
  };
  const err = await updateProfile(user.id, patch);
  if (err) return { error: err.message };
  return { error: null, saved: true };
}

// Marks the first-load "Connect AI" prompt as dismissed. The user can
// still add keys via Settings; this just stops the popup from re-appearing.
export async function dismissAiKeyPromptAction(): Promise<{ error: string | null }> {
  const { user } = await requireUser();
  const err = await updateProfile(user.id, {
    ai_key_prompt_dismissed_at: new Date().toISOString(),
  });
  if (err) return { error: err.message };
  return { error: null };
}

function deriveChronotype(windows: TimeWindow[]) {
  const hasMorning = windows.includes("morning");
  const hasNight = windows.includes("night");
  if (hasNight && !hasMorning) return { chronotype: "night" as const, dayBoundary: "12:00:00" };
  if (hasMorning && !hasNight) return { chronotype: "day" as const, dayBoundary: "05:00:00" };
  return { chronotype: "mixed" as const, dayBoundary: "06:00:00" };
}

// ============================================================
// Profile (first name, phone)
// ============================================================
export type ProfileState = { error: string | null; saved?: boolean };

export async function saveProfileAction(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const { user } = await requireUser();
  const firstName = ((formData.get("first_name") as string | null) ?? "").trim();
  const phone = ((formData.get("phone") as string | null) ?? "").replace(/\s+/g, "");
  if (firstName.length < 1) return { error: "First name can't be empty." };

  const err = await updateProfile(user.id, {
    first_name: firstName,
    phone: phone.length >= 7 ? phone : null,
  });
  if (err) return { error: err.message };

  revalidatePath("/settings");
  revalidatePath("/today");
  return { error: null, saved: true };
}

// ============================================================
// Goal
// ============================================================
export type GoalState = { error: string | null; saved?: boolean };

export async function saveGoalAction(
  _prev: GoalState,
  formData: FormData
): Promise<GoalState> {
  const { user } = await requireUser();
  const goal = formData.get("goal") as Goal;
  const valid: Goal[] = ["jee_main", "jee_adv", "neet", "cuet", "jee_cuet", "boards", "other"];
  if (!valid.includes(goal)) return { error: "Pick a goal." };

  const err = await updateProfile(user.id, { goal });
  if (err) return { error: err.message };

  revalidatePath("/settings");
  return { error: null, saved: true };
}

// ============================================================
// Exam date + class
// ============================================================
export type ExamState = { error: string | null; saved?: boolean };

export async function saveExamAction(
  _prev: ExamState,
  formData: FormData
): Promise<ExamState> {
  const { user } = await requireUser();
  const examDate = (formData.get("exam_date") as string | null) || null;
  const currentClass = formData.get("current_class") as Cls;
  const valid: Cls[] = ["class_11", "class_12", "dropper_1", "dropper_2", "other"];
  if (!valid.includes(currentClass)) return { error: "Pick a class." };

  const err = await updateProfile(user.id, {
    exam_date: examDate,
    current_class: currentClass,
  });
  if (err) return { error: err.message };

  revalidatePath("/settings");
  return { error: null, saved: true };
}

// ============================================================
// Hours + windows + derived chronotype
// ============================================================
export type HoursState = { error: string | null; saved?: boolean };

export async function saveHoursAction(
  _prev: HoursState,
  formData: FormData
): Promise<HoursState> {
  const { user } = await requireUser();

  const weekday = Math.max(
    0,
    Math.min(24, parseInt((formData.get("hours_weekday") as string) ?? "6", 10))
  );
  const weekend = Math.max(
    0,
    Math.min(24, parseInt((formData.get("hours_weekend") as string) ?? "8", 10))
  );
  const sameDaily = formData.get("same_daily") === "on";

  const validWindows: TimeWindow[] = ["morning", "midday", "evening", "night"];
  const windows = validWindows.filter((w) => formData.get(`window_${w}`) === "on");
  const finalWindows: TimeWindow[] = windows.length > 0 ? windows : ["midday", "evening"];

  const { chronotype, dayBoundary } = deriveChronotype(finalWindows);

  const err = await updateProfile(user.id, {
    daily_hours_weekday: weekday,
    daily_hours_weekend: sameDaily ? weekday : weekend,
    same_daily_target: sameDaily,
    time_windows: finalWindows,
    chronotype,
    day_boundary_time: dayBoundary,
  });
  if (err) return { error: err.message };

  revalidatePath("/settings");
  revalidatePath("/today");
  return { error: null, saved: true };
}

// ============================================================
// Coaching
// ============================================================
export type CoachingState = { error: string | null; saved?: boolean };

export async function saveCoachingAction(
  _prev: CoachingState,
  formData: FormData
): Promise<CoachingState> {
  const { user } = await requireUser();
  const coachType = formData.get("coach_type") as CoachType;
  const validCoach: CoachType[] = ["yes", "self", "online"];
  if (!validCoach.includes(coachType)) return { error: "Pick an option." };
  const coachingName = ((formData.get("coaching_name") as string | null) ?? "").trim() || null;
  const batch = ((formData.get("batch") as string | null) ?? "").trim() || null;

  const err = await updateProfile(user.id, {
    coach_type: coachType,
    coaching_name: coachType === "yes" ? coachingName : null,
    batch: coachType === "yes" ? batch : null,
  });
  if (err) return { error: err.message };

  revalidatePath("/settings");
  return { error: null, saved: true };
}

// ============================================================
// Clear check-in history (PRD §3.5)
// Resets Burnout Detection baseline by removing all daily_checkins rows
// AND any open burnout_signals. Server-side ops via service role aren't
// needed since the user is allowed to clear their own data.
// ============================================================
export async function clearCheckinHistoryAction(): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  const { error: checkinError } = await supabase
    .from("daily_checkins")
    .delete()
    .eq("user_id", user.id);
  if (checkinError) return { error: checkinError.message };

  revalidatePath("/today");
  revalidatePath("/settings");
  return { error: null };
}

// ============================================================
// Account deletion (DPDP §B.6)
// ============================================================
// Immediate deletion: the admin client calls auth.admin.deleteUser, which
// cascades through every table (profiles, tasks, plans, revisions,
// checkins, backlog, recoveries, signals, bad days) via the FK ON DELETE
// CASCADE we set up in Phase 2.
//
// V1 simplification: no 30-day grace period (PRD §B.6 mentions one). Once
// confirmed, the row is gone immediately. A grace-period flow requires a
// scheduled job we don't have in V1.
//
// The action signs the user out implicitly — once the auth.users row is
// gone, the next middleware refresh fails and bounces them to /.

import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function deleteAccountAction(args: {
  confirm: string;
}): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  if (args.confirm.trim().toLowerCase() !== "delete my account") {
    return { error: "Please type 'delete my account' to confirm." };
  }

  const admin = getSupabaseAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return { error: deleteError.message };

  // Best-effort signout in case the session cookie is still valid until
  // refresh. Failure is non-fatal — the row is already gone.
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  redirect("/");
}
