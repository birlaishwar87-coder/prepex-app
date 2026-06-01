import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Library · Prepex" };

// Library hub — chapter grid grouped by subject. Phase 2.3 wires the real
// library_content reads + KaTeX formula rendering + PDF viewer.

const SUBJECTS = [
  { name: "Physics", slug: "physics", dot: "#A5B4FC", count: 18 },
  { name: "Chemistry", slug: "chemistry", dot: "#C4B5FD", count: 18 },
  { name: "Mathematics", slug: "maths", dot: "#FF9E7D", count: 18 },
];

export default function LibraryPage() {
  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Library</h1>
          <p className="t-body secondary">
            Handwritten notes, formula sheets, key points, concept maps. Browse by chapter.
          </p>
        </div>
        <Pill variant="purple">Phase 2.3</Pill>
      </div>

      <div
        className="mb-7 flex items-center gap-2.5 rounded-input border px-3.5 py-2.5"
        style={{
          background: "rgba(255,255,255,0.025)",
          borderColor: "var(--border-default)",
        }}
      >
        <Search size={16} className="tertiary" />
        <input
          type="text"
          placeholder="Search notes, formulas, concept maps…"
          disabled
          className="flex-1 bg-transparent text-[14px] outline-none"
          style={{ color: "var(--text-secondary)" }}
        />
        <span className="text-[11px] tertiary">Phase 2.3</span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SUBJECTS.map((s) => (
          <Link
            key={s.slug}
            href={`/library/${s.slug}`}
            className="glass glass-tilt block p-5"
            style={{ cursor: "pointer" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: s.dot, boxShadow: `0 0 8px ${s.dot}` }}
              />
              <span className="t-label cream-text">{s.name}</span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="tabular text-[28px] font-extrabold leading-none text-cream">
                  {s.count}
                </div>
                <div className="mt-1 text-[12px] tertiary">chapters</div>
              </div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: `${s.dot}22`,
                  border: `1px solid ${s.dot}44`,
                  color: s.dot,
                }}
              >
                <BookOpen size={16} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div
        className="mt-10 rounded-input px-3 py-2.5 text-xs tertiary"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--border-default)" }}
      >
        <strong className="cream-text">Phase 2.2:</strong> routing skeleton. Phase 2.3 wires the
        real library_content table + PDF viewer (react-pdf) + KaTeX formula rendering.
      </div>
    </div>
  );
}
