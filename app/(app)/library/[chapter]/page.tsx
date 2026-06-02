import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, FileText, KeyRound, ScrollText, Sparkles } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { findChapterBySlug } from "@/lib/library/slug";
import type { Database, Tables } from "@/lib/supabase/database.types";
import { BookmarkButton } from "../components/bookmark-button";

type LibraryType = Database["public"]["Enums"]["library_type_t"];

const TYPE_META: Record<
  LibraryType,
  { label: string; section: string; Icon: typeof FileText; color: string }
> = {
  notes: { label: "Notes", section: "Notes", Icon: FileText, color: "#A5B4FC" },
  formulas: { label: "Formulas", section: "Formula sheets", Icon: Sparkles, color: "#FF9E7D" },
  keypoints: { label: "Key points", section: "Key points", Icon: KeyRound, color: "#FBBF24" },
  concept_map: { label: "Concept map", section: "Concept maps", Icon: ScrollText, color: "#C4B5FD" },
};

export default async function ChapterDetail({
  params,
}: {
  params: { chapter: string };
}) {
  const supabase = getSupabaseServerClient();
  const user = await getCurrentUser();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name, subject, chapter_order")
    .returns<Pick<Tables<"chapters">, "id" | "name" | "subject" | "chapter_order">[]>();
  const chapter = findChapterBySlug(chapters ?? [], params.chapter);
  if (!chapter) notFound();

  const [contentRes, bookmarkRes] = await Promise.all([
    supabase
      .from("library_content")
      .select("id, type, title, file_url, page_count, content_json, last_updated")
      .eq("chapter_id", chapter.id)
      .order("type", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<
        Array<{
          id: string;
          type: LibraryType;
          title: string;
          file_url: string | null;
          page_count: number | null;
          content_json: unknown;
          last_updated: string | null;
        }>
      >(),
    user
      ? supabase
          .from("library_bookmarks")
          .select("content_id")
          .eq("user_id", user.id)
          .returns<Array<{ content_id: string }>>()
      : Promise.resolve({ data: [] as Array<{ content_id: string }> }),
  ]);

  const content = contentRes.data ?? [];
  const bookmarkedIds = new Set((bookmarkRes.data ?? []).map((b) => b.content_id));

  const byType: Partial<Record<LibraryType, typeof content>> = {};
  for (const c of content) {
    (byType[c.type] ??= []).push(c);
  }

  return (
    <div>
      <Link
        href="/library"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Library
      </Link>

      <div className="mb-6">
        <div className="t-label coral mb-2 capitalize">{chapter.subject}</div>
        <h1 className="t-h1 mb-1">{chapter.name}</h1>
        {chapter.chapter_order != null && (
          <p className="t-body-sm tertiary">Chapter {chapter.chapter_order}</p>
        )}
      </div>

      {content.length === 0 ? (
        <EmptyChapter />
      ) : (
        <div className="space-y-7">
          {(Object.keys(TYPE_META) as LibraryType[]).map((type) => {
            const items = byType[type] ?? [];
            if (items.length === 0) return null;
            const meta = TYPE_META[type];
            return (
              <section key={type}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{
                      background: `${meta.color}22`,
                      color: meta.color,
                      border: `1px solid ${meta.color}55`,
                    }}
                  >
                    <meta.Icon size={14} />
                  </div>
                  <h2 className="t-h4 cream-text">{meta.section}</h2>
                  <span className="text-[12px] tertiary">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {items.map((it) => (
                    <ContentCard
                      key={it.id}
                      chapterSlug={params.chapter}
                      item={it}
                      bookmarked={bookmarkedIds.has(it.id)}
                      meta={meta}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContentCard({
  chapterSlug: slug,
  item,
  bookmarked,
  meta,
}: {
  chapterSlug: string;
  item: {
    id: string;
    type: LibraryType;
    title: string;
    page_count: number | null;
    file_url: string | null;
    last_updated: string | null;
  };
  bookmarked: boolean;
  meta: (typeof TYPE_META)[LibraryType];
}) {
  return (
    <div className="glass glass-tilt relative p-4">
      <Link href={`/library/${slug}/${item.id}`} className="block">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 pr-8">
            <div className="text-[14.5px] font-semibold cream-text leading-tight">
              {item.title}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11.5px] tertiary">
              <span style={{ color: meta.color }}>{meta.label}</span>
              {item.page_count && <span>· {item.page_count} pages</span>}
              {item.last_updated && (
                <span>· Updated {new Date(item.last_updated).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <ChevronRight size={16} className="mt-0.5 flex-shrink-0 tertiary" />
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <BookmarkButton contentId={item.id} initialBookmarked={bookmarked} size={14} />
      </div>
    </div>
  );
}

function EmptyChapter() {
  return (
    <div className="glass mx-auto max-w-[560px] text-center" style={{ padding: 36 }}>
      <h3 className="t-h4 mb-2">Nothing in this chapter yet.</h3>
      <p className="t-body-sm secondary">
        Notes, formula sheets and concept maps for this chapter land as we ingest content.
      </p>
    </div>
  );
}
