// ============================================================
// Types for the AI planner I/O contract
// ============================================================
//
// PlanContext  → what we SEND to Groq (in the user message JSON)
// GroqPlanOutput → what Groq RETURNS (validated before persistence)
//
// Keep these in sync with the system prompt's "OUTPUT FORMAT" section.

import type { Database } from "@/lib/supabase/database.types";

type Subject = Database["public"]["Enums"]["subject_t"];
type TaskType = Database["public"]["Enums"]["task_type_t"];
type TimeWindow = Database["public"]["Enums"]["time_window_t"];
type CheckinResponse = Database["public"]["Enums"]["checkin_response_t"];
type Goal = Database["public"]["Enums"]["goal_type"];
type Chronotype = Database["public"]["Enums"]["chronotype_t"];

// ============================================================
// Input context
// ============================================================
export interface PlanContext {
  user: {
    first_name: string | null;
    goal: Goal | null;
    exam_date: string | null; // ISO date
    days_to_exam: number | null;
    daily_hours_target: number; // for this plan_date
    time_windows: TimeWindow[];
    chronotype: Chronotype;
    coaching: { name: string | null; batch: string | null } | null;
  };
  plan_date: string; // ISO YYYY-MM-DD
  is_first_plan: boolean;
  is_late_night_signup: boolean;

  checkin: {
    response: CheckinResponse | null;
    skipped: boolean;
  };

  // PRD §4.3 Bad Day Protocol — true when this is a return after 2+
  // consecutive inactive days. System prompt routes to the 3-task light
  // plan when this is set.
  is_bad_day_return: boolean;
  days_since_last_active: number;

  // Master syllabus available to the planner. Groq MUST pick chapter names
  // from this list — never invent. We provide chapter_id alongside so the
  // server can stitch by ID, not fuzzy match on names.
  syllabus: Array<{
    chapter_id: string;
    subject: "physics" | "chemistry" | "maths";
    name: string;
  }>;

  // Topics the student has studied (in revision rotation).
  studied: Array<{
    chapter_id: string;
    chapter: string;
    subject: "physics" | "chemistry" | "maths";
    last_difficulty: "easy" | "medium" | "hard" | null;
    days_since_revised: number | null;
  }>;

  // Revisions due today or earlier (sorted by overdue first).
  revisions_due: Array<{
    chapter_id: string;
    chapter: string;
    subject: "physics" | "chemistry" | "maths";
    days_overdue: number;
    last_difficulty: "easy" | "medium" | "hard" | null;
    revision_count: number;
  }>;

  // Backlog items, sorted by weight desc (highest priority first).
  backlog: Array<{
    backlog_id: string;
    subject: Subject;
    chapter: string | null;
    chapter_id: string | null;
    task_type: TaskType | null;
    estimated_minutes: number | null;
    priority_weight: number; // 0.20 – 1.00
    days_overdue: number;
  }>;

  // Order-of-precedence flags (PRD §1.2.1).
  is_no_study_day: boolean;
  is_mock_day: boolean;
  recovery_mode: { active: boolean; type: "backlog" | "burnout" | null; day_of_7: number | null };

  // Anchor (custom) tasks for this date that AI must plan around.
  anchors: Array<{
    subject: Subject;
    chapter: string | null;
    chapter_id: string | null;
    task_type: TaskType;
    estimated_minutes: number;
    time_window: TimeWindow;
  }>;
}

// ============================================================
// Output from Groq (must validate before persistence)
// ============================================================
export type GenerationReason =
  | "standard"
  | "regenerate"
  | "no_study_day"
  | "mock_day"
  | "recovery_week"
  | "bad_day_protocol";

export interface GroqPlanTask {
  subject: Subject;
  chapter: string | null;
  chapter_id: string | null;
  topic: string | null;
  task_type: TaskType;
  estimated_minutes: number;
  time_window: TimeWindow;
}

export interface GroqPlanOutput {
  generation_reason: GenerationReason;
  total_minutes: number;
  tasks: GroqPlanTask[];
}

// ============================================================
// Validation
// ============================================================
const SUBJECT_VALUES: Subject[] = ["physics", "chemistry", "maths", "revision", "wellness"];
const TASK_TYPE_VALUES: TaskType[] = [
  "new_learning",
  "revision",
  "practice",
  "dpp",
  "mock_review",
  "wellness",
];
const TIME_WINDOW_VALUES: TimeWindow[] = ["morning", "midday", "evening", "night", "anytime"];
const GENERATION_REASON_VALUES: GenerationReason[] = [
  "standard",
  "regenerate",
  "no_study_day",
  "mock_day",
  "recovery_week",
  "bad_day_protocol",
];

export function validateGroqOutput(raw: unknown): GroqPlanOutput {
  if (!raw || typeof raw !== "object") {
    throw new PlanValidationError("Response is not a JSON object");
  }
  const o = raw as Record<string, unknown>;

  if (typeof o.generation_reason !== "string" || !GENERATION_REASON_VALUES.includes(o.generation_reason as GenerationReason)) {
    throw new PlanValidationError(`Invalid generation_reason: ${o.generation_reason}`);
  }
  if (typeof o.total_minutes !== "number" || o.total_minutes < 0 || o.total_minutes > 24 * 60) {
    throw new PlanValidationError(`Invalid total_minutes: ${o.total_minutes}`);
  }
  if (!Array.isArray(o.tasks)) {
    throw new PlanValidationError("tasks is not an array");
  }

  const tasks: GroqPlanTask[] = o.tasks.map((t, i) => validateTask(t, i));
  return {
    generation_reason: o.generation_reason as GenerationReason,
    total_minutes: o.total_minutes,
    tasks,
  };
}

function validateTask(raw: unknown, idx: number): GroqPlanTask {
  if (!raw || typeof raw !== "object") {
    throw new PlanValidationError(`tasks[${idx}] is not an object`);
  }
  const t = raw as Record<string, unknown>;

  if (typeof t.subject !== "string" || !SUBJECT_VALUES.includes(t.subject as Subject)) {
    throw new PlanValidationError(`tasks[${idx}].subject invalid: ${t.subject}`);
  }
  if (typeof t.task_type !== "string" || !TASK_TYPE_VALUES.includes(t.task_type as TaskType)) {
    throw new PlanValidationError(`tasks[${idx}].task_type invalid: ${t.task_type}`);
  }
  if (
    typeof t.time_window !== "string" ||
    !TIME_WINDOW_VALUES.includes(t.time_window as TimeWindow)
  ) {
    throw new PlanValidationError(`tasks[${idx}].time_window invalid: ${t.time_window}`);
  }
  if (typeof t.estimated_minutes !== "number" || t.estimated_minutes <= 0 || t.estimated_minutes > 240) {
    throw new PlanValidationError(`tasks[${idx}].estimated_minutes out of range: ${t.estimated_minutes}`);
  }

  return {
    subject: t.subject as Subject,
    chapter: typeof t.chapter === "string" ? t.chapter : null,
    chapter_id: typeof t.chapter_id === "string" ? t.chapter_id : null,
    topic: typeof t.topic === "string" ? t.topic : null,
    task_type: t.task_type as TaskType,
    estimated_minutes: Math.round(t.estimated_minutes),
    time_window: t.time_window as TimeWindow,
  };
}

export class PlanValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanValidationError";
  }
}
