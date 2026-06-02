import Link from "next/link";
import { BookOpen, ChevronRight, FlaskConical, Sigma, Zap } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { chapterSlug } from "@/lib/library/slug";
import type { Tables } from "@/lib/supabase/database.types";
import { SearchInput } from "./components/search-input";

export const metadata = { title: "Library · Prepex" };

const SUBJECT_META: Record<
  "physics" | "chemistry" | "maths",
  { label: string; Icon: typeof Zap; color: string }
> = {
  physics: { label: "Physics", Icon: Zap, color: "#A5B4FC" },
  chemistry: { label: "Chemistry", Icon: FlaskConical, color: "#C4B5FD" },
  maths: { label: "Mathematics", Icon: Sigma, color: "#FF9E7D" },
};

type Chapter = Pick<Tables<"chapters">, "id" | "subject" | "name" | "chapter_order">;

export default async function LibraryHome() {
  const supabase = getSupabaseServerClient();

  const [chaptersRes, contentRes] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, subject, name, chapter_order")
      .order("subject", { ascending: true })
      .order("chapter_order", { ascending: true })
      .returns<Chapter[]>(),
    supabase
      .from("library_content")
      .select("chapter_id, type")
      .returns<Array<{ chapter_id: string | null; type: string }>>(),
  ]);

  const chapters = chaptersRes.data ?? [];
  const content = contentRes.data ?? [];

  const counts = new Map<
    string,
    { total: number; notes: number; formulas: number; keypoints: number; concept_map: number }
  >();
  for (const c of content) {
    if (!c.chapter_id) continue;
    const cur = counts.get(c.chapter_id) ?? {
      total: 0,
      notes: 0,
      formulas: 0,
      keypoints: 0,
      concept_map: 0,
    };
    cur.total += 1;
    if (c.type === "notes") cur.notes += 1;
    else if (c.type === "formulas") cur.formulas += 1;
    else if (c.type === "keypoints") cur.keypoints += 1;
    else if (c.type === "concept_map") cur.concept_map += 1;
    counts.set(c.chapter_id, cur);
  }

  const totalContent = content.length;

  const bySubject: Record<"physics" | "chemistry" | "maths", Chapter[]> = {
    physics: [],
    chemistry: [],
    maths: [],
  };
  for (const ch of chapters) {
    if (ch.subject === "physics" || ch.subject === "chemistry" || ch.subject === "maths") {
      bySubject[ch.subject].push(ch);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Library</h1>
          <p className="t-body secondary">
            Notes, formula sheets, key points, and concept maps. Bookmarkable. Searchable.
          </p>
        </div>
      </div>

      <div className="mb-7 max-w-[520px]">
        <SearchInput />
      </div>

      {totalContent === 0 ? (
        <EmptyLibrary />
      ) : (
        <div className="space-y-7">
          {(Object.keys(bySubject) as Array<keyof typeof bySubject>).map((subj) => {
            const meta = SUBJECT_META[subj];
            const list = bySubject[subj];
            if (list.length === 0) return null;
            return (
              <section key={subj}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{
                      background: `${meta.color}22`,
                      color: meta.color,
                      border: `1px solid ${meta.color}55`,
                    }}
                  >
                    <meta.Icon size={16} />
                  </div>
                  <h2 className="t-h4 cream-text">{meta.label}</h2>
                  <span className="text-[12px] tertiary">{list.length} chapters</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {list.map((ch) => {
                    const c = counts.get(ch.id);
                    return (
                      <ChapterCard key={ch.id} chapter={ch} counts={c} accent={meta.color} />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChapterCard({
  chapter,
  counts,
  accent,
}: {
  chapter: Chapter;
  counts?: { total: number; notes: number; formulas: number; keypoints: number; concept_map: number };
  accent: string;
}) {
  const slug = chapterSlug(chapter.name);
  const empty = !counts || counts.total === 0;
  return (
    <Link
      href={`/library/${slug}`}
      className="glass glass-tilt block p-4"
      style={{
        cursor: empty ? "default" : "pointer",
        opacity: empty ? 0.6 : 1,
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14.5px] font-semibold cream-text leading-tight">
            {chapter.name}
          </div>
          {chapter.chapter_order != null && (
            <div className="mt-0.5 text-[11px] tertiary">Chapter {chapter.chapter_order}</div>
          )}
        </div>
        <ChevronRight size={16} className="mt-0.5 flex-shrink-0 tertiary" />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
        {empty ? (
          <span className="tertiary">No content yet</span>
        ) : (
          <>
            {counts!.notes > 0 && <Pill color={accent}>{counts!.notes} notes</Pill>}
            {counts!.formulas > 0 && <Pill color={accent}>{counts!.formulas} formula</Pill>}
            {counts!.keypoints > 0 && <Pill color={accent}>{counts!.keypoints} key points</Pill>}
            {counts!.concept_map > 0 && <Pill color={accent}>{counts!.concept_map} map</Pill>}
          </>
        )}
      </div>
    </Link>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5 font-semibold"
      style={{
        background: `${color}11`,
        color: `${color}`,
        borderColor: `${color}44`,
      }}
    >
      {children}
    </span>
  );
}

function EmptyLibrary() {
  return (
    <div className="glass mx-auto max-w-[640px] text-center" style={{ padding: 40 }}>
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          background: "rgba(255, 122, 89, 0.12)",
          color: "var(--coral)",
          border: "1px solid rgba(255, 122, 89, 0.30)",
        }}
      >
        <BookOpen size={22} />
      </div>
      <h3 className="t-h3 mb-2">We&apos;re building the library.</h3>
      <p className="t-body-sm secondary mx-auto max-w-[440px]">
        Notes, formula sheets, key points and concept maps land as content rolls in. The
        viewer + bookmark wiring is ready — content fills in shortly.
      </p>
    </div>
  );
}
