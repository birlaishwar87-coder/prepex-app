"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
  fieldErrors: Partial<Record<"email" | "password", string>>;
};

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const redirectTo = (formData.get("redirect") as string | null) ?? null;

  const fieldErrors: LoginState["fieldErrors"] = {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "Enter a valid email";
  if (password.length < 1) fieldErrors.password = "Enter your password";

  if (Object.keys(fieldErrors).length > 0) {
    return { error: null, fieldErrors };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Vague message — never confirm whether an email exists. Standard practice.
    return { error: "Email or password is incorrect.", fieldErrors: {} };
  }

  // If the user came here from a protected route, send them back.
  if (redirectTo && redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  // Otherwise, decide between onboarding and the app.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle<{ onboarding_completed_at: string | null }>();
    if (!profile?.onboarding_completed_at) {
      redirect("/onboarding");
    }
  }

  redirect("/today");
}
