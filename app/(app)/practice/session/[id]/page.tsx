import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { SAMPLE_QUESTIONS, isDemoSessionId } from "@/lib/practice/sample-questions";
import type { QuestionForDisplay } from "../../components/question-display";
import type { Database } from "@/lib/supabase/database.types";
import type { PracticeMode } from "../../actions";
import { SessionClient, type ExistingAttempt } from "./session-client";

export const dynamic = "force-dynamic";

type QuestionRow = {
  id: string;
  subject: string;
  chapter: string;
  topic: string | null;
  sub_topic: string | null;
  question_type: Database["public"]["Enums"]["question_type_t"];
  question_text: string;
  options: { A: string; B: string; C: string; D: string } | null;
  correct_answer: string;
  solution_text: string | null;
  expected_time_seconds: number | null;
};

export default async function PracticeSessionPage({ params }: { params: { id: string } }) {
  // ---- Demo branch: no DB, sample questions, no writes ----
  if (isDemoSessionId(params.id)) {
    const questions: QuestionForDisplay[] = SAMPLE_QUESTIONS.map((q) => ({
      id: q.id,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      question_type: q.question_type,
      question_text: q.question_text,
      options: q.options,
      correct_answer: q.correct_answer,
      solution_text: q.solution_text,
    }));
    return (
      <SessionClient
        isDemo
        sessionId="demo"
        mode="chapter"
        questions={questions}
        existingAttempts={[]}
        contextLookup={Object.fromEntries(
          SAMPLE_QUESTIONS.map((q) => [q.id, { chapter: q.chapter, topic: q.topic, subTopic: null as string | null }])
        )}
      />
    );
  }

  // ---- Real session branch ----
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const supabase = getSupabaseServerClient();
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, user_id, question_ids, status, mode")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle<{
      id: string;
      user_id: string;
      question_ids: string[] | null;
      status: string | null;
      mode: string;
    }>();

  if (!session) notFound();

  if (session.status === "completed") {
    redirect(`/practice/session/${params.id}/results`);
  }

  const questionIds = session.question_ids ?? [];
  if (questionIds.length === 0) {
    return (
      <div className="glass p-6">
        <h2 className="t-h3 mb-2">This session has no questions.</h2>
        <p className="t-body-sm secondary">
          Empty session — try starting a new one from{" "}
          <a href="/practice" className="coral-text underline">
            Practice
          </a>
          .
        </p>
      </div>
    );
  }

  const [questionsRes, attemptsRes] = await Promise.all([
    supabase
      .from("questions")
      .select(
        "id, subject, chapter, topic, sub_topic, question_type, question_text, options, correct_answer, solution_text, expected_time_seconds"
      )
      .in("id", questionIds)
      .returns<QuestionRow[]>(),
    supabase
      .from("question_attempts")
      .select("id, question_id, selected_answer, is_correct, time_spent_sec, marked_for_review, mistake_tag")
      .eq("session_id", session.id)
      .eq("user_id", user.id)
      .returns<ExistingAttempt[]>(),
  ]);

  const qById = new Map((questionsRes.data ?? []).map((q) => [q.id, q]));
  const orderedRows = questionIds.map((qid) => qById.get(qid)).filter(Boolean) as QuestionRow[];

  const questions: QuestionForDisplay[] = orderedRows.map((q) => ({
    id: q.id,
    subject: q.subject,
    chapter: q.chapter,
    topic: q.topic ?? "",
    question_type: q.question_type,
    question_text: q.question_text,
    options: q.options ?? { A: "", B: "", C: "", D: "" },
    correct_answer: q.correct_answer,
    solution_text: q.solution_text,
  }));

  const contextLookup: Record<string, { chapter: string; topic: string | null; subTopic: string | null }> =
    Object.fromEntries(
      orderedRows.map((q) => [q.id, { chapter: q.chapter, topic: q.topic, subTopic: q.sub_topic }])
    );

  return (
    <SessionClient
      isDemo={false}
      sessionId={session.id}
      mode={session.mode as PracticeMode}
      questions={questions}
      existingAttempts={attemptsRes.data ?? []}
      contextLookup={contextLookup}
    />
  );
}
