import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { FilterForm, type ChapterOption } from "../components/filter-form";

export const metadata = { title: "Chapter practice · Prepex" };

export default async function ChapterPracticePage() {
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
        mode="chapter"
        chapters={chapters ?? []}
        title="Chapter practice"
        description="Pick a subject and (optionally) a chapter. We'll pull questions matching your filters."
      />
    </div>
  );
}
