"use client";

import mixpanel from "mixpanel-browser";

let initialized = false;

export function initMixpanel(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return; // Quietly no-op when missing — never break the app for missing analytics.

  mixpanel.init(token, {
    debug: process.env.NODE_ENV === "development",
    track_pageview: true,
    persistence: "localStorage",
    ignore_dnt: false,
  });
  initialized = true;
}

export function track(event: PrepexEvent, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  mixpanel.track(event, props);
}

export function identify(userId: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !initialized) return;
  mixpanel.identify(userId);
  if (props) mixpanel.people.set(props);
}

export function resetMixpanel(): void {
  if (typeof window === "undefined" || !initialized) return;
  mixpanel.reset();
}

// Canonical event names — keep this list as the source of truth so we
// don't drift into typos. Add new events here when wiring them up.
export type PrepexEvent =
  | "signup_started"
  | "signup_completed"
  | "login_completed"
  | "onboarding_step_completed"
  | "first_plan_generated"
  | "task_completed"
  | "plan_regenerated"
  | "checkin_submitted"
  | "revision_completed"
  | "backlog_recovery_entered"
  | "backlog_recovery_exited"
  | "ai_chat_message_sent"
  | "bad_day_protocol_triggered";
