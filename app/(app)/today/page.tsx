import Link from "next/link";
import { Pill } from "@/components/ui/pill";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/get-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPlanDate, getFirstPlanDate } from "@/lib/utils/day-boundary";
import type { Tables } from "@/lib/supabase/database.types";
import { GenerateButton } from "./generate-button";

// Phase 5 placeholder for /today. Goal of this surface in V1 is just to
// prove the engine works end-to-end: read the plan if one exists, otherwise
// offer a button that calls generateDailyPlan. Phase 6 will replace this
// with the proper Daily Plan home (check-in, task cards, etc.).

export default async function TodayPage() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile) return null; // middleware should never let us here without both

  // Late-night signup → first plan should target tomorrow (PRD §1.0.4).
  // For everyone else, use the current plan_date.
  const supabase = getSupabaseServerClient();

  // Detect "first plan" by counting prior plans for the user.
  const { count: priorPlans } = await supabase
    .from("daily_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const isFirstPlan = (priorPlans ?? 0) === 0;
  const { planDate, isLateNight } = isFirstPlan
    ? getFirstPlanDate(profile)
    : { planDate: getCurrentPlanDate(profile), isLateNight: false };

  // Fetch this plan_date's plan + tasks (if generated).
  const { data: planRow } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle<Tables<"daily_plans">>();

  let tasks: Tables<"tasks">[] = [];
  if (planRow) {
    const { data: taskRows } = await supabase
      .from("tasks")
      .select("*")
      .eq("plan_id", planRow.id)
      .order("task_order", { ascending: true })
      .returns<Tables<"tasks">[]>();
    tasks = taskRows ?? [];
  }

  const totalMinutes = tasks.reduce((acc, t) => acc + (t.estimated_minutes ?? 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">
            Hi, {profile.first_name?.trim() || "friend"}.
          </h1>
          <p className="t-body secondary">
            {isLateNight
              ? "Setting you up for tomorrow."
              : planRow
              ? `Plan for ${planDate}.`
              : `No plan yet for ${planDate}.`}
          </p>
        </div>
        <Pill variant="coral">Phase 5 · engine preview</Pill>
      </div>

      {/* No plan yet → offer generation. */}
      {!planRow && (
        <div className="glass" style={{ padding: 32 }}>
          <h2 className="t-h3 mb-2">
            {isLateNight ? "Tomorrow's plan is ready when you are" : "Let's build your day"}
          </h2>
          <p className="t-body-sm secondary mb-5">
            {isLateNight
              ? "You signed up late. We're going to plan tomorrow instead of cramming the last hour of today."
              : "We'll use your goal, hours, and the chapters you've studied to draft a plan. About 5 seconds."}
          </p>
          <GenerateButton
            label={isLateNight ? "Generate tomorrow's plan" : "Generate today's plan"}
          />
        </div>
      )}

      {/* Plan exists → render the tasks, plain. Phase 6 makes this beautiful. */}
      {planRow && (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="t-label coral">Today&apos;s plan</div>
              <h2 className="t-h3 mt-1">
                {tasks.length} tasks · {totalHours}h
              </h2>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="tabular secondary">
                {completedCount}/{tasks.length} done
              </span>
              <GenerateButton regenerate label="Regenerate" />
            </div>
          </div>

          {tasks.length === 0 && (
            <div className="glass" style={{ padding: 24 }}>
              <p className="t-body-sm secondary">
                This plan has no tasks. {planRow.generation_reason === "no_study_day" && "Today is marked as a no-study day — nothing to do."}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>

          <div className="mt-8 rounded-input px-3 py-2.5 text-xs tertiary"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid var(--border-default)",
            }}
          >
            <strong className="cream-text">Generation reason:</strong> {planRow.generation_reason ?? "standard"} ·{" "}
            <strong className="cream-text">Total minutes:</strong> {planRow.total_minutes ?? 0} ·{" "}
            <strong className="cream-text">Regen count:</strong> {planRow.regenerate_count ?? 0}
            <br />
            Phase 6 will replace this raw view with the polished Daily Plan UI (check-in, task cards, time windows).{" "}
            <Link href="/dev/preview" className="coral-text">
              Preview the primitives →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Minimal task row — intentionally plain. Phase 6 makes this a real card.
// ============================================================
const SUBJECT_DOT: Record<string, string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
  revision: "#FBBF24",
  wellness: "#6EE7B7",
};

function TaskRow({ task }: { task: Tables<"tasks"> }) {
  const color = SUBJECT_DOT[task.subject] ?? "#A5B4FC";
  const done = task.status === "completed";
  return (
    <div
      className="flex items-center gap-3.5 rounded-card border px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.025)",
        borderColor: "var(--border-default)",
        opacity: done ? 0.55 : 1,
      }}
    >
      <div
        className="h-9 w-1 flex-shrink-0 rounded-full"
        style={{ background: color }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="text-[14px] font-semibold text-cream"
          style={{ textDecoration: done ? "line-through" : "none" }}
        >
          <span className="capitalize">{task.subject}</span>
          {task.chapter ? ` · ${task.chapter}` : ""}
          {task.topic ? ` · ${task.topic}` : ""}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="pill" style={{ padding: "2px 8px", fontSize: 11 }}>
            {task.task_type?.replace("_", " ")}
          </span>
          <span className="pill" style={{ padding: "2px 8px", fontSize: 11 }}>
            {task.estimated_minutes}min
          </span>
          <span className="pill" style={{ padding: "2px 8px", fontSize: 11 }}>
            {task.time_window}
          </span>
        </div>
      </div>
    </div>
  );
}
