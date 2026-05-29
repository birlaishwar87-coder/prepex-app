import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/get-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCurrentPlanDate,
  getFirstPlanDate,
} from "@/lib/utils/day-boundary";
import { daysBetween } from "@/lib/utils/backlog-priority";
import { generateDailyPlan } from "@/lib/groq/generate-plan";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";
import { BadDayWelcome } from "./components/bad-day-welcome";
import { RightPanel, type RightPanelData } from "./components/right-panel";
import { TodayClient } from "./today-client";

// Server reads ALL the per-user data the Daily Plan home needs, detects
// the Bad Day Protocol trigger, computes right-panel data, and hands off
// to the client component.

export default async function TodayPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile) return null; // middleware should prevent this

  const supabase = getSupabaseServerClient();

  // ---- plan_date (late-night first plan vs. ongoing) ----
  const { count: priorPlans } = await supabase
    .from("daily_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isFirstPlan = (priorPlans ?? 0) === 0;
  const { planDate, isLateNight } = isFirstPlan
    ? getFirstPlanDate(profile)
    : { planDate: getCurrentPlanDate(profile), isLateNight: false };

  // ---- Bad Day Protocol detection (PRD §4.3) ----
  // Trigger when ≥2 inactive days AND not the first plan ever.
  // last_active_at is kept fresh by triggers on tasks/checkins/revisions.
  const daysSinceActive = profile.last_active_at
    ? daysBetween(profile.last_active_at.slice(0, 10), planDate)
    : 0;
  const shouldShowBadDay = !isFirstPlan && daysSinceActive >= 2;

  if (shouldShowBadDay) {
    // Is there already an unseen welcome row?
    const { data: existingWelcome } = await supabase
      .from("bad_day_protocols")
      .select("id")
      .eq("user_id", user.id)
      .eq("welcome_seen", false)
      .order("triggered_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    // First detection of THIS bad-day return → create the row and silently
    // reset streak (PRD §4.3.5 — no popup announcing it).
    if (!existingWelcome) {
      const insertRow: TablesInsert<"bad_day_protocols"> = {
        user_id: user.id,
        inactive_days: daysSinceActive,
        welcome_seen: false,
      };
      await supabase.from("bad_day_protocols").insert(insertRow as never);
      await supabase
        .from("profiles")
        .update({ streak_count: 0 } as never)
        .eq("id", user.id);
    }

    return (
      <BadDayWelcome
        firstName={profile.first_name?.trim() || "friend"}
        daysAway={daysSinceActive}
      />
    );
  }

  // ---- Today's plan + tasks ----
  const { data: plan } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle<Tables<"daily_plans">>();

  let tasks: Tables<"tasks">[] = [];
  if (plan) {
    const { data: taskRows } = await supabase
      .from("tasks")
      .select("*")
      .eq("plan_id", plan.id)
      .order("task_order", { ascending: true })
      .returns<Tables<"tasks">[]>();
    tasks = taskRows ?? [];
  }

  // ---- Today's check-in ----
  const { data: checkin } = await supabase
    .from("daily_checkins")
    .select("response, skipped")
    .eq("user_id", user.id)
    .eq("checkin_date", planDate)
    .maybeSingle<{
      response: string | null;
      skipped: boolean | null;
    }>();

  // ---- 28-day streak heatmap from completed_tasks ----
  // Build 28 days going back from planDate. Intensity 0..4 based on
  // completion percentage that day.
  const heatmap = await buildHeatmap(user.id, planDate);

  // ---- Topic-state map for routing /today revision tasks ----
  // Build chapter_id → topic_state_id and chapter_id → chapter meta.
  const { data: topicStates } = await supabase
    .from("user_topic_state")
    .select("id, chapter_id, chapters(name, subject)")
    .eq("user_id", user.id)
    .eq("phase", "in_revision")
    .returns<
      Array<{
        id: string;
        chapter_id: string;
        chapters: { name: string; subject: "physics" | "chemistry" | "maths" } | null;
      }>
    >();

  const revisionTopicStateByChapter: Record<string, string> = {};
  const chapterMetaById: Record<
    string,
    { name: string; subject: "physics" | "chemistry" | "maths" }
  > = {};
  for (const row of topicStates ?? []) {
    revisionTopicStateByChapter[row.chapter_id] = row.id;
    if (row.chapters) {
      chapterMetaById[row.chapter_id] = {
        name: row.chapters.name,
        subject: row.chapters.subject,
      };
    }
  }

  // ---- Tomorrow preview ----
  const tomorrow = addDays(planDate, 1);
  const { data: tomorrowPlan } = await supabase
    .from("daily_plans")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_date", tomorrow)
    .maybeSingle<{ id: string }>();
  let tomorrowPreview: RightPanelData["tomorrowPreview"] = [];
  if (tomorrowPlan) {
    const { data: previewTasks } = await supabase
      .from("tasks")
      .select("subject, chapter, estimated_minutes, task_type")
      .eq("plan_id", tomorrowPlan.id)
      .order("task_order", { ascending: true })
      .limit(4)
      .returns<
        Array<{
          subject: string;
          chapter: string | null;
          estimated_minutes: number;
          task_type: string;
        }>
      >();
    tomorrowPreview = (previewTasks ?? []).map((t) => ({
      subject: t.subject,
      chapter: t.chapter,
      minutes: t.estimated_minutes,
      type: t.task_type,
    }));
  }

  // ---- Week stats ----
  const weekStart = addDays(planDate, -6);
  const { data: weekPlans } = await supabase
    .from("daily_plans")
    .select("completed_minutes, completed_tasks, total_tasks")
    .eq("user_id", user.id)
    .gte("plan_date", weekStart)
    .lte("plan_date", planDate)
    .returns<
      Array<{
        completed_minutes: number | null;
        completed_tasks: number | null;
        total_tasks: number | null;
      }>
    >();
  const weekFocusedMinutes =
    weekPlans?.reduce((acc, p) => acc + (p.completed_minutes ?? 0), 0) ?? 0;
  const weekDone =
    weekPlans?.reduce((acc, p) => acc + (p.completed_tasks ?? 0), 0) ?? 0;
  const weekTotal =
    weekPlans?.reduce((acc, p) => acc + (p.total_tasks ?? 0), 0) ?? 0;
  const completionRatePct =
    weekTotal === 0 ? 0 : Math.round((weekDone / weekTotal) * 100);

  // ---- Fallback flag ----
  // Detected from the plan: a Phase-5 fallback served a stale plan whose
  // plan_date != requested plan_date. For now we only flag a fresh
  // generation that ended in fallback if `plan` is null AND we haven't
  // retried — Phase 11 will surface this from a server-side cache.
  // For Phase 6 we don't aggressively detect; the regenerate action
  // surfaces the fallback flag from its own server response.

  // ---- "Day 2" check-in explainer (PRD §3.2.3) ----
  const accountAgeDays = profile.created_at
    ? daysBetween(profile.created_at.slice(0, 10), planDate)
    : 0;
  const showDay2Explainer = accountAgeDays === 1;

  const daysToExam =
    profile.exam_date != null ? Math.max(0, daysBetween(planDate, profile.exam_date)) : null;

  const rightPanelData: RightPanelData = {
    streak: profile.streak_count ?? 0,
    bestStreak: profile.best_streak ?? 0,
    freezesAvailable: profile.streak_freezes_available ?? 0,
    heatmap,
    completedToday: tasks.filter((t) => t.status === "completed").length,
    totalToday: tasks.length,
    tomorrowPreview,
    hoursFocusedThisWeek: Math.round(weekFocusedMinutes / 60),
    completionRatePct,
  };

  // Auto-generate plan on first load AFTER late-night signup acknowledged —
  // i.e. the wizard ended on /onboarding, we land here, no plan yet, no
  // checkin yet, and it's NOT late-night. Server kicks off a generate to
  // skip the extra UX round-trip.
  let generationFallback = false;
  let generationFallbackReason: string | null = null;
  if (!plan && checkin?.response && !isLateNight) {
    // User already checked in but plan was nuked / never generated.
    const result = await generateDailyPlan({ userId: user.id, planDate });
    if (result.ok) {
      // Re-fetch.
      const { data: refreshedPlan } = await supabase
        .from("daily_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_date", planDate)
        .maybeSingle<Tables<"daily_plans">>();
      if (refreshedPlan) {
        const { data: refreshedTasks } = await supabase
          .from("tasks")
          .select("*")
          .eq("plan_id", refreshedPlan.id)
          .order("task_order", { ascending: true })
          .returns<Tables<"tasks">[]>();
        // mutate local vars
        const newTasks = refreshedTasks ?? [];
        return (
          <TodayPageRenderer
            firstName={profile.first_name?.trim() || "friend"}
            daysToExam={daysToExam}
            planDate={planDate}
            isLateNight={isLateNight}
            plan={refreshedPlan}
            tasks={newTasks}
            checkin={checkin}
            showDay2Explainer={showDay2Explainer}
            rightPanelData={{
              ...rightPanelData,
              completedToday: newTasks.filter((t) => t.status === "completed").length,
              totalToday: newTasks.length,
            }}
            fallback={"fallback" in result && !!result.fallback}
            fallbackReason={
              "fallback" in result && result.fallback ? result.fallbackReason : null
            }
            revisionTopicStateByChapter={revisionTopicStateByChapter}
            chapterMetaById={chapterMetaById}
          />
        );
      }
    } else {
      generationFallback = true;
      generationFallbackReason = result.error;
    }
  }

  return (
    <TodayPageRenderer
      firstName={profile.first_name?.trim() || "friend"}
      daysToExam={daysToExam}
      planDate={planDate}
      isLateNight={isLateNight}
      plan={plan}
      tasks={tasks}
      checkin={checkin}
      showDay2Explainer={showDay2Explainer}
      rightPanelData={rightPanelData}
      revisionTopicStateByChapter={revisionTopicStateByChapter}
      chapterMetaById={chapterMetaById}
      fallback={generationFallback}
      fallbackReason={generationFallbackReason}
    />
  );
}

// ============================================================
// Internals
// ============================================================

function TodayPageRenderer(props: {
  firstName: string;
  daysToExam: number | null;
  planDate: string;
  isLateNight: boolean;
  plan: Tables<"daily_plans"> | null;
  tasks: Tables<"tasks">[];
  checkin: { response: string | null; skipped: boolean | null } | null;
  showDay2Explainer: boolean;
  rightPanelData: RightPanelData;
  fallback: boolean;
  fallbackReason: string | null;
  revisionTopicStateByChapter: Record<string, string>;
  chapterMetaById: Record<string, { name: string; subject: "physics" | "chemistry" | "maths" }>;
}) {
  return (
    <div className="grid gap-7 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <TodayClient
          firstName={props.firstName}
          daysToExam={props.daysToExam}
          planDate={props.planDate}
          isLateNight={props.isLateNight}
          plan={props.plan}
          tasks={props.tasks}
          checkinExists={
            !!(props.checkin && (props.checkin.response || props.checkin.skipped))
          }
          checkinResponse={props.checkin?.response ?? null}
          showDay2Explainer={props.showDay2Explainer}
          fallback={props.fallback}
          fallbackReason={props.fallbackReason}
          revisionTopicStateByChapter={props.revisionTopicStateByChapter}
          chapterMetaById={props.chapterMetaById}
        />
      </div>
      <aside className="hidden xl:block">
        <RightPanel data={props.rightPanelData} />
      </aside>
    </div>
  );
}

async function buildHeatmap(userId: string, planDate: string): Promise<number[]> {
  const supabase = getSupabaseServerClient();
  const start = addDays(planDate, -27);
  const { data: rows } = await supabase
    .from("daily_plans")
    .select("plan_date, completed_tasks, total_tasks")
    .eq("user_id", userId)
    .gte("plan_date", start)
    .lte("plan_date", planDate)
    .returns<
      Array<{
        plan_date: string;
        completed_tasks: number | null;
        total_tasks: number | null;
      }>
    >();

  const byDate = new Map<string, { done: number; total: number }>();
  (rows ?? []).forEach((r) => {
    byDate.set(r.plan_date, {
      done: r.completed_tasks ?? 0,
      total: r.total_tasks ?? 0,
    });
  });

  const heatmap: number[] = [];
  for (let i = 0; i < 28; i++) {
    const date = addDays(planDate, -27 + i);
    const day = byDate.get(date);
    if (!day || day.total === 0) {
      heatmap.push(0);
    } else {
      const ratio = day.done / day.total;
      // Map ratio to 1..4
      if (ratio <= 0) heatmap.push(0);
      else if (ratio < 0.25) heatmap.push(1);
      else if (ratio < 0.5) heatmap.push(2);
      else if (ratio < 0.85) heatmap.push(3);
      else heatmap.push(4);
    }
  }
  return heatmap;
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
