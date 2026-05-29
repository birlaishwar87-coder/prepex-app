"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateDailyPlan } from "@/lib/groq/generate-plan";

export type GenerateState = {
  error: string | null;
  fallback?: boolean;
  fallbackReason?: string | null;
};

/**
 * Server action wrapper around generateDailyPlan. Used by the minimal
 * Phase-5 /today surface. Phase 6 replaces this with the polished UX
 * (check-in modal, regenerate w/ reason, task cards).
 */
export async function generateTodayPlanAction(
  _prev: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const regenerate = formData.get("regenerate") === "true";
  const reason = (formData.get("reason") as string | null) ?? null;

  const result = await generateDailyPlan({
    userId: user.id,
    regenerate,
    reason,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/today");
  return {
    error: null,
    fallback: "fallback" in result && result.fallback,
    fallbackReason: "fallback" in result && result.fallback ? result.fallbackReason : null,
  };
}
