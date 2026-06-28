import Link from "next/link";
import { ArrowLeft, BookMarked, Clock, Sparkles } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { MistakesClient } from "./mistakes-client";

export const metadata = { title: "Mistake Notebook · Prepex" };

export default async function MistakesPage() {
  const supabase = getSupabaseServerClient();
  const user = await getCurrentUser();

  // Pull active (non-archived) entries with their linked question (if present).
  const { data: rows } = await supabase
    .from("mistake_notebook_entries")
    .select(
      `id, source, entry_type, topic, sub_topic, student_answer, correct_answer,
       next_review_date, current_interval_days, review_count, last_reviewed_at,
       question:question_id (
         id, subject, chapter, topic, question_text, correct_answer,
         solution_text, question_type
       )`
    )
    .is("archived_at", null)
    .order("next_review_date", { ascending: true })
    .returns<MistakeRow[]>();

  if (!user) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const entries = (rows ?? []).map((r) => ({
    ...r,
    isDue: r.next_review_date != null && r.next_review_date <= today,
    isOverdue:
      r.next_review_date != null && r.next_review_date < today,
  }));

  const dueCount = entries.filter((e) => e.isDue).length;
  const overdueCount = entries.filter((e) => e.isOverdue).length;

  return (
    <div>
      <Link
        href="/practice"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Practice
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Mistake Notebook</h1>
          <p className="t-body secondary">
            Spaced revisit on every wrong answer. Schedule scales with how often you nail it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatPill
            color="#FBBF24"
            Icon={Sparkles}
            label={`${dueCount} due today`}
          />
          {overdueCount > 0 && (
            <StatPill
              color="#FCA5A5"
              Icon={Clock}
              label={`${overdueCount} overdue`}
            />
          )}
          <StatPill
            color="#A5B4FC"
            Icon={BookMarked}
            label={`${entries.length} active`}
          />
        </div>
      </div>

      <MistakesClient entries={entries} />
    </div>
  );
}

function StatPill({
  color,
  Icon,
  label,
}: {
  color: string;
  Icon: typeof BookMarked;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-semibold"
      style={{
        background: `${color}1A`,
        borderColor: `${color}55`,
        color,
      }}
    >
      <Icon size={12} /> {label}
    </span>
  );
}

export interface MistakeQuestion {
  id: string;
  subject: string;
  chapter: string;
  topic: string | null;
  question_text: string;
  correct_answer: string;
  solution_text: string | null;
  question_type: "single_correct" | "multiple_correct" | "integer" | "assertion_reason";
}

export interface MistakeRow {
  id: string;
  source: string;
  entry_type: string;
  topic: string | null;
  sub_topic: string | null;
  student_answer: string | null;
  correct_answer: string | null;
  next_review_date: string | null;
  current_interval_days: number | null;
  review_count: number | null;
  last_reviewed_at: string | null;
  question: MistakeQuestion | null;
}
