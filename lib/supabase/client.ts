import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local."
    );
  }

  // Typed against the generated Database schema — all .from('xxx') calls
  // get auto-completion and type-checked row/insert/update shapes.
  return createBrowserClient<Database>(url, anonKey);
}
