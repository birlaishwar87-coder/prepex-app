import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { FilterForm, type ChapterOption } from "../components/filter-form";

export const metadata = { title: "PYQ practice · Prepex" };

export default async function PYQPage() {
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
        mode="pyq"
        chapters={chapters ?? []}
        showYears
        defaultDifficulties={["medium", "hard", "very_hard"]}
        defaultQuestionTypes={["single_correct", "multiple_correct", "integer"]}
        defaultTimeLimitMinutes={30}
        title="Past JEE questions"
        description="Filterable bank of JEE Main + Advanced PYQs. Pick year + subject; we'll pull a randomized set."
      />
    </div>
  );
}
