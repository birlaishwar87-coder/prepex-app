import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/get-user";
import { OnboardingFlow, type ChapterRow, type InitialData } from "./onboarding-flow";

// Per-user; never prerender.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();

  // Middleware guarantees auth — if profile is somehow missing, send back home.
  if (!profile) {
    redirect("/");
  }

  // Already done? Skip to the app.
  if (profile.onboarding_completed_at) {
    redirect("/today");
  }

  // Pre-fetch the master chapter list for step 6.
  const supabase = getSupabaseServerClient();
  const { data: chaptersRaw } = await supabase
    .from("chapters")
    .select("id, subject, name, chapter_order")
    .order("subject", { ascending: true })
    .order("chapter_order", { ascending: true })
    .returns<
      Array<{
        id: string;
        subject: "physics" | "chemistry" | "maths";
        name: string;
        chapter_order: number | null;
      }>
    >();

  const chapters: ChapterRow[] = (chaptersRaw ?? []).map((c) => ({
    id: c.id,
    subject: c.subject,
    name: c.name,
    chapter_order: c.chapter_order,
  }));

  // Hydrate the wizard with anything we already know — lets the user resume.
  const initialData: InitialData = {
    goal: profile.goal,
    examDate: profile.exam_date,
    currentClass: profile.current_class,
    coachType: profile.coach_type,
    coachingName: profile.coaching_name,
    batch: profile.batch,
    hoursWeekday: profile.daily_hours_weekday,
    hoursWeekend: profile.daily_hours_weekend,
    sameDailyTarget: profile.same_daily_target,
    windows: profile.time_windows ?? [],
  };

  const initialStep = Math.min(7, Math.max(1, profile.onboarding_current_step ?? 1));

  return (
    <OnboardingFlow chapters={chapters} initialStep={initialStep} initialData={initialData} />
  );
}
