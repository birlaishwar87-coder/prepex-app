"use server";

import { redirect } from "next/navigation";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

export type SignupState = {
  error: string | null;
  fieldErrors: Partial<Record<"email" | "password" | "firstName" | "phone", string>>;
};

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = (formData.get("email") as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const firstName = (formData.get("firstName") as string | null)?.trim() ?? "";
  const country = (formData.get("country") as string | null) ?? "+91";
  const phone = (formData.get("phone") as string | null)?.replace(/\s+/g, "") ?? "";

  const fieldErrors: SignupState["fieldErrors"] = {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email";
  }
  if (password.length < 8) {
    fieldErrors.password = "At least 8 characters";
  }
  if (firstName.length < 1) {
    fieldErrors.firstName = "First name is needed";
  }
  if (phone.length < 7) {
    fieldErrors.phone = "Enter a phone number";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const supabase = getSupabaseServerClient();
  const fullPhone = `${country}${phone}`;

  // 1. Create the account. Phone goes onto auth.users; first_name flows
  // through raw_user_meta_data so the handle_new_user trigger picks it up.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    phone: fullPhone,
    options: { data: { first_name: firstName } },
  });

  if (signUpError) {
    // Email rate limit, duplicate user, etc. — surface the message.
    return { error: signUpError.message, fieldErrors: {} };
  }
  if (!signUpData.user) {
    return { error: "Signup didn't complete. Try again in a moment.", fieldErrors: {} };
  }

  // 2. Auto-confirm the email via service-role admin client.
  //
  // DEV CONVENIENCE — revisit before production launch:
  //   In production we should either send a real confirmation email
  //   (Supabase dashboard → Email templates wired to Resend/SendGrid)
  //   OR keep auto-confirm but add a phone OTP gate. For V1 dev, this lets
  //   users sign up and immediately land in onboarding without an
  //   email-verification round-trip.
  const admin = getSupabaseAdminClient();
  const { error: confirmError } = await admin.auth.admin.updateUserById(signUpData.user.id, {
    email_confirm: true,
  });
  if (confirmError) {
    // Non-fatal — surface but don't block.
    console.error("[signup] auto-confirm failed:", confirmError);
  }

  // 3. Establish a session right now so they don't have to log in.
  if (!signUpData.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      // Account exists but couldn't sign in — they can retry from /login.
      return {
        error: "Account created. Please sign in to continue.",
        fieldErrors: {},
      };
    }
  }

  // Profile row exists (created by handle_new_user trigger). Send them to
  // onboarding to fill in the rest.
  redirect("/onboarding");
}
