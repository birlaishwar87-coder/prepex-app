"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";

async function requireUser() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");
  return { supabase, user };
}

/**
 * Toggle a library bookmark for the current user.
 * Returns the new state so the client can update its UI without refetching.
 */
export async function toggleBookmarkAction(
  contentId: string
): Promise<{ error: string | null; bookmarked: boolean }> {
  const { supabase, user } = await requireUser();

  const { data: existing } = await supabase
    .from("library_bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("content_id", contentId)
    .maybeSingle<{ id: string }>();

  if (existing) {
    const { error } = await supabase
      .from("library_bookmarks")
      .delete()
      .eq("id", existing.id);
    if (error) return { error: error.message, bookmarked: true };
    revalidatePath("/library");
    return { error: null, bookmarked: false };
  }

  const row: TablesInsert<"library_bookmarks"> = {
    user_id: user.id,
    content_id: contentId,
  };
  const { error } = await supabase.from("library_bookmarks").insert(row as never);
  if (error) return { error: error.message, bookmarked: false };
  revalidatePath("/library");
  return { error: null, bookmarked: true };
}
