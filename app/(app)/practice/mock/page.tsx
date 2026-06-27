import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { FilterForm, type ChapterOption } from "../components/filter-form";

export const metadata = { title: "Mock test · Prepex" };

export default async function MockPage() {
  const supabase = getSupabaseServerClient();
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name, subject")
    .order("subject", { ascending: true })
    .order("chapter_order", { ascending: true })
    .returns<ChapterOption[]>();

  return (
    <div>
      <Link
        href="/practice"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Practice
      </Link>
      <FilterForm
        mode="mock"
        chapters={chapters ?? []}
        defaultCount={30}
        defaultDifficulties={["easy", "medium", "hard", "very_hard"]}
        defaultQuestionTypes={["single_correct", "multiple_correct", "integer"]}
        defaultTimeLimitMinutes={60}
        title="Mock test"
        description="Long mixed-question session. Timed, scored, full analysis at the end."
        submitLabel="Start mock"
      />
      <p className="mt-3 text-[12px] tertiary">
        Tip: mock results land in your post-practice analysis like any other session. Full
        section-wise breakdown comes in Phase 2.8.
      </p>
    </div>
  );
}
