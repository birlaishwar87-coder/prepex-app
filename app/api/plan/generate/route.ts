import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateDailyPlan } from "@/lib/groq/generate-plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/plan/generate
//   body: { regenerate?: boolean, reason?: string, planDate?: string }
// returns 200 with { plan, tasks, fallback?, fallbackReason? }
// returns 401 if not authenticated, 500 with { error } on failure
export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { regenerate?: boolean; reason?: string | null; planDate?: string } = {};
  try {
    if (request.headers.get("content-length") !== "0") {
      body = await request.json();
    }
  } catch {
    // Tolerate empty/invalid body — defaults are fine.
  }

  const result = await generateDailyPlan({
    userId: user.id,
    regenerate: !!body.regenerate,
    reason: body.reason ?? null,
    planDate: body.planDate,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    plan: result.plan,
    tasks: result.tasks,
    fallback: "fallback" in result && result.fallback ? true : false,
    fallbackReason:
      "fallback" in result && result.fallback ? result.fallbackReason : undefined,
  });
}
