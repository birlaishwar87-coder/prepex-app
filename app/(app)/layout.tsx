import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/lib/supabase/get-user";

// All routes inside (app) read per-user data via cookies → must be SSR'd,
// not prerendered at build time. Without this, Next 14 attempts to statically
// generate /today, /revision, etc. and they fail because Supabase env vars
// aren't available during prerender.
export const dynamic = "force-dynamic";

// Server Component: pulls the signed-in user's profile to feed into the
// sidebar. The middleware ensures only authenticated users reach here, so
// profile is always present (unless something weird — fall back gracefully).
export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();

  const userName = profile?.first_name?.trim() || "Friend";
  const userMeta = profile?.goal
    ? `${prettyGoal(profile.goal)}${profile.current_class ? ` · ${prettyClass(profile.current_class)}` : ""}`
    : "Onboarding pending";

  return (
    <AppShell
      streak={profile?.streak_count ?? 0}
      userName={userName}
      userMeta={userMeta}
      signedIn={!!profile}
    >
      {children}
    </AppShell>
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
