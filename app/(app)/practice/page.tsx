import Link from "next/link";
import { ArrowRight, BookMarked, Brain, History, Sparkles, Target } from "lucide-react";
import { Pill } from "@/components/ui/pill";

// PRD §5.3 — Practice Engine has 3 entry points + Mistake Notebook surfaced
// alongside. Hub lists the 4 paths in. Phase 2.4 builds the full session UX.

export const metadata = { title: "Practice · Prepex" };

const ENTRIES = [
  {
    title: "Chapter practice",
    description: "Pick a subject + chapter. Filtered drill from the curated bank.",
    href: "/practice/chapter",
    Icon: Target,
    accent: "#FF7A59",
  },
  {
    title: "PYQ mode",
    description: "Past JEE Main + Advanced papers, filterable by year and shift.",
    href: "/practice/pyq",
    Icon: History,
    accent: "#A78BFA",
  },
  {
    title: "Mistake notebook",
    description: "Revisit wrong answers on schedule. Auto-populated as you practice.",
    href: "/practice/mistakes",
    Icon: BookMarked,
    accent: "#FBBF24",
  },
  {
    title: "Mock test",
    description: "Long mixed-question session, timed, scored at the end.",
    href: "/practice/mock",
    Icon: Brain,
    accent: "#6EE7B7",
  },
];

export default function PracticePage() {
  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Practice</h1>
          <p className="t-body secondary">
            Curated questions + PYQs. Tagged mistakes that come back at the right time.
          </p>
        </div>
        <Pill variant="purple">Phase 2.2 · skeleton</Pill>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ENTRIES.map((e) => (
          <Link
            key={e.title}
            href={e.href}
            className="glass glass-tilt block p-6"
            style={{ cursor: "pointer" }}
          >
            <div
              className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
              style={{
                background: `${e.accent}22`,
                border: `1px solid ${e.accent}55`,
                color: e.accent,
              }}
            >
              <e.Icon size={20} />
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="t-h4 mb-1.5 cream-text">{e.title}</h3>
                <p className="t-body-sm secondary">{e.description}</p>
              </div>
              <ArrowRight size={18} className="mt-1 flex-shrink-0 tertiary" />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/practice/custom" className="btn btn-ghost">
          <Sparkles size={14} /> Custom Practice Builder
        </Link>
        <p className="mt-2 text-[12px] tertiary">
          Power-user tool — drill any subject/chapter/topic on demand. Up to 5 sessions/day.
        </p>
      </div>

      <div
        className="mt-10 rounded-input px-3 py-2.5 text-xs tertiary"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid var(--border-default)" }}
      >
        <strong className="cream-text">Phase 2.2:</strong> routing skeleton only. Real practice
        session UX lands in Phase 2.4. Questions seed lands in Phase 2.5.
      </div>
    </div>
  );
}
