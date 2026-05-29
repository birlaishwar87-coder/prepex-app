import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { computeBacklogPriority, daysBetween } from "@/lib/utils/backlog-priority";
import {
  getCurrentPlanDate,
  getFirstPlanDate,
  getHoursTargetForDate,
} from "@/lib/utils/day-boundary";
import type { Database, Tables } from "@/lib/supabase/database.types";
import type { PlanContext } from "./types";

type Profile = Tables<"profiles">;

/**
 * Pulls everything Groq needs to plan today, packaged as a clean
 * PlanContext. Pure read — never mutates.
 */
export async function gatherPlanContext(args: {
  userId: string;
  /** Override plan_date (e.g. for regenerate-for-tomorrow). Default derives from profile. */
  planDate?: string;
}): Promise<{
  context: PlanContext;
  profile: Profile;
  planDate: string;
}> {
  const supabase = getSupabaseServerClient();

  // ---- profile ----
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", args.userId)
    .maybeSingle<Profile>();

  if (profileError) throw profileError;
  if (!profile) throw new Error("Profile not found for user " + args.userId);

  // ---- plan date + late-night detection ----
  let planDate: string;
  let isLateNight = false;
  let isFirstPlan = false;

  if (args.planDate) {
    planDate = args.planDate;
  } else {
    const { count: priorPlans } = await supabase
      .from("daily_plans")
      .select("id", { count: "exact", head: true })
      .eq("user_id", args.userId);

    isFirstPlan = (priorPlans ?? 0) === 0;

    if (isFirstPlan) {
      const result = getFirstPlanDate(profile);
      planDate = result.planDate;
      isLateNight = result.isLateNight;
    } else {
      planDate = getCurrentPlanDate(profile);
    }
  }

  // ---- check-in for plan_date ----
  const { data: checkinRow } = await supabase
    .from("daily_checkins")
    .select("response, skipped")
    .eq("user_id", args.userId)
    .eq("checkin_date", planDate)
    .maybeSingle<{
      response: Database["public"]["Enums"]["checkin_response_t"] | null;
      skipped: boolean | null;
    }>();

  // ---- syllabus (full master list — small, cacheable) ----
  const { data: syllabusRaw } = await supabase
    .from("chapters")
    .select("id, subject, name, chapter_order")
    .order("subject", { ascending: true })
    .order("chapter_order", { ascending: true })
    .returns<
      Array<{
        id: string;
        subject: "physics" | "chemistry" | "maths";
        name: string;
        chapter_order: number | null;
      }>
    >();

  const syllabus = (syllabusRaw ?? []).map((c) => ({
    chapter_id: c.id,
    subject: c.subject,
    name: c.name,
  }));

  // ---- studied + revisions ----
  const { data: topicStatesRaw } = await supabase
    .from("user_topic_state")
    .select(
      "id, chapter_id, phase, last_revised_at, next_revision_due, latest_difficulty_rating, revision_count, chapters(name, subject)"
    )
    .eq("user_id", args.userId)
    .returns<
      Array<{
        id: string;
        chapter_id: string;
        phase: "not_started" | "in_revision" | "mastered";
        last_revised_at: string | null;
        next_revision_due: string | null;
        latest_difficulty_rating: "easy" | "medium" | "hard" | null;
        revision_count: number | null;
        chapters: { name: string; subject: "physics" | "chemistry" | "maths" } | null;
      }>
    >();

  const today = planDate;
  const studied: PlanContext["studied"] = [];
  const revisions_due: PlanContext["revisions_due"] = [];

  for (const t of topicStatesRaw ?? []) {
    if (!t.chapters) continue;
    if (t.phase === "in_revision") {
      const daysSince = t.last_revised_at
        ? daysBetween(t.last_revised_at.slice(0, 10), today)
        : null;
      studied.push({
        chapter_id: t.chapter_id,
        chapter: t.chapters.name,
        subject: t.chapters.subject,
        last_difficulty: t.latest_difficulty_rating,
        days_since_revised: daysSince,
      });
      if (t.next_revision_due && t.next_revision_due <= today) {
        const overdue = daysBetween(t.next_revision_due, today);
        revisions_due.push({
          chapter_id: t.chapter_id,
          chapter: t.chapters.name,
          subject: t.chapters.subject,
          days_overdue: overdue,
          last_difficulty: t.latest_difficulty_rating,
          revision_count: t.revision_count ?? 0,
        });
      }
    }
  }
  // Most overdue first.
  revisions_due.sort((a, b) => b.days_overdue - a.days_overdue);

  // ---- backlog (active + user_added only) ----
  const { data: backlogRaw } = await supabase
    .from("backlog_items")
    .select("*")
    .eq("user_id", args.userId)
    .in("state", ["active", "user_added"])
    .returns<Tables<"backlog_items">[]>();

  const backlog = (backlogRaw ?? [])
    .map((b) => {
      const { weight, daysOverdue } = computeBacklogPriority({
        state: b.state ?? "active",
        priority: b.priority ?? "normal",
        originalDate: b.original_date,
        lastReviewedAt: b.last_reviewed_at,
        today,
      });
      return {
        backlog_id: b.id,
        subject: b.subject,
        chapter: b.chapter,
        chapter_id: b.chapter_id,
        task_type: b.task_type,
        estimated_minutes: b.estimated_minutes,
        priority_weight: weight,
        days_overdue: daysOverdue,
      };
    })
    .sort((a, b) => b.priority_weight - a.priority_weight);

  // ---- recovery mode ----
  const { data: recoveryRows } = await supabase
    .from("recovery_modes")
    .select("type, started_at, active")
    .eq("user_id", args.userId)
    .eq("active", true)
    .returns<
      Array<{ type: "backlog" | "burnout"; started_at: string | null; active: boolean | null }>
    >();

  const activeRecovery = recoveryRows?.[0] ?? null;
  let recoveryDayOf7: number | null = null;
  if (activeRecovery?.started_at) {
    recoveryDayOf7 = Math.min(
      7,
      1 + daysBetween(activeRecovery.started_at.slice(0, 10), today)
    );
  }

  // ---- anchors (custom tasks the user pre-placed for this date) ----
  // PRD §1.2.1 step 4 references Custom Day Plan; that surface ships in
  // Phase 8/9. For now: anchors = any existing pending tasks on a plan
  // with is_anchor=true for this date. Empty for V1 generation.
  const anchors: PlanContext["anchors"] = [];

  // ---- Bad Day Protocol detection (PRD §4.3.1) ----
  // Inactive = no app open, no task activity, no checkin. We approximate via
  // last_active_at (kept fresh by triggers on tasks/checkins/revisions).
  const daysSinceLastActive = profile.last_active_at
    ? daysBetween(profile.last_active_at.slice(0, 10), today)
    : 0;
  const isBadDayReturn = !isFirstPlan && daysSinceLastActive >= 2;

  // ---- compose ----
  const daysToExam =
    profile.exam_date != null ? Math.max(0, daysBetween(today, profile.exam_date)) : null;

  const context: PlanContext = {
    user: {
      first_name: profile.first_name,
      goal: profile.goal,
      exam_date: profile.exam_date,
      days_to_exam: daysToExam,
      daily_hours_target: getHoursTargetForDate(profile, planDate),
      time_windows: profile.time_windows ?? [],
      chronotype: profile.chronotype ?? "day",
      coaching:
        profile.coach_type === "yes"
          ? { name: profile.coaching_name, batch: profile.batch }
          : null,
    },
    plan_date: planDate,
    is_first_plan: isFirstPlan,
    is_late_night_signup: isLateNight,
    checkin: {
      response: checkinRow?.response ?? null,
      skipped: checkinRow?.skipped ?? false,
    },
    is_bad_day_return: isBadDayReturn,
    days_since_last_active: daysSinceLastActive,
    syllabus,
    studied,
    revisions_due,
    backlog,
    // PHASE_2 — wired in Phase 8/9 (calendar + recovery).
    is_no_study_day: false,
    is_mock_day: false,
    recovery_mode: {
      active: !!activeRecovery,
      type: activeRecovery?.type ?? null,
      day_of_7: recoveryDayOf7,
    },
    anchors,
  };

  return { context, profile, planDate };
}
