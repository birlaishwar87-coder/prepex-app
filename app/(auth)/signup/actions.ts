"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type SignupState = {
  error: string | null;
  fieldErrors: Partial<Record<"email" | "password" | "firstName" | "phone", string>>;
};

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
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
  const { error } = await supabase.auth.signUp({
    email,
    password,
    phone: fullPhone,
    options: {
      data: {
        first_name: firstName,
      },
    },
  });

  if (error) {
    return { error: error.message, fieldErrors: {} };
  }

  // Profile row is auto-created by the handle_new_user trigger.
  // Whether Supabase auto-confirms email depends on dashboard settings.
  redirect("/onboarding");
}
