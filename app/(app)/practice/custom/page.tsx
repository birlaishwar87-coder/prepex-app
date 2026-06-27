import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { FilterForm, type ChapterOption } from "../components/filter-form";

export const metadata = { title: "Custom Practice Builder · Prepex" };

const DAILY_LIMIT = 5;

export default async function CustomPracticePage() {
  const supabase = getSupabaseServerClient();
  const user = await getCurrentUser();

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const [chaptersRes, customCountRes] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, name, subject")
      .order("subject", { ascending: true })
      .order("chapter_order", { ascending: true })
      .returns<ChapterOption[]>(),
    user
      ? supabase
          .from("practice_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("mode", "custom")
          .gte("started_at", `${today}T00:00:00Z`)
          .lt("started_at", `${tomorrow}T00:00:00Z`)
      : Promise.resolve({ count: 0 }),
  ]);

  const used = customCountRes.count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - used);
  const exhausted = remaining === 0;

  return (
    <div>
      <Link
        href="/practice"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Practice
      </Link>

      <div
        className="mb-4 flex items-start gap-3 rounded-input border px-4 py-3"
        style={{
          background: exhausted ? "rgba(248, 113, 113, 0.06)" : "rgba(255, 122, 89, 0.06)",
          borderColor: exhausted ? "rgba(248, 113, 113, 0.30)" : "rgba(255, 122, 89, 0.30)",
        }}
      >
        <Info
          size={16}
          className="mt-0.5 flex-shrink-0"
          style={{ color: exhausted ? "#FCA5A5" : "var(--coral)" }}
        />
        <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
          {exhausted ? (
            <>
              <strong className="cream-text">You&apos;ve hit today&apos;s 5-session cap.</strong>{" "}
              Custom Practice is rate-limited so it stays focused. Try Chapter or PYQ practice in
              the meantime — those have no cap.
            </>
          ) : (
            <>
              <strong className="cream-text">Custom builder · {remaining} of 5 sessions left today.</strong>{" "}
              Granular filters — pick subject, chapter, topic, difficulty, type, count, and time
              limit independently.
            </>
          )}
        </div>
      </div>

      {!exhausted && (
        <FilterForm
          mode="custom"
          chapters={chaptersRes.data ?? []}
          defaultDifficulties={["medium", "hard"]}
          defaultQuestionTypes={["single_correct", "multiple_correct", "integer"]}
          title="Custom Practice Builder"
          description="Drill exactly what you want. Subject, chapter, topic, difficulty — all on you."
        />
      )}
    </div>
  );
}
