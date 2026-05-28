import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Routes that require a signed-in user.
const PROTECTED_PREFIXES = ["/today", "/revision", "/backlog", "/chat", "/settings", "/onboarding"];
// Routes that should bounce signed-in users away (already authenticated).
const AUTH_PREFIXES = ["/login", "/signup"];

/**
 * Refreshes the Supabase session on every request AND handles route protection.
 *
 * Per @supabase/ssr docs: do not write any logic between `createServerClient`
 * and `supabase.auth.getUser()`. A simple mistake can make users get
 * randomly logged out — the call must happen first to refresh tokens.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: must be called before any branching logic to refresh tokens.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Remember where they wanted to go so we can redirect back after login.
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
