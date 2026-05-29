// ============================================================
// Spaced repetition interval math (PRD §2.2 — LOCKED)
// ============================================================
//
// Initial schedule from first study:
//   Day +1  → first revision
//   Day +3  → second
//   Day +7  → third
//   Day +14 → fourth
//   Day +30 → fifth (mastery review)
//   Day +60 → maintenance check
//
// Difficulty rating applied AFTER a revision (PRD §2.2.2):
//   Hard   → interval RESETS to +1 day (not stable, revisit soon)
//   Medium → interval continues normally
//   Easy   → interval DOUBLES (capped at 60)
//
// Onboarding-marked chapters (PRD §2.2.3) start their first revision
// at +7 days from signup — that's handled at insert-time in Phase 4's
// saveTopicsAction. From the first rating onward, we use the math here.
//
// Everything is pure. No DB. No date math errors — we go through ISO
// strings + the helper below.

export type Difficulty = "easy" | "medium" | "hard";

export const PROGRESSION = [1, 3, 7, 14, 30, 60] as const;
const MAX_INTERVAL = 60;

/**
 * Given the interval that was just used and the rating the student gave,
 * compute the NEXT interval (days until the next revision).
 */
export function computeNextInterval(
  currentIntervalDays: number,
  rating: Difficulty
): number {
  if (rating === "hard") return 1;

  if (rating === "easy") {
    // Double, but never beyond 60.
    return Math.min(MAX_INTERVAL, currentIntervalDays * 2);
  }

  // Medium → step forward in the canonical progression. We find the first
  // step ≥ current interval and advance one beyond it. This keeps drift-out
  // schedules (someone whose interval was 14 from an Easy 7→14 jump) on rails.
  const idx = PROGRESSION.findIndex((p) => p >= currentIntervalDays);
  if (idx === -1) return MAX_INTERVAL;
  return PROGRESSION[Math.min(idx + 1, PROGRESSION.length - 1)];
}

/**
 * Date arithmetic in UTC. Both inputs/outputs are YYYY-MM-DD strings.
 * Always passing through noon UTC dodges DST surprises.
 */
export function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayISO(now: Date = new Date()): string {
  // Use the server's UTC date as "today" for the queue. The user's actual
  // chronotype-aware plan_date is computed elsewhere; here we just need a
  // consistent reference for next_revision_due ordering.
  return now.toISOString().slice(0, 10);
}
