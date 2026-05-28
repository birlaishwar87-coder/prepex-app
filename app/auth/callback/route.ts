import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth callback. Supabase redirects here after Google sign-in with a `code`
 * query param. We exchange it for a session, then redirect into the app.
 *
 * If the user is brand-new (no profile row or onboarding not completed),
 * send them to /onboarding. Otherwise to /today.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? null;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Decide landing route. If the user just signed up via Google, their profile
  // exists (created by handle_new_user trigger) but onboarding_completed_at is
  // null — route to onboarding.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = next ?? "/today";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle<{ onboarding_completed_at: string | null }>();
    if (!profile?.onboarding_completed_at) {
      destination = "/onboarding";
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
