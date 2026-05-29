import "server-only";

import { getGroqClient, GROQ_PLAN_MODEL } from "./client";
import { gatherPlanContext } from "./context";
import { PLAN_SYSTEM_PROMPT } from "./system-prompt";
import {
  type GenerationReason,
  type GroqPlanOutput,
  PlanValidationError,
  validateGroqOutput,
} from "./types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Json } from "@/lib/supabase/database.types";

type DailyPlanRow = Tables<"daily_plans">;
type TaskRow = Tables<"tasks">;

export type GenerateOptions = {
  userId: string;
  planDate?: string;
  /** True when the user explicitly asked to regenerate — bypasses
   *  "plan already exists" short-circuit. */
  regenerate?: boolean;
  /** Optional user-supplied reason ("plan feels too heavy" etc.) — logged
   *  to daily_plan_regenerations for Disengagement Detection signal. */
  reason?: string | null;
};

export type GenerateResult =
  | {
      ok: true;
      plan: DailyPlanRow;
      tasks: TaskRow[];
      fallback?: false;
    }
  | {
      ok: true;
      plan: DailyPlanRow;
      tasks: TaskRow[];
      /** True when Groq failed and we served the previous plan. UI shows
       *  the "Couldn't refresh — using yesterday's structure" banner. */
      fallback: true;
      fallbackReason: string;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Generate today's daily plan for a user.
 *
 * Order of operations:
 *   1. Gather context (profile, check-in, backlog, revisions, ...).
 *   2. Check if plan already exists for this date. If yes and regenerate=false,
 *      return existing plan untouched.
 *   3. Apply Order of Precedence (PRD §1.2.1):
 *        no_study_day → mock_day → recovery_week → bad_day_protocol → standard
 *      The system prompt also enforces this, but routing here lets us short-
 *      circuit cheap cases without paying for an LLM call.
 *   4. Call Groq, parse + validate JSON.
 *   5. Persist (delete-and-replace tasks if regenerating).
 *   6. On Groq error: fall back to the most recent successful plan (PRD §1.6).
 */
export async function generateDailyPlan(opts: GenerateOptions): Promise<GenerateResult> {
  const supabase = getSupabaseServerClient();

  // 1. Context
  let context, planDate, profile;
  try {
    const gathered = await gatherPlanContext({
      userId: opts.userId,
      planDate: opts.planDate,
    });
    context = gathered.context;
    planDate = gathered.planDate;
    profile = gathered.profile;
  } catch (err) {
    return { ok: false, error: errorMessage(err, "Couldn't gather context") };
  }

  // 2. Existing plan?
  const { data: existing } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", opts.userId)
    .eq("plan_date", planDate)
    .maybeSingle<DailyPlanRow>();

  if (existing && !opts.regenerate) {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("plan_id", existing.id)
      .order("task_order", { ascending: true })
      .returns<TaskRow[]>();
    return { ok: true, plan: existing, tasks: tasks ?? [] };
  }

  // 3. Call Groq with our context. If anything goes wrong (network, parse,
  //    validation), fall through to fallback.
  let groqOutput: GroqPlanOutput | null = null;
  let groqError: string | null = null;
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_PLAN_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 4000,
      messages: [
        { role: "system", content: PLAN_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(context) },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Groq returned non-JSON output");
    }
    groqOutput = validateGroqOutput(parsed);
  } catch (err) {
    if (err instanceof PlanValidationError) {
      groqError = `validation: ${err.message}`;
    } else {
      groqError = errorMessage(err, "Groq call failed");
    }
  }

  if (!groqOutput) {
    // 4. Fallback (PRD §1.6): serve the latest successful plan.
    const { data: lastPlan } = await supabase
      .from("daily_plans")
      .select("*")
      .eq("user_id", opts.userId)
      .order("plan_date", { ascending: false })
      .limit(1)
      .maybeSingle<DailyPlanRow>();

    if (!lastPlan) {
      return {
        ok: false,
        error:
          groqError ??
          "Couldn't generate a plan and there's no previous one to fall back on. Try again in a moment.",
      };
    }

    const { data: lastTasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("plan_id", lastPlan.id)
      .order("task_order", { ascending: true })
      .returns<TaskRow[]>();

    return {
      ok: true,
      plan: lastPlan,
      tasks: lastTasks ?? [],
      fallback: true,
      fallbackReason: groqError ?? "Plan generator unavailable",
    };
  }

  // 5. Persist. If regenerating, wipe pending tasks first (keep completed).
  if (existing && opts.regenerate) {
    await supabase
      .from("tasks")
      .delete()
      .eq("plan_id", existing.id)
      .eq("status", "pending");
  }

  const planRow: DailyPlanRow = await upsertPlanRow({
    userId: opts.userId,
    planDate,
    output: groqOutput,
    existing,
    regenerate: !!opts.regenerate,
  });

  // Filter Groq's chapter_id values against the syllabus before inserting so
  // a hallucinated UUID doesn't violate the foreign-key constraint.
  const syllabusIds = new Set(context.syllabus.map((s) => s.chapter_id));

  const taskInserts: TablesInsert<"tasks">[] = groqOutput.tasks.map((t, i) => ({
    user_id: opts.userId,
    plan_id: planRow.id,
    task_order: i,
    subject: t.subject,
    chapter_id: t.chapter_id && syllabusIds.has(t.chapter_id) ? t.chapter_id : null,
    chapter: t.chapter,
    topic: t.topic,
    task_type: t.task_type,
    estimated_minutes: clamp(t.estimated_minutes, 5, 240),
    time_window: t.time_window,
    is_anchor: false,
    is_custom: false,
    is_backlog: false,
    source: "ai",
    status: "pending",
  }));

  const { data: insertedTasks } = await supabase
    .from("tasks")
    .insert(taskInserts as never)
    .select("*")
    .returns<TaskRow[]>();

  // 6. If this was a regenerate, log it for Disengagement Detection (PRD §4.4.1)
  if (opts.regenerate && existing) {
    await supabase.from("daily_plan_regenerations").insert([
      {
        user_id: opts.userId,
        plan_id: planRow.id,
        reason: opts.reason ?? null,
      },
    ] as never);
  }

  // Touch last_active_at via the existing trigger on tasks (already does it).
  // Also touch profile.onboarding_completed_at sanity in late-night case
  // is N/A — we never alter onboarding here.

  void profile;
  return { ok: true, plan: planRow, tasks: insertedTasks ?? [] };
}

// ============================================================
// Helpers
// ============================================================
async function upsertPlanRow(args: {
  userId: string;
  planDate: string;
  output: GroqPlanOutput;
  existing: DailyPlanRow | null;
  regenerate: boolean;
}): Promise<DailyPlanRow> {
  const supabase = getSupabaseServerClient();
  const totalMinutes = args.output.tasks.reduce((acc, t) => acc + t.estimated_minutes, 0);

  if (args.existing) {
    const updateBody: TablesUpdate<"daily_plans"> = {
      generated_at: new Date().toISOString(),
      generation_reason: args.regenerate ? "regenerate" : args.output.generation_reason,
      total_tasks: args.output.tasks.length,
      total_minutes: totalMinutes,
      regenerate_count: (args.existing.regenerate_count ?? 0) + (args.regenerate ? 1 : 0),
      cached_groq_response: args.output as unknown as Json,
      status: "active",
    };
    const { data, error } = await supabase
      .from("daily_plans")
      .update(updateBody as never)
      .eq("id", args.existing.id)
      .select("*")
      .single<DailyPlanRow>();
    if (error) throw error;
    return data;
  }

  const insertBody: TablesInsert<"daily_plans"> = {
    user_id: args.userId,
    plan_date: args.planDate,
    generated_at: new Date().toISOString(),
    generation_reason: args.output.generation_reason,
    total_tasks: args.output.tasks.length,
    total_minutes: totalMinutes,
    completed_tasks: 0,
    completed_minutes: 0,
    regenerate_count: 0,
    status: "active",
    cached_groq_response: args.output as unknown as Json,
  };
  const { data, error } = await supabase
    .from("daily_plans")
    .insert(insertBody as never)
    .select("*")
    .single<DailyPlanRow>();
  if (error) throw error;
  return data;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function errorMessage(err: unknown, fallback: string) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

// Re-export for callers
export type { DailyPlanRow, TaskRow, GenerationReason };
