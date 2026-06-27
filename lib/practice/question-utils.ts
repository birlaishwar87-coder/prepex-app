// ============================================================
// Shared helpers for Practice / Mistake review
// ============================================================

import type { Database } from "@/lib/supabase/database.types";

type QuestionType = Database["public"]["Enums"]["question_type_t"];
type Subject = Database["public"]["Enums"]["subject_t"];

export const SUBJECT_COLORS: Record<string, string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
  revision: "#FBBF24",
  wellness: "#6EE7B7",
};

export const SUBJECT_LABELS: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Mathematics",
};

export function colorForSubject(s: string | null | undefined): string {
  return s ? SUBJECT_COLORS[s] ?? "#A5B4FC" : "#A5B4FC";
}

export function labelForSubject(s: string | null | undefined): string {
  if (!s) return "—";
  return SUBJECT_LABELS[s] ?? s;
}

/**
 * Compare a student's answer to the correct answer.
 *
 * Single-correct: 'A' === 'A'
 * Multi-correct:  'AB' (sorted) compared against sorted correct
 * Integer:        '42' compared as integer
 * Assertion:      same as single-correct
 */
export function checkAnswer(
  type: QuestionType,
  correct: string,
  student: string | null
): boolean {
  if (student == null || student === "") return false;

  if (type === "multiple_correct") {
    const norm = (s: string) =>
      s.replace(/[\s,]+/g, "").toUpperCase().split("").sort().join("");
    return norm(correct) === norm(student);
  }

  if (type === "integer") {
    const a = parseFloat(correct);
    const b = parseFloat(student);
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
    // Tolerance for floating-point integer answers (rare).
    return Math.abs(a - b) < 1e-6;
  }

  // single_correct / assertion_reason
  return correct.trim().toUpperCase() === student.trim().toUpperCase();
}

/**
 * Sort questions deterministically for a session — same filter inputs
 * should yield the same order so a refresh doesn't surprise the student.
 * For now we shuffle pseudorandomly using a seed derived from session_id.
 */
export function seededShuffle<T>(arr: T[], seed: string): T[] {
  if (arr.length <= 1) return arr.slice();
  const result = arr.slice();
  let s = 0;
  for (let i = 0; i < seed.length; i++) {
    s = (s * 31 + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) | 0;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** mm:ss formatter for the session timer */
export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type { QuestionType, Subject };
