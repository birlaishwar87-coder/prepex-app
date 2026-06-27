import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  Brain,
  History,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";

// PRD §5.3 — Practice Engine has 3 entry points + Mistake Notebook surfaced
// alongside. Demo session lives at /practice/session/demo for testing before
// real content seeds in Phase 2.5.

export const metadata = { title: "Practice · Prepex" };
export const dynamic = "force-dynamic";

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

export default async function PracticePage() {
  const supabase = getSupabaseServerClient();
  const user = await getCurrentUser();

  // Compute last-7-days stats — completed sessions only.
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const sevenDayCount = user
    ? (
        await supabase
          .from("practice_sessions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("started_at", since)
      ).count ?? 0
    : 0;

  const dueMistakes = user
    ? (
        await supabase
          .from("mistake_notebook_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .is("archived_at", null)
          .lte("next_review_date", new Date().toISOString().slice(0, 10))
      ).count ?? 0
    : 0;

  return (
    <div>
      <div className="mb-7">
        <h1 className="t-h1 mb-2">Practice</h1>
        <p className="t-body secondary">
          Curated questions + PYQs. Tagged mistakes that come back at the right time.
        </p>
      </div>

      {(sevenDayCount > 0 || dueMistakes > 0) && (
        <div
          className="mb-6 flex flex-wrap items-center gap-4 rounded-input border px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.025)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center gap-2 text-[12.5px]">
            <TrendingUp size={14} style={{ color: "var(--coral)" }} />
            <span className="cream-text font-semibold">{sevenDayCount}</span>
            <span className="secondary">sessions this week</span>
          </div>
          {dueMistakes > 0 && (
            <div className="flex items-center gap-2 text-[12.5px]">
              <BookMarked size={14} style={{ color: "#FBBF24" }} />
              <span className="cream-text font-semibold">{dueMistakes}</span>
              <span className="secondary">mistakes due today</span>
              <Link
                href="/practice/mistakes"
                className="coral-text font-semibold underline"
              >
                Open
              </Link>
            </div>
          )}
        </div>
      )}

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

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/practice/custom" className="btn btn-ghost">
          <Sparkles size={14} /> Custom Practice Builder
        </Link>
        <Link href="/practice/session/demo" className="btn btn-text">
          Try a sample session →
        </Link>
      </div>
      <p className="mt-2 text-[12px] tertiary">
        Custom builder caps at 5 sessions/day. Sample session is read-only — to see the flow
        before real content seeds.
      </p>
    </div>
  );
}
