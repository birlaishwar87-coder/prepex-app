import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { findChapterBySlug } from "@/lib/library/slug";
import type { Database, Tables } from "@/lib/supabase/database.types";
import { BookmarkButton } from "../../components/bookmark-button";
import { PdfViewer } from "../../components/pdf-viewer-dynamic";
import { FormulaSheet, type FormulaEntry } from "../../components/formula-sheet";

type LibraryType = Database["public"]["Enums"]["library_type_t"];

export default async function LibraryContentPage({
  params,
}: {
  params: { chapter: string; contentId: string };
}) {
  const supabase = getSupabaseServerClient();
  const user = await getCurrentUser();

  // Resolve chapter by slug for breadcrumb + auth check.
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name, subject")
    .returns<Pick<Tables<"chapters">, "id" | "name" | "subject">[]>();
  const chapter = findChapterBySlug(chapters ?? [], params.chapter);
  if (!chapter) notFound();

  const { data: content } = await supabase
    .from("library_content")
    .select(
      "id, chapter_id, type, title, file_url, page_count, content_json, last_updated"
    )
    .eq("id", params.contentId)
    .maybeSingle<{
      id: string;
      chapter_id: string | null;
      type: LibraryType;
      title: string;
      file_url: string | null;
      page_count: number | null;
      content_json: unknown;
      last_updated: string | null;
    }>();

  if (!content) notFound();
  // Guard: ensure the content belongs to the URL's chapter.
  if (content.chapter_id !== chapter.id) notFound();

  // Bookmark status.
  let bookmarked = false;
  if (user) {
    const { data: bm } = await supabase
      .from("library_bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("content_id", content.id)
      .maybeSingle<{ id: string }>();
    bookmarked = !!bm;
  }

  const formulaEntries: FormulaEntry[] = Array.isArray(content.content_json)
    ? (content.content_json as FormulaEntry[]).filter(
        (e) => e && typeof (e as { latex?: unknown }).latex === "string"
      )
    : [];

  return (
    <div>
      <Link
        href={`/library/${params.chapter}`}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to {chapter.name}
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="t-label coral mb-1.5 capitalize">
            {chapter.subject} · {content.type.replace("_", " ")}
          </div>
          <h1 className="t-h2">{content.title}</h1>
          {content.last_updated && (
            <p className="mt-1 text-[12px] tertiary">
              Updated {new Date(content.last_updated).toLocaleDateString()}
            </p>
          )}
        </div>
        <BookmarkButton contentId={content.id} initialBookmarked={bookmarked} label size={16} />
      </div>

      {/* Body — dispatch on type + presence of file vs JSON */}
      {content.file_url ? (
        <PdfViewer
          url={content.file_url}
          title={content.title}
          trackingMeta={{
            content_id: content.id,
            subject: chapter.subject,
            chapter: chapter.name,
          }}
        />
      ) : formulaEntries.length > 0 ? (
        <FormulaSheet entries={formulaEntries} />
      ) : (
        <div
          className="glass"
          style={{ padding: 28 }}
        >
          <p className="t-body-sm tertiary">
            This entry doesn&apos;t have a file or structured content yet.
          </p>
        </div>
      )}
    </div>
  );
}
