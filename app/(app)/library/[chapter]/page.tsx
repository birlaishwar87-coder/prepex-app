import Link from "next/link";
import { ArrowLeft, BookOpen, Calculator, Lightbulb, Network } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Chapter · Library · Prepex" };

interface Props {
  params: { chapter: string };
}

const TYPES = [
  {
    title: "Notes",
    description: "Handwritten Prepex notes + NCERT summaries. PDF viewer with bookmarks.",
    Icon: BookOpen,
    accent: "#A5B4FC",
  },
  {
    title: "Formula sheets",
    description: "Compact LaTeX-rendered formula refs. KaTeX-powered.",
    Icon: Calculator,
    accent: "#FF9E7D",
  },
  {
    title: "Key points",
    description: "The 5–8 things that matter most per chapter. Pre-exam refresh material.",
    Icon: Lightbulb,
    accent: "#FBBF24",
  },
  {
    title: "Concept maps",
    description: "Visual overviews — how topics connect within and across chapters.",
    Icon: Network,
    accent: "#C4B5FD",
  },
];

export default function LibraryChapterPage({ params }: Props) {
  // params.chapter is a slug like 'physics' or a chapter slug.
  // Phase 2.3 will resolve this to real chapter rows + library_content.
  const displayName = params.chapter
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  return (
    <div>
      <Link
        href="/library"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Library
      </Link>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">{displayName}</h1>
          <p className="t-body secondary">
            Notes, formulas, key points, concept maps for this chapter.
          </p>
        </div>
        <Pill variant="purple">Phase 2.3</Pill>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {TYPES.map((t) => (
          <div key={t.title} className="glass" style={{ padding: 20 }}>
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: `${t.accent}22`,
                  border: `1px solid ${t.accent}55`,
                  color: t.accent,
                }}
              >
                <t.Icon size={18} />
              </div>
              <h3 className="t-h4 cream-text">{t.title}</h3>
            </div>
            <p className="t-body-sm secondary">{t.description}</p>
            <p className="mt-3 text-[12px] tertiary">
              Phase 2.3 lists real entries here from library_content.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
