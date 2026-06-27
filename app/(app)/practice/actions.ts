"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import { checkAnswer, seededShuffle, type QuestionType } from "@/lib/practice/question-utils";

type PracticeMode = Database["public"]["Enums"]["practice_mode_t"];
type Subject = Database["public"]["Enums"]["subject_t"];
type Difficulty = Database["public"]["Enums"]["difficulty_t"];
type MistakeTag = Database["public"]["Enums"]["mistake_tag_t"];
type QuestionSource = Database["public"]["Enums"]["question_source_t"];

// ============================================================
// Helpers — same `as never` workaround as Phase 1
// ============================================================
async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function updateSession(id: string, patch: TablesUpdate<"practice_sessions">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("practice_sessions")
    .update(patch as never)
    .eq("id", id);
  return error;
}

async function updateAttempt(id: string, patch: TablesUpdate<"question_attempts">) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("question_attempts")
    .update(patch as never)
    .eq("id", id);
  return error;
}

async function updateMistakeEntry(
  id: string,
  patch: TablesUpdate<"mistake_notebook_entries">
) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("mistake_notebook_entries")
    .update(patch as never)
    .eq("id", id);
  return error;
}

// ============================================================
// Start a practice session (PRD §5.3 + §5.4)
// ============================================================
export interface StartSessionInput {
  mode: PracticeMode;
  subject?: Subject | null;
  chapterIds?: string[];
  topic?: string | null;
  difficulties?: Difficulty[];
  questionTypes?: QuestionType[];
  sources?: QuestionSource[];
  pyqYears?: number[];
  count?: number;
  timeLimitMinutes?: number | null;
}

export type StartSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string; reason: "no_questions" | "limit" | "auth" | "unknown" };

const DAILY_CUSTOM_LIMIT = 5; // PRD §5.3.3

export async function startPracticeSessionAction(
  input: StartSessionInput
): Promise<StartSessionResult> {
  const { supabase, user } = await requireUser();

  // PRD §5.3.3: enforce 5 Custom sessions per day cap
  if (input.mode === "custom") {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const { count } = await supabase
      .from("practice_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("mode", "custom")
      .gte("started_at", `${today}T00:00:00Z`)
      .lt("started_at", `${tomorrow}T00:00:00Z`);
    if ((count ?? 0) >= DAILY_CUSTOM_LIMIT) {
      return {
        ok: false,
        error: `Custom Practice has a ${DAILY_CUSTOM_LIMIT} session/day limit. Tomorrow you can again.`,
        reason: "limit",
      };
    }
  }

  // ---- Select questions matching filters ----
  let q = supabase.from("questions").select("id, subject, chapter, topic, difficulty");
  if (input.subject) q = q.eq("subject", input.subject);
  if (input.chapterIds && input.chapterIds.length > 0) {
    q = q.in("chapter_id", input.chapterIds);
  }
  if (input.topic) q = q.ilike("topic", `%${input.topic}%`);
  if (input.difficulties && input.difficulties.length > 0) {
    q = q.in("difficulty", input.difficulties);
  }
  if (input.questionTypes && input.questionTypes.length > 0) {
    q = q.in("question_type", input.questionTypes);
  }
  if (input.sources && input.sources.length > 0) {
    q = q.in("source", input.sources);
  }
  if (input.pyqYears && input.pyqYears.length > 0) {
    q = q.in("pyq_year", input.pyqYears);
  }

  const { data: pool } = await q
    .limit(200)
    .returns<Array<{ id: string }>>();

  if (!pool || pool.length === 0) {
    return {
      ok: false,
      error:
        "No questions matched these filters yet. Real content seeds in Phase 2.5 — try the demo session in the meantime.",
      reason: "no_questions",
    };
  }

  // Deterministic shuffle so a refresh during setup doesn't surprise the
  // student — but use Date.now() to seed so different sessions get
  // different orders.
  const seed = `${user.id}-${Date.now()}`;
  const ordered = seededShuffle(pool, seed);
  const targetCount = Math.min(input.count ?? 10, ordered.length);
  const selected = ordered.slice(0, targetCount).map((p) => p.id);

  // ---- Create the session row ----
  const sessionRow: TablesInsert<"practice_sessions"> = {
    user_id: user.id,
    mode: input.mode,
    filters: {
      subject: input.subject ?? null,
      chapterIds: input.chapterIds ?? [],
      topic: input.topic ?? null,
      difficulties: input.difficulties ?? [],
      questionTypes: input.questionTypes ?? [],
      sources: input.sources ?? [],
      pyqYears: input.pyqYears ?? [],
    },
    question_ids: selected,
    total_questions: selected.length,
    planned_duration_sec:
      input.timeLimitMinutes != null ? input.timeLimitMinutes * 60 : null,
    status: "active",
  };
  const { data: session, error } = await supabase
    .from("practice_sessions")
    .insert(sessionRow as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !session) {
    return { ok: false, error: error?.message ?? "Couldn't start session", reason: "unknown" };
  }

  return { ok: true, sessionId: session.id };
}

// ============================================================
// Submit answer for a single question (PRD §5.4.2 + §5.5)
// ============================================================
export interface SubmitAnswerInput {
  sessionId: string;
  questionId: string;
  questionType: QuestionType;
  correctAnswer: string;
  selectedAnswer: string | null;
  timeSpentSec: number;
  markedForReview: boolean;
  /** Cached chapter + topic so we don't refetch the question for mistake auto-add. */
  chapter: string | null;
  topic: string | null;
  subTopic: string | null;
}

export interface SubmitAnswerResult {
  ok: boolean;
  error: string | null;
  isCorrect: boolean;
  attemptId: string | null;
}

export async function submitAnswerAction(
  input: SubmitAnswerInput
): Promise<SubmitAnswerResult> {
  const { supabase, user } = await requireUser();

  const isCorrect = checkAnswer(input.questionType, input.correctAnswer, input.selectedAnswer);

  const attemptRow: TablesInsert<"question_attempts"> = {
    user_id: user.id,
    session_id: input.sessionId,
    question_id: input.questionId,
    selected_answer: input.selectedAnswer,
    is_correct: input.selectedAnswer === null ? null : isCorrect,
    time_spent_sec: Math.max(0, Math.round(input.timeSpentSec)),
    marked_for_review: input.markedForReview,
  };
  const { data: attempt, error } = await supabase
    .from("question_attempts")
    .insert(attemptRow as never)
    .select("id")
    .single<{ id: string }>();

  if (error || !attempt) {
    return { ok: false, error: error?.message ?? "Couldn't record attempt", isCorrect, attemptId: null };
  }

  // Auto-add to Mistake Notebook on wrong (PRD §5.6.1, app-code path per
  // Phase 2.1 decision). Skip when skipped (selected_answer === null) —
  // a skip isn't a "mistake" worth scheduling.
  if (input.selectedAnswer !== null && !isCorrect) {
    const sevenDaysOut = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const notebookRow: TablesInsert<"mistake_notebook_entries"> = {
      user_id: user.id,
      source: "practice",
      entry_type: "text_question",
      question_id: input.questionId,
      student_answer: input.selectedAnswer,
      correct_answer: input.correctAnswer,
      topic: input.topic,
      sub_topic: input.subTopic,
      next_review_date: sevenDaysOut,
      current_interval_days: 1,
    };
    // We don't error if the notebook insert fails — the attempt still saves.
    await supabase.from("mistake_notebook_entries").insert(notebookRow as never);
  }

  return { ok: true, error: null, isCorrect, attemptId: attempt.id };
}

// ============================================================
// Tag a mistake post-session (PRD §5.5.3)
// ============================================================
export async function tagMistakeAction(args: {
  attemptId: string;
  tag: MistakeTag;
}): Promise<{ error: string | null }> {
  const err = await updateAttempt(args.attemptId, {
    mistake_tag: args.tag,
    tagged_at: new Date().toISOString(),
  });
  if (err) return { error: err.message };
  return { error: null };
}

// ============================================================
// Complete the session
// ============================================================
export async function completeSessionAction(sessionId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  // Pull all attempts for this session to compute correct_count + time_taken
  const { data: attempts } = await supabase
    .from("question_attempts")
    .select("is_correct, time_spent_sec, marked_for_review, selected_answer")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .returns<
      Array<{
        is_correct: boolean | null;
        time_spent_sec: number | null;
        marked_for_review: boolean | null;
        selected_answer: string | null;
      }>
    >();

  const list = attempts ?? [];
  const correctCount = list.filter((a) => a.is_correct === true).length;
  const skippedCount = list.filter((a) => a.selected_answer == null).length;
  const reviewCount = list.filter((a) => a.marked_for_review).length;
  const timeTakenSec = list.reduce((acc, a) => acc + (a.time_spent_sec ?? 0), 0);

  const err = await updateSession(sessionId, {
    status: "completed",
    completed_at: new Date().toISOString(),
    correct_count: correctCount,
    skipped_count: skippedCount,
    marked_for_review_count: reviewCount,
    time_taken_sec: timeTakenSec,
  });
  if (err) return { error: err.message };

  revalidatePath("/practice");
  return { error: null };
}

// ============================================================
// Retest a mistake (PRD §5.6.4 spaced repetition)
// ============================================================
const MISTAKE_INTERVALS = [1, 3, 7, 14, 30] as const;

export async function retestMistakeAction(args: {
  entryId: string;
  rating: Difficulty;
}): Promise<{ error: string | null; archived: boolean }> {
  const { supabase, user } = await requireUser();

  const { data: entry } = await supabase
    .from("mistake_notebook_entries")
    .select("id, current_interval_days, consecutive_easy_count, review_count")
    .eq("id", args.entryId)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      current_interval_days: number | null;
      consecutive_easy_count: number | null;
      review_count: number | null;
    }>();
  if (!entry) return { error: "Entry not found", archived: false };

  // Interval math
  const current = entry.current_interval_days ?? 1;
  let next: number;
  if (args.rating === "hard") {
    next = 1; // PRD §5.6.4 — Hard resets to +1
  } else if (args.rating === "easy") {
    next = Math.min(60, current * 2); // double, cap at 60
  } else {
    const idx = MISTAKE_INTERVALS.findIndex((i) => i >= current);
    next =
      idx === -1
        ? MISTAKE_INTERVALS[MISTAKE_INTERVALS.length - 1]
        : MISTAKE_INTERVALS[Math.min(idx + 1, MISTAKE_INTERVALS.length - 1)];
  }

  // Consecutive Easy counter — 3 in a row archives.
  const newEasyCount =
    args.rating === "easy" ? (entry.consecutive_easy_count ?? 0) + 1 : 0;
  const shouldArchive = newEasyCount >= 3;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + next);

  const patch: TablesUpdate<"mistake_notebook_entries"> = {
    difficulty_rating: args.rating,
    current_interval_days: next,
    next_review_date: nextReviewDate.toISOString().slice(0, 10),
    last_reviewed_at: new Date().toISOString(),
    review_count: (entry.review_count ?? 0) + 1,
    consecutive_easy_count: newEasyCount,
    archived_at: shouldArchive ? new Date().toISOString() : null,
  };

  const err = await updateMistakeEntry(entry.id, patch);
  if (err) return { error: err.message, archived: false };

  revalidatePath("/practice/mistakes");
  return { error: null, archived: shouldArchive };
}

// ============================================================
// Type re-exports for client components
// ============================================================
export type { Difficulty, MistakeTag, PracticeMode, QuestionType, Subject };
export type PracticeSessionRow = Tables<"practice_sessions">;
export type QuestionAttemptRow = Tables<"question_attempts">;
export type QuestionRow = Tables<"questions">;
