import "server-only";

import { gatherPlanContext } from "./context";
import { PLAN_SYSTEM_PROMPT } from "./system-prompt";
import {
  type GenerationReason,
  type GroqPlanOutput,
  PlanValidationError,
  validateGroqOutput,
} from "./types";
import { callPlanGen, activeProviderName } from "@/lib/ai/provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert, TablesUpdate, Json } from "@/lib/supabase/database.types";

type DailyPlanRow = Tables<"daily_plans">;
type TaskRow = Tables<"tasks">;

export type GenerateOptions = {
  userId: string;
  planDate?: string;
  /** True when the user explicitly asked to regenerate. */
  regenerate?: boolean;
  /** Short tag for the daily_plan_regenerations log row. */
  reason?: string | null;
  /** Free-form user intent (from chat) — fed into the model's context so
   *  the regenerated plan satisfies what the student actually asked for. */
  userIntent?: string | null;
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
      fallback: true;
      fallbackReason: string;
    }
  | {
      ok: false;
      error: string;
    };

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

  // Plant the user_intent for chat-driven regenerations.
  if (opts.userIntent) {
    context.user_intent = opts.userIntent;
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

  // 3. Call the AI provider with our context.
  let groqOutput: GroqPlanOutput | null = null;
  let groqError: string | null = null;
  try {
    const raw = await callPlanGen({
      system: PLAN_SYSTEM_PROMPT,
      userJson: JSON.stringify(context),
    });
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`${activeProviderName()} returned non-JSON output`);
    }
    groqOutput = validateGroqOutput(parsed);
  } catch (err) {
    if (err instanceof PlanValidationError) {
      groqError = `validation: ${err.message}`;
    } else {
      groqError = errorMessage(err, "AI call failed");
    }
  }

  if (!groqOutput) {
    // 4. Fallback (PRD §1.6).
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
      fallbackReason: groqError ?? "AI provider unavailable",
    };
  }

  // 5. Persist.
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
    specific_time: t.specific_time,
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

  if (opts.regenerate && existing) {
    await supabase.from("daily_plan_regenerations").insert([
      {
        user_id: opts.userId,
        plan_id: planRow.id,
        reason: opts.reason ?? opts.userIntent ?? null,
      },
    ] as never);
  }

  void profile;
  return { ok: true, plan: planRow, tasks: insertedTasks ?? [] };
}

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

export type { DailyPlanRow, TaskRow, GenerationReason };
