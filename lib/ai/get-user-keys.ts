import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AiKeys } from "./provider";

/**
 * Loads the BYOK AI keys for a given user from their profile row.
 * Returns null fields for any unset key — caller passes the object
 * to callPlanGen / callChat, which decides which provider to use
 * (env fallback when all are null).
 *
 * Cached implicitly via React per-request (Supabase server client is
 * already cached). Each call is one tiny SELECT — no measurable cost.
 */
export async function getAiKeysForUser(userId: string): Promise<AiKeys> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("gemini_api_key, groq_api_key, anthropic_api_key")
    .eq("id", userId)
    .maybeSingle<{
      gemini_api_key: string | null;
      groq_api_key: string | null;
      anthropic_api_key: string | null;
    }>();

  return {
    gemini: data?.gemini_api_key ?? null,
    groq: data?.groq_api_key ?? null,
    anthropic: data?.anthropic_api_key ?? null,
  };
}

/** True when the user has at least one AI key configured. */
export async function userHasAnyAiKey(userId: string): Promise<boolean> {
  const keys = await getAiKeysForUser(userId);
  return !!(keys.gemini || keys.groq || keys.anthropic);
}
