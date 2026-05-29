// ============================================================
// Backlog priority decay (PRD §11.2)
// ============================================================
//
// LOCKED formula. Gradual decay, never zero:
//
//   priority_weight = max(0.2, 1.0 - days_overdue × 0.05)
//
// Day 0   → 1.0 (full priority)
// Day 5   → 0.75
// Day 10  → 0.50
// Day 14  → 0.30
// Day 16+ → 0.20 (floor)
//
// Manual review (student touches the item) resets `last_reviewed_at`
// to today, which moves the weight back to 1.0.
//
// User-added items with explicit priority bypass the time decay:
//   urgent → 1.0, normal → 0.8, low → 0.5

import type { Database } from "@/lib/supabase/database.types";

type BacklogState = Database["public"]["Enums"]["backlog_state_t"];
type BacklogPriority = Database["public"]["Enums"]["backlog_priority_t"];

const FLOOR = 0.2;
const PER_DAY = 0.05;

export function daysBetween(start: string, end: string): number {
  // Both inputs are YYYY-MM-DD. Treat as UTC noon to dodge DST.
  const a = new Date(start + "T12:00:00Z").getTime();
  const b = new Date(end + "T12:00:00Z").getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function computeBacklogPriority(opts: {
  state: BacklogState;
  priority: BacklogPriority;
  originalDate: string;
  lastReviewedAt: string | null;
  today: string;
}): { weight: number; daysOverdue: number } {
  // User-added items: their priority field is the source of truth, no decay.
  if (opts.state === "user_added") {
    return {
      weight:
        opts.priority === "urgent" ? 1.0 : opts.priority === "normal" ? 0.8 : 0.5,
      daysOverdue: 0,
    };
  }

  // Time-decayed items: count from last_reviewed_at if set, else original_date.
  const anchor = opts.lastReviewedAt ?? opts.originalDate;
  const days = daysBetween(anchor, opts.today);
  const weight = Math.max(FLOOR, 1.0 - days * PER_DAY);
  return { weight: Number(weight.toFixed(2)), daysOverdue: days };
}
