// ============================================================
// Phase transitions (PRD §2.3 — LOCKED)
// ============================================================
//
//  Not Started → In Revision    on first study (handled at insert time)
//  In Revision → Mastered       5 consecutive Medium/Easy across 30+ days
//  Mastered → In Revision       one Hard rating
//  In Revision → Not Started    manual reset (Settings; rare)
//
// "Difficulty history" is a JSONB array on user_topic_state, appended on
// every revision. Each entry: { rating, date }.

import type { Difficulty } from "./intervals";

export type DifficultyHistoryEntry = {
  rating: Difficulty;
  date: string; // ISO YYYY-MM-DD
};

const REQUIRED_CONSECUTIVE = 5;
const MIN_DAYS_BEFORE_MASTERY = 30;

/**
 * Should this topic move from In Revision → Mastered?
 * Rules: 5 consecutive non-Hard ratings AND at least 30 days since first study.
 */
export function shouldMaster(args: {
  historyAfterThisRating: DifficultyHistoryEntry[];
  firstStudiedAt: string | null;
  today: string;
}): boolean {
  if (!args.firstStudiedAt) return false;

  if (args.historyAfterThisRating.length < REQUIRED_CONSECUTIVE) return false;

  const lastN = args.historyAfterThisRating.slice(-REQUIRED_CONSECUTIVE);
  const allNonHard = lastN.every((e) => e.rating !== "hard");
  if (!allNonHard) return false;

  const first = new Date(args.firstStudiedAt.slice(0, 10) + "T12:00:00Z").getTime();
  const today = new Date(args.today + "T12:00:00Z").getTime();
  const daysSinceFirst = Math.floor((today - first) / 86_400_000);
  return daysSinceFirst >= MIN_DAYS_BEFORE_MASTERY;
}

/**
 * Should this topic move from Mastered → In Revision?
 * One Hard from a mastered topic kicks it back into rotation.
 */
export function shouldUnmaster(rating: Difficulty): boolean {
  return rating === "hard";
}

/**
 * All-Hard onboarding pattern detection (PRD §2.2.3).
 *
 * If a student rates many onboarding-marked chapters Hard on their FIRST
 * revision, we suspect they marked things as studied too generously. The
 * prompt to move them to New Learning ships in Phase 10 polish; for now,
 * this function exists so detection logic is centralised.
 */
export function isAllHardFirstRevisionPattern(args: {
  onboardingMarkedHardCount: number;
  onboardingMarkedTotalCount: number;
  /** Minimum sample size before we suggest anything. */
  threshold?: number;
}): boolean {
  const min = args.threshold ?? 5;
  if (args.onboardingMarkedTotalCount < min) return false;
  return args.onboardingMarkedHardCount / args.onboardingMarkedTotalCount >= 0.8;
}
