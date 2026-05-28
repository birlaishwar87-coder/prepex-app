import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  return NextResponse.redirect(`${url.origin}/`, { status: 303 });
}
