"use server";

import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export type StartState = {
  error: string | null;
  fieldError: string | null;
};

/**
 * Single-button onboarding for the closed community build.
 *
 * No public signup form. Each click on the landing CTA mints a fresh
 * Supabase user with a random `member-<uuid>@prepex.local` email + random
 * password (admin createUser), email-confirms it, then signs the same
 * browser in. The session cookie persists, so a returning visitor with a
 * valid cookie is bounced straight to /today by the landing server page.
 *
 * The `first_name` they typed goes through `user_metadata` → the
 * `handle_new_user` trigger lands it on `profiles.first_name`.
 */
export async function startMemberSessionAction(
  _prev: StartState,
  formData: FormData
): Promise<StartState> {
  const firstName = (formData.get("firstName") as string | null)?.trim() ?? "";
  if (firstName.length < 1) {
    return { error: null, fieldError: "Tell us what to call you" };
  }
  if (firstName.length > 40) {
    return { error: null, fieldError: "Keep it under 40 characters" };
  }

  const memberId = randomUUID();
  const email = `member-${memberId}@prepex.local`;
  // bcrypt has a hard 72-byte password ceiling — exceed it and GoTrue panics
  // with `bcrypt: password length exceeds 72 bytes`. A single UUID is 36 chars
  // (~128 bits of entropy), well clear of the limit.
  const password = randomUUID();

  try {
    const admin = getSupabaseAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName },
    });
    if (createError || !created?.user) {
      console.error("[start] admin.createUser failed:", createError);
      return {
        error: "Couldn't get you in right now. Try again in a moment.",
        fieldError: null,
      };
    }
  } catch (err) {
    console.error("[start] admin.createUser threw:", err);
    return {
      error:
        "Can't reach the server right now. The backend may be paused — try again in a minute.",
      fieldError: null,
    };
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      console.error("[start] signInWithPassword failed:", signInError);
      return {
        error: "Account created. Reload the page to continue.",
        fieldError: null,
      };
    }
  } catch (err) {
    console.error("[start] signInWithPassword threw:", err);
    return {
      error: "Couldn't sign you in. Reload the page to continue.",
      fieldError: null,
    };
  }

  redirect("/onboarding");
}
