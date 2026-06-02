import Link from "next/link";
import { ArrowLeft, ChevronRight, FileText, KeyRound, ScrollText, Sparkles } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { chapterSlug } from "@/lib/library/slug";
import type { Database } from "@/lib/supabase/database.types";
import { SearchInput } from "../components/search-input";

type LibraryType = Database["public"]["Enums"]["library_type_t"];

const TYPE_META: Record<LibraryType, { label: string; Icon: typeof FileText; color: string }> = {
  notes: { label: "Notes", Icon: FileText, color: "#A5B4FC" },
  formulas: { label: "Formulas", Icon: Sparkles, color: "#FF9E7D" },
  keypoints: { label: "Key points", Icon: KeyRound, color: "#FBBF24" },
  concept_map: { label: "Concept map", Icon: ScrollText, color: "#C4B5FD" },
};

export default async function LibrarySearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const supabase = getSupabaseServerClient();

  let results: Array<{
    id: string;
    type: LibraryType;
    title: string;
    chapter: string;
    subject: string;
  }> = [];

  if (q.length > 0) {
    // Postgrest .or() needs commas in the value to be encoded carefully —
    // we strip them from user input to keep the filter syntax intact.
    const safe = q.replace(/[,()]/g, " ").trim();
    const pattern = `%${safe}%`;
    const { data } = await supabase
      .from("library_content")
      .select("id, type, title, chapter, subject")
      .or(`title.ilike.${pattern},chapter.ilike.${pattern}`)
      .limit(40)
      .returns<typeof results>();
    results = data ?? [];
  }

  return (
    <div>
      <Link
        href="/library"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Library
      </Link>

      <h1 className="t-h1 mb-5">Search library</h1>
      <div className="mb-6 max-w-[520px]">
        <SearchInput initialQuery={q} />
      </div>

      {q.length === 0 ? (
        <p className="t-body-sm tertiary">Type something to search across all library content.</p>
      ) : results.length === 0 ? (
        <div
          className="glass mx-auto max-w-[520px] text-center"
          style={{ padding: 28 }}
        >
          <h3 className="t-h4 mb-2">No matches.</h3>
          <p className="t-body-sm tertiary">
            Try a different word — chapter name or title. Search runs on title + chapter.
          </p>
        </div>
      ) : (
        <>
          <p className="t-body-sm secondary mb-3">
            {results.length} {results.length === 1 ? "result" : "results"} for{" "}
            <span className="cream-text">&quot;{q}&quot;</span>
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {results.map((r) => {
              const meta = TYPE_META[r.type];
              const slug = chapterSlug(r.chapter);
              return (
                <Link
                  key={r.id}
                  href={`/library/${slug}/${r.id}`}
                  className="glass glass-tilt block p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-semibold cream-text leading-tight">
                        {r.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] tertiary">
                        <span style={{ color: meta.color }}>{meta.label}</span>
                        <span>· {r.subject}</span>
                        <span>· {r.chapter}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="mt-0.5 flex-shrink-0 tertiary" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
