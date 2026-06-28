import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock, RotateCw, Sparkles, X } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { RichText } from "../../../components/rich-text";
import { ResultsTaggerList } from "./results-tagger-list";
import { colorForSubject, labelForSubject, formatElapsed } from "@/lib/practice/question-utils";
import type { Database } from "@/lib/supabase/database.types";
import { SAMPLE_QUESTIONS, isDemoSessionId } from "@/lib/practice/sample-questions";

export const metadata = { title: "Practice results · Prepex" };

type QuestionType = Database["public"]["Enums"]["question_type_t"];

interface AttemptDetail {
  id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean | null;
  time_spent_sec: number | null;
  marked_for_review: boolean | null;
  mistake_tag: Database["public"]["Enums"]["mistake_tag_t"] | null;
  questions: {
    id: string;
    subject: string;
    chapter: string;
    topic: string | null;
    question_text: string;
    correct_answer: string;
    solution_text: string | null;
    question_type: QuestionType;
  } | null;
}

export default async function ResultsPage({ params }: { params: { id: string } }) {
  // Demo branch — synthetic results from sample questions.
  if (isDemoSessionId(params.id)) {
    return <DemoResults />;
  }

  const user = await getCurrentUser();
  if (!user) redirect("/");
  const supabase = getSupabaseServerClient();

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, mode, status, total_questions, correct_count, skipped_count, time_taken_sec, started_at, completed_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      mode: string;
      status: string | null;
      total_questions: number | null;
      correct_count: number | null;
      skipped_count: number | null;
      time_taken_sec: number | null;
      started_at: string;
      completed_at: string | null;
    }>();
  if (!session) notFound();

  const { data: attempts } = await supabase
    .from("question_attempts")
    .select(
      `id, question_id, selected_answer, is_correct, time_spent_sec, marked_for_review, mistake_tag,
       questions:question_id ( id, subject, chapter, topic, question_text, correct_answer, solution_text, question_type )`
    )
    .eq("session_id", session.id)
    .eq("user_id", user.id)
    .returns<AttemptDetail[]>();

  const list = attempts ?? [];
  const totalAnswered = list.length;
  const correct = list.filter((a) => a.is_correct === true).length;
  const wrong = list.filter((a) => a.is_correct === false).length;
  const skipped = list.filter((a) => a.selected_answer == null).length;
  const accuracy = totalAnswered > 0 ? Math.round((correct / Math.max(1, totalAnswered - skipped)) * 100) : 0;
  const timeSec = session.time_taken_sec ?? list.reduce((acc, a) => acc + (a.time_spent_sec ?? 0), 0);

  const bySubject = new Map<string, { correct: number; total: number }>();
  for (const a of list) {
    const subj = a.questions?.subject ?? "—";
    const cur = bySubject.get(subj) ?? { correct: 0, total: 0 };
    cur.total += 1;
    if (a.is_correct === true) cur.correct += 1;
    bySubject.set(subj, cur);
  }

  return (
    <div>
      <Link
        href="/practice"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Practice
      </Link>

      <div className="mb-6">
        <div className="t-label coral mb-2">Session complete</div>
        <h1 className="t-h1 mb-2">Here&apos;s how it went.</h1>
        <p className="t-body secondary">
          {correct} right · {wrong} wrong · {skipped} skipped · {formatElapsed(timeSec)} total.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          color="#6EE7B7"
          Icon={Check}
          label="Correct"
          value={`${correct}/${session.total_questions ?? totalAnswered}`}
        />
        <SummaryCard
          color="#FCA5A5"
          Icon={X}
          label="Wrong"
          value={`${wrong}`}
        />
        <SummaryCard
          color="#A5B4FC"
          Icon={Sparkles}
          label="Accuracy"
          value={`${accuracy}%`}
        />
        <SummaryCard
          color="#FBBF24"
          Icon={Clock}
          label="Time"
          value={formatElapsed(timeSec)}
        />
      </div>

      {bySubject.size > 0 && (
        <div className="mt-6">
          <h2 className="t-h4 mb-3">By subject</h2>
          <div className="space-y-2.5">
            {Array.from(bySubject.entries()).map(([subj, s]) => {
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <div
                  key={subj}
                  className="glass p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13.5px] font-semibold cream-text capitalize">
                      {labelForSubject(subj)}
                    </span>
                    <span className="text-[12px] tertiary">
                      {s.correct}/{s.total} · {pct}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: colorForSubject(subj),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {list.length > 0 && (
        <div className="mt-7">
          <h2 className="t-h4 mb-3">Question-by-question</h2>
          <ResultsTaggerList
            attempts={list.map((a) => ({
              id: a.id,
              question_id: a.question_id,
              selected_answer: a.selected_answer,
              is_correct: a.is_correct ?? false,
              mistake_tag: a.mistake_tag,
              time_spent_sec: a.time_spent_sec,
              question: a.questions
                ? {
                    id: a.questions.id,
                    subject: a.questions.subject,
                    chapter: a.questions.chapter,
                    topic: a.questions.topic,
                    question_text: a.questions.question_text,
                    correct_answer: a.questions.correct_answer,
                    solution_text: a.questions.solution_text,
                    question_type: a.questions.question_type,
                  }
                : null,
            }))}
          />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/practice" className="btn btn-primary">
          <ArrowRight size={14} /> More practice
        </Link>
        <Link href="/practice/mistakes" className="btn btn-ghost">
          Mistake notebook
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  color,
  Icon,
  label,
  value,
}: {
  color: string;
  Icon: typeof Check;
  label: string;
  value: string;
}) {
  return (
    <div className="glass p-4">
      <div
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
      >
        <Icon size={16} />
      </div>
      <div className="t-label tertiary">{label}</div>
      <div className="t-h3 cream-text">{value}</div>
    </div>
  );
}

function DemoResults() {
  // Synthetic results from sample questions — purely illustrative.
  const correct = 3;
  const wrong = 2;
  const total = SAMPLE_QUESTIONS.length;
  const accuracy = Math.round((correct / total) * 100);
  return (
    <div>
      <Link
        href="/practice"
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Practice
      </Link>
      <div
        className="mb-5 flex items-start gap-3 rounded-input border px-4 py-3"
        style={{
          background: "rgba(255, 122, 89, 0.06)",
          borderColor: "rgba(255, 122, 89, 0.30)",
        }}
      >
        <Sparkles size={16} className="mt-0.5" style={{ color: "var(--coral)" }} />
        <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
          <strong className="cream-text">Demo results — synthetic numbers.</strong> Real
          sessions will show your actual breakdown, by-subject performance, and per-question
          review with mistake tags. No data was saved.
        </div>
      </div>

      <h1 className="t-h1 mb-1">Demo complete.</h1>
      <p className="t-body secondary mb-5">
        Below is what a real post-practice screen looks like. Now you can try a real practice
        session from the hub.
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard color="#6EE7B7" Icon={Check} label="Correct" value={`${correct}/${total}`} />
        <SummaryCard color="#FCA5A5" Icon={X} label="Wrong" value={`${wrong}`} />
        <SummaryCard color="#A5B4FC" Icon={Sparkles} label="Accuracy" value={`${accuracy}%`} />
        <SummaryCard color="#FBBF24" Icon={Clock} label="Time" value="4:32" />
      </div>

      <div className="mt-6 space-y-3">
        {SAMPLE_QUESTIONS.map((q) => (
          <div key={q.id} className="glass p-4">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="t-label capitalize" style={{ color: colorForSubject(q.subject) }}>
                {q.subject}
              </span>
              <span className="text-[11.5px] tertiary">· {q.chapter}</span>
            </div>
            <div className="text-[13.5px] cream-text">
              <RichText text={q.question_text} />
            </div>
            <div className="mt-2 text-[12px] tertiary">
              Correct answer: <span className="cream-text font-semibold">{q.correct_answer}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/practice" className="btn btn-primary">
          <ArrowRight size={14} /> Back to Practice
        </Link>
        <Link href="/practice/session/demo" className="btn btn-ghost">
          <RotateCw size={14} /> Run demo again
        </Link>
      </div>
    </div>
  );
}
