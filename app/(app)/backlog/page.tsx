import { getCurrentUser, getCurrentProfile } from "@/lib/supabase/get-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { computeBacklogPriority, daysBetween } from "@/lib/utils/backlog-priority";
import { getCurrentPlanDate, getFirstPlanDate } from "@/lib/utils/day-boundary";
import type { Tables } from "@/lib/supabase/database.types";
import { BacklogClient } from "./backlog-client";
import { computeHealthTier } from "./components/health-indicator";
import type { BacklogRowItem } from "./components/backlog-row";

// Backlog tracking starts on Day 8 (PRD §11.8). Until then we show a
// reassuring placeholder — the row count is still computed silently in the
// background for AI planning, but the UI never surfaces it.
const FIRST_VISIBLE_DAY = 8;
const HELD_NUDGE_DAYS = 7;

export default async function BacklogPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile) return null;

  const supabase = getSupabaseServerClient();

  // Compute "today" in user's chronotype and account age.
  const { count: priorPlans } = await supabase
    .from("daily_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const isFirstPlan = (priorPlans ?? 0) === 0;
  const planDate = isFirstPlan
    ? getFirstPlanDate(profile).planDate
    : getCurrentPlanDate(profile);

  const accountAgeDays = profile.created_at
    ? daysBetween(profile.created_at.slice(0, 10), planDate)
    : 0;

  // First 7 days — hide the backlog entirely.
  if (accountAgeDays < FIRST_VISIBLE_DAY - 1) {
    return <FirstWeekPlaceholder accountAgeDays={accountAgeDays} />;
  }

  // Fetch backlog + chapters in parallel.
  const [backlogRes, chaptersRes, recoveryRes] = await Promise.all([
    supabase
      .from("backlog_items")
      .select("*")
      .eq("user_id", user.id)
      .in("state", ["active", "held", "user_added"])
      .returns<Tables<"backlog_items">[]>(),
    supabase
      .from("chapters")
      .select("id, name, subject, chapter_order")
      .order("subject", { ascending: true })
      .order("chapter_order", { ascending: true })
      .returns<
        Array<{
          id: string;
          name: string;
          subject: "physics" | "chemistry" | "maths";
          chapter_order: number | null;
        }>
      >(),
    supabase
      .from("recovery_modes")
      .select("id, started_at")
      .eq("user_id", user.id)
      .eq("type", "backlog")
      .eq("active", true)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; started_at: string | null }>(),
  ]);

  const backlogRows = backlogRes.data ?? [];
  const chapters = (chaptersRes.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
  }));
  const recovery = recoveryRes.data;

  // Compute priority weight + days overdue for each row + held-nudge flag.
  const decorated: BacklogRowItem[] = backlogRows.map((b) => {
    const { weight, daysOverdue } = computeBacklogPriority({
      state: b.state ?? "active",
      priority: b.priority ?? "normal",
      originalDate: b.original_date,
      lastReviewedAt: b.last_reviewed_at,
      today: planDate,
    });

    const heldDays =
      b.state === "held" && b.held_since
        ? daysBetween(b.held_since.slice(0, 10), planDate)
        : 0;
    const showHeldNudge =
      b.state === "held" && heldDays >= HELD_NUDGE_DAYS && !(b.nudge_sent ?? false);

    return {
      id: b.id,
      subject: b.subject,
      chapter: b.chapter,
      topic: b.topic,
      taskType: b.task_type,
      estimatedMinutes: b.estimated_minutes,
      daysOverdue,
      priorityWeight: weight,
      state: (b.state ?? "active") as BacklogRowItem["state"],
      priority: (b.priority ?? "normal") as BacklogRowItem["priority"],
      showHeldNudge,
    };
  });

  // Sort: active by weight desc, held by held_since desc, user_added at top.
  const active = decorated
    .filter((d) => d.state === "active")
    .sort((a, b) => b.priorityWeight - a.priorityWeight);
  const held = decorated.filter((d) => d.state === "held");
  const userAdded = decorated.filter((d) => d.state === "user_added");

  // Health uses ACTIVE-only counts (held items don't pressure the student).
  const avgAge =
    active.length === 0
      ? 0
      : active.reduce((acc, a) => acc + a.daysOverdue, 0) / active.length;
  const healthTier = computeHealthTier({ count: active.length, avgAgeDays: avgAge });

  const recoveryDayOf7 = recovery?.started_at
    ? Math.min(7, 1 + daysBetween(recovery.started_at.slice(0, 10), planDate))
    : 0;

  return (
    <BacklogClient
      active={active}
      held={held}
      userAdded={userAdded}
      healthTier={healthTier}
      totalCount={decorated.length}
      recoveryActive={!!recovery}
      recoveryDayOf7={recoveryDayOf7}
      chapters={chapters}
      alreadyInBacklogChapterIds={backlogRows
        .map((b) => b.chapter_id)
        .filter((v): v is string => !!v)}
    />
  );
}

function FirstWeekPlaceholder({ accountAgeDays }: { accountAgeDays: number }) {
  const daysLeft = Math.max(0, 7 - accountAgeDays);
  return (
    <div>
      <h1 className="t-h1 mb-2">Backlog</h1>
      <p className="t-body secondary mb-7">
        Missed tasks redistribute gently. No guilt.
      </p>
      <div
        className="glass"
        style={{
          padding: 28,
          background: "linear-gradient(135deg, rgba(76, 29, 149, 0.12), rgba(26, 26, 78, 0.30))",
          border: "1px solid rgba(76, 29, 149, 0.25)",
        }}
      >
        <h3 className="t-h4 mb-2">Building your rhythm.</h3>
        <p className="t-body-sm secondary">
          Backlog tracking starts Day 8. For now, just show up. We&apos;re learning what your
          real days look like, and the planner is silently shaping itself to match.
        </p>
        <p className="t-body-sm tertiary mt-3">
          Tracking opens in {daysLeft} {daysLeft === 1 ? "day" : "days"}.
        </p>
      </div>
    </div>
  );
}
