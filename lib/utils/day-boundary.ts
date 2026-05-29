// ============================================================
// Day boundary + late-night helpers (PRD §1.0.4, §1.2.2)
// ============================================================
//
// "Today" in Prepex isn't midnight-to-midnight — it's the student's
// chronotype-aware day boundary:
//   day person     → day rolls over at 5:00 AM
//   mixed schedule → 6:00 AM
//   night owl      → 12:00 noon
//
// All routines below operate on the profile's day_boundary_time so a
// night-owl student opening the app at 2:30 AM still sees "today's plan."
//
// Late-night signup (PRD §1.0.4): if onboarding completes within 3 hours
// of the day boundary (i.e. with ≤3 hours left in the student's day),
// the first plan is generated for *tomorrow*. Welcome card text shifts.

import type { Tables } from "@/lib/supabase/database.types";

export type Chronotype = "day" | "mixed" | "night";

/**
 * Compute the plan_date the student is *currently* on, given a profile.
 * Returns an ISO date string (YYYY-MM-DD) suitable for daily_plans.plan_date.
 *
 * Conceptually: if right now is past today's day_boundary_time, plan_date
 * is today. If it's before, we're still inside yesterday's "day."
 *
 * Timezone: respects profile.timezone (defaults to Asia/Kolkata).
 */
export function getCurrentPlanDate(profile: Pick<Tables<"profiles">, "day_boundary_time" | "timezone">, now: Date = new Date()): string {
  const tz = profile.timezone ?? "Asia/Kolkata";
  const dayBoundary = parseTimeHHMMSS(profile.day_boundary_time ?? "05:00:00");

  // Get year/month/day/hour/minute in user's TZ.
  const local = breakdownInTz(now, tz);

  // If we haven't crossed today's boundary yet, plan_date is "yesterday."
  const beforeBoundary =
    local.hour < dayBoundary.hours ||
    (local.hour === dayBoundary.hours && local.minute < dayBoundary.minutes);

  const date = new Date(Date.UTC(local.year, local.month - 1, local.day));
  if (beforeBoundary) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/**
 * The plan_date that should receive the FIRST plan after onboarding.
 *
 * If onboarding finished within 3 hours of the day boundary (PRD §1.0.4),
 * skip today and target tomorrow — generating a 6-hour plan for a day
 * that's 90% over is hostile.
 *
 * Returns { planDate, isLateNight }. isLateNight true triggers the
 * "Setting you up for tomorrow" welcome card.
 */
export function getFirstPlanDate(
  profile: Pick<Tables<"profiles">, "day_boundary_time" | "timezone" | "onboarding_completed_at">,
  now: Date = new Date()
): { planDate: string; isLateNight: boolean } {
  const tz = profile.timezone ?? "Asia/Kolkata";
  const dayBoundary = parseTimeHHMMSS(profile.day_boundary_time ?? "05:00:00");
  const local = breakdownInTz(now, tz);

  // Hours remaining until the *next* day_boundary in the user's local time.
  const boundaryMinutes = dayBoundary.hours * 60 + dayBoundary.minutes;
  const nowMinutes = local.hour * 60 + local.minute;
  let minutesUntilBoundary = boundaryMinutes - nowMinutes;
  if (minutesUntilBoundary <= 0) minutesUntilBoundary += 24 * 60;

  const isLateNight = minutesUntilBoundary <= 3 * 60;

  if (isLateNight) {
    // Tomorrow's date in user's TZ.
    const tomorrow = new Date(Date.UTC(local.year, local.month - 1, local.day + 1));
    return { planDate: tomorrow.toISOString().slice(0, 10), isLateNight: true };
  }
  return { planDate: getCurrentPlanDate(profile, now), isLateNight: false };
}

/**
 * Hours target for a given plan_date — weekday vs weekend split.
 * Weekend defined as Saturday + Sunday in the user's local timezone.
 */
export function getHoursTargetForDate(
  profile: Pick<
    Tables<"profiles">,
    "daily_hours_weekday" | "daily_hours_weekend" | "same_daily_target" | "timezone"
  >,
  planDate: string
): number {
  const weekday = profile.daily_hours_weekday ?? 6;
  const weekend = profile.same_daily_target ? weekday : profile.daily_hours_weekend ?? 8;

  // Date is just YYYY-MM-DD — treat as UTC and ask its day-of-week.
  const d = new Date(planDate + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0 Sun, 6 Sat
  return dow === 0 || dow === 6 ? weekend : weekday;
}

// ============================================================
// internals
// ============================================================
function parseTimeHHMMSS(t: string): { hours: number; minutes: number; seconds: number } {
  const [h = "0", m = "0", s = "0"] = t.split(":");
  return { hours: parseInt(h, 10), minutes: parseInt(m, 10), seconds: parseInt(s, 10) };
}

function breakdownInTz(now: Date, tz: string) {
  // Intl.DateTimeFormat is the only built-in way to get TZ-aware components.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    year: parseInt(parts.year ?? "1970", 10),
    month: parseInt(parts.month ?? "1", 10),
    day: parseInt(parts.day ?? "1", 10),
    hour: parseInt(parts.hour ?? "0", 10),
    minute: parseInt(parts.minute ?? "0", 10),
  };
}
