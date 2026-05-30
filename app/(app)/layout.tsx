import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/lib/supabase/get-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { daysBetween } from "@/lib/utils/backlog-priority";
import { MixpanelProvider } from "@/lib/analytics/mixpanel-provider";

export const dynamic = "force-dynamic";

const BACKLOG_VISIBLE_DAY = 7; // PRD §11.8

export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();

  const userName = profile?.first_name?.trim() || "Friend";
  const userMeta = profile?.goal
    ? `${prettyGoal(profile.goal)}${profile.current_class ? ` · ${prettyClass(profile.current_class)}` : ""}`
    : "Onboarding pending";

  let backlogCount: number | undefined = undefined;
  if (profile?.created_at) {
    const todayIso = new Date().toISOString().slice(0, 10);
    const accountAge = daysBetween(profile.created_at.slice(0, 10), todayIso);
    if (accountAge >= BACKLOG_VISIBLE_DAY) {
      const supabase = getSupabaseServerClient();
      const { count } = await supabase
        .from("backlog_items")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .in("state", ["active", "user_added"]);
      backlogCount = count ?? 0;
    }
  }

  // Mixpanel `identify` props — keep minimal and non-PII (no name, no phone).
  const mixpanelProps = profile
    ? {
        goal: profile.goal,
        current_class: profile.current_class,
        chronotype: profile.chronotype,
        streak_count: profile.streak_count,
        onboarding_completed: !!profile.onboarding_completed_at,
      }
    : undefined;

  return (
    <MixpanelProvider userId={profile?.id ?? null} userProps={mixpanelProps}>
      <AppShell
        streak={profile?.streak_count ?? 0}
        userName={userName}
        userMeta={userMeta}
        signedIn={!!profile}
        backlogCount={backlogCount}
      >
        {children}
      </AppShell>
    </MixpanelProvider>
  );
}

function prettyGoal(g: string): string {
  return (
    {
      jee_main: "JEE Main",
      jee_adv: "JEE Adv",
      neet: "NEET",
      cuet: "CUET",
      jee_cuet: "JEE + CUET",
      boards: "Boards",
      other: "Custom",
    }[g] ?? g
  );
}

function prettyClass(c: string): string {
  return (
    {
      class_11: "Class 11",
      class_12: "Class 12",
      dropper_1: "Dropper",
      dropper_2: "Dropper · 2nd",
      other: "Other",
    }[c] ?? c
  );
}
