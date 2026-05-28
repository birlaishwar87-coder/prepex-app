import "server-only";
import { cache } from "react";
import { getSupabaseServerClient } from "./server";
import type { Tables } from "./database.types";

/**
 * Cached per-request user fetch. Use in Server Components instead of
 * calling supabase.auth.getUser() directly — saves duplicate round-trips
 * when multiple components on the same page need the user.
 */
export const getCurrentUser = cache(async () => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/**
 * Returns the user's profile row, or null if unauthenticated.
 * Also cached per request.
 */
export const getCurrentProfile = cache(async (): Promise<Tables<"profiles"> | null> => {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return profile ?? null;
});
