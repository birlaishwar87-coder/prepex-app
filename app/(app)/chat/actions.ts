"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendChatMessage, type ChatMessage } from "@/lib/groq/chat";
import { NoAiKeyError } from "@/lib/ai/provider";
import { getAiKeysForUser } from "@/lib/ai/get-user-keys";
import { sanitizeProviderError } from "@/lib/groq/generate-plan";
import { getCurrentPlanDate, getFirstPlanDate } from "@/lib/utils/day-boundary";
import type { Tables } from "@/lib/supabase/database.types";

async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return { supabase, user };
}

/**
 * Sends a chat turn. Server fetches a brief context snapshot of the
 * student's current state, packs it into the user message, and calls Groq.
 * Returns the assistant reply.
 *
 * V1 scope: ephemeral history (lives in client state). Phase 11 polish
 * can persist conversations.
 */
export async function sendChatTurnAction(args: {
  history: ChatMessage[];
  userMessage: string;
}): Promise<{ reply: string | null; error: string | null; needsAiKey?: boolean }> {
  const { supabase, user } = await requireUser();

  // Build a compact context snapshot.
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "first_name, goal, exam_date, daily_hours_weekday, daily_hours_weekend, time_windows, chronotype, streak_count, last_active_at, day_boundary_time, timezone, onboarding_completed_at"
    )
    .eq("id", user.id)
    .maybeSingle<
      Pick<
        Tables<"profiles">,
        | "first_name"
        | "goal"
        | "exam_date"
        | "daily_hours_weekday"
        | "daily_hours_weekend"
        | "time_windows"
        | "chronotype"
        | "streak_count"
        | "last_active_at"
        | "day_boundary_time"
        | "timezone"
        | "onboarding_completed_at"
      >
    >();
  if (!profile) return { reply: null, error: "Profile not found" };

  // Determine today's plan_date based on chronotype.
  const { count: priorPlans } = await supabase
    .from("daily_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const isFirstPlan = (priorPlans ?? 0) === 0;
  const planDate = isFirstPlan
    ? getFirstPlanDate(profile).planDate
    : getCurrentPlanDate(profile);

  const { data: plan } = await supabase
    .from("daily_plans")
    .select(
      "id, plan_date, generation_reason, total_tasks, total_minutes, completed_tasks, completed_minutes, regenerate_count"
    )
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle<{
      id: string;
      plan_date: string;
      generation_reason: string | null;
      total_tasks: number | null;
      total_minutes: number | null;
      completed_tasks: number | null;
      completed_minutes: number | null;
      regenerate_count: number | null;
    }>();

  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("response, skipped")
    .eq("user_id", user.id)
    .eq("checkin_date", planDate)
    .maybeSingle<{ response: string | null; skipped: boolean | null }>();

  const { data: activeRecovery } = await supabase
    .from("recovery_modes")
    .select("type, started_at")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle<{ type: "backlog" | "burnout"; started_at: string | null }>();

  const { count: activeBacklogCount } = await supabase
    .from("backlog_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("state", ["active", "user_added"]);

  // Days to exam.
  let daysToExam: number | null = null;
  if (profile.exam_date) {
    const ms =
      new Date(profile.exam_date + "T12:00:00Z").getTime() -
      new Date(planDate + "T12:00:00Z").getTime();
    daysToExam = Math.max(0, Math.round(ms / 86_400_000));
  }

  const systemContext = JSON.stringify(
    {
      first_name: profile.first_name,
      goal: profile.goal,
      days_to_exam: daysToExam,
      plan_date: planDate,
      hours_target_today: getHoursTarget(profile, planDate),
      time_windows: profile.time_windows,
      chronotype: profile.chronotype,
      streak_count: profile.streak_count,
      todays_checkin: checkin?.response ?? (checkin?.skipped ? "skipped" : null),
      todays_plan: plan
        ? {
            tasks: plan.total_tasks,
            minutes: plan.total_minutes,
            completed_tasks: plan.completed_tasks,
            completed_minutes: plan.completed_minutes,
            generation_reason: plan.generation_reason,
            regenerate_count: plan.regenerate_count,
          }
        : null,
      active_recovery: activeRecovery
        ? { type: activeRecovery.type, started_at: activeRecovery.started_at }
        : null,
      backlog_count: activeBacklogCount ?? 0,
    },
    null,
    2
  );

  try {
    const userKeys = await getAiKeysForUser(user.id);
    const reply = await sendChatMessage({
      systemContext,
      history: args.history.slice(-12), // last 6 turns, ~12 messages
      userMessage: args.userMessage,
      keys: userKeys,
    });
    if (!reply) return { reply: null, error: "Empty response — try again." };
    return { reply, error: null };
  } catch (err) {
    if (err instanceof NoAiKeyError) {
      return {
        reply: null,
        error: "Connect an AI provider key in Settings to chat.",
        needsAiKey: true,
      };
    }
    // sanitizeProviderError keeps raw 429 / rate-limit JSON out of the chat bubble.
    const raw = err instanceof Error ? err.message : "Couldn't reach the assistant.";
    return { reply: null, error: sanitizeProviderError(raw) };
  }
}

function getHoursTarget(
  p: { daily_hours_weekday: number | null; daily_hours_weekend: number | null },
  date: string
): number {
  const d = new Date(date + "T12:00:00Z");
  const dow = d.getUTCDay();
  const isWeekend = dow === 0 || dow === 6;
  return isWeekend ? p.daily_hours_weekend ?? 8 : p.daily_hours_weekday ?? 6;
}
