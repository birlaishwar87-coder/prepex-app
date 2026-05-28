import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./database.types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Auth-scoped server client — reads the user from cookies. Use this in
// Server Components, Route Handlers, and Server Actions where you want
// RLS to apply with the user's session.
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — cookies are read-only there.
          // Setting happens in Route Handlers / Server Actions, where the
          // request is mutable. Safe to swallow here.
        }
      },
    },
  });
}

// Admin client using the service role key. NEVER expose to the browser.
// Use only for trusted server-side operations that need to bypass RLS
// (e.g. webhooks, scheduled jobs). Most code should use getSupabaseServerClient.
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
    );
  }

  return createServerClient<Database>(url, serviceKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });
}
