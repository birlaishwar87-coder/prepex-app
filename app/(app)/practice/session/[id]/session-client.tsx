"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, X } from "lucide-react";
import {
  QuestionDisplay,
  type FeedbackInfo,
  type QuestionForDisplay,
} from "../../components/question-display";
import { SampleBanner } from "../../components/sample-banner";
import { completeSessionAction, submitAnswerAction, type MistakeTag } from "../../actions";
import { checkAnswer } from "@/lib/practice/question-utils";

export interface ExistingAttempt {
  id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean | null;
  time_spent_sec: number | null;
  marked_for_review: boolean | null;
  mistake_tag: MistakeTag | null;
}

interface QuestionState {
  phase: "active" | "feedback";
  feedback: FeedbackInfo | null;
  markedForReview: boolean;
}

export function SessionClient({
  isDemo,
  sessionId,
  questions,
  existingAttempts,
  contextLookup,
}: {
  isDemo: boolean;
  sessionId: string;
  questions: QuestionForDisplay[];
  existingAttempts: ExistingAttempt[];
  contextLookup: Record<string, { chapter: string; topic: string | null; subTopic: string | null }>;
}) {
  const router = useRouter();
  const [pendingSubmit, startSubmit] = useTransition();
  const [pendingComplete, startComplete] = useTransition();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Build per-question state. Existing attempts pre-populate feedback so a
  // refresh mid-session lands on the last unanswered question.
  const initialStates = useMemo(() => {
    const map = new Map<string, QuestionState>();
    for (const q of questions) {
      map.set(q.id, { phase: "active", feedback: null, markedForReview: false });
    }
    for (const a of existingAttempts) {
      const q = questions.find((qq) => qq.id === a.question_id);
      if (!q) continue;
      map.set(q.id, {
        phase: "feedback",
        feedback: {
          selectedAnswer: a.selected_answer,
          isCorrect: a.is_correct === true,
          attemptId: a.id,
          mistakeTag: a.mistake_tag,
        },
        markedForReview: a.marked_for_review ?? false,
      });
    }
    return map;
  }, [questions, existingAttempts]);

  const [states, setStates] = useState<Map<string, QuestionState>>(initialStates);

  // Cursor — first unanswered question.
  const initialIndex = useMemo(() => {
    for (let i = 0; i < questions.length; i++) {
      const s = initialStates.get(questions[i].id);
      if (!s || s.phase === "active") return i;
    }
    return Math.max(0, questions.length - 1);
  }, [questions, initialStates]);

  const [index, setIndex] = useState(initialIndex);
  const [questionStartTime, setQuestionStartTime] = useState(() => Date.now());

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [index]);

  if (questions.length === 0) {
    return (
      <div className="glass p-6">
        <h2 className="t-h3 mb-2">No questions in this session.</h2>
      </div>
    );
  }

  const current = questions[index];
  const currentState = states.get(current.id)!;

  function updateState(qid: string, patch: Partial<QuestionState>) {
    setStates((prev) => {
      const next = new Map(prev);
      next.set(qid, { ...next.get(qid)!, ...patch });
      return next;
    });
  }

  function handleSubmit(answer: string, elapsedSec: number) {
    setServerError(null);

    if (isDemo) {
      const isCorrect = checkAnswer(current.question_type, current.correct_answer, answer);
      updateState(current.id, {
        phase: "feedback",
        feedback: {
          selectedAnswer: answer,
          isCorrect,
          attemptId: null,
          mistakeTag: null,
        },
      });
      return;
    }

    startSubmit(async () => {
      const ctx = contextLookup[current.id] ?? { chapter: "", topic: null, subTopic: null };
      const result = await submitAnswerAction({
        sessionId,
        questionId: current.id,
        questionType: current.question_type,
        correctAnswer: current.correct_answer,
        selectedAnswer: answer,
        timeSpentSec: elapsedSec,
        markedForReview: currentState.markedForReview,
        chapter: ctx.chapter,
        topic: ctx.topic,
        subTopic: ctx.subTopic,
      });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      updateState(current.id, {
        phase: "feedback",
        feedback: {
          selectedAnswer: answer,
          isCorrect: result.isCorrect,
          attemptId: result.attemptId,
          mistakeTag: null,
        },
      });
    });
  }

  function handleSkip(elapsedSec: number) {
    setServerError(null);

    if (isDemo) {
      updateState(current.id, {
        phase: "feedback",
        feedback: {
          selectedAnswer: null,
          isCorrect: false,
          attemptId: null,
          mistakeTag: null,
        },
      });
      return;
    }

    startSubmit(async () => {
      const ctx = contextLookup[current.id] ?? { chapter: "", topic: null, subTopic: null };
      const result = await submitAnswerAction({
        sessionId,
        questionId: current.id,
        questionType: current.question_type,
        correctAnswer: current.correct_answer,
        selectedAnswer: null,
        timeSpentSec: elapsedSec,
        markedForReview: currentState.markedForReview,
        chapter: ctx.chapter,
        topic: ctx.topic,
        subTopic: ctx.subTopic,
      });
      if (!result.ok) {
        setServerError(result.error);
        return;
      }
      updateState(current.id, {
        phase: "feedback",
        feedback: {
          selectedAnswer: null,
          isCorrect: false,
          attemptId: result.attemptId,
          mistakeTag: null,
        },
      });
    });
  }

  function handleNext() {
    const isLast = index >= questions.length - 1;
    if (!isLast) {
      setIndex(index + 1);
      return;
    }
    if (isDemo) {
      // Demo flow: bounce to a synthetic results view.
      router.push(`/practice/session/demo/results`);
      return;
    }
    startComplete(async () => {
      const { error } = await completeSessionAction(sessionId);
      if (error) {
        setServerError(error);
        return;
      }
      router.push(`/practice/session/${sessionId}/results`);
    });
  }

  function handleTagged(tag: MistakeTag) {
    updateState(current.id, {
      feedback: currentState.feedback ? { ...currentState.feedback, mistakeTag: tag } : null,
    });
  }

  function handleMarkForReview() {
    updateState(current.id, { markedForReview: !currentState.markedForReview });
  }

  function exitSession() {
    if (isDemo) {
      router.push("/practice");
      return;
    }
    // Real session — completion via the action wires up counters too.
    startComplete(async () => {
      await completeSessionAction(sessionId);
      router.push(`/practice/session/${sessionId}/results`);
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/practice" className="inline-flex items-center gap-1.5 text-[13px] tertiary">
          <ArrowLeft size={14} /> Practice
        </Link>
        <button
          type="button"
          onClick={() => setShowExitConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-[12.5px] secondary"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border-default)" }}
        >
          <X size={12} /> {isDemo ? "Exit demo" : "End session"}
        </button>
      </div>

      {isDemo && <SampleBanner />}

      <QuestionDisplay
        key={current.id}
        question={current}
        index={index}
        total={questions.length}
        phase={currentState.phase}
        feedback={currentState.feedback}
        markedForReview={currentState.markedForReview}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        onMarkForReview={handleMarkForReview}
        onNext={handleNext}
        onTagged={handleTagged}
        startTime={questionStartTime}
      />

      {(pendingSubmit || pendingComplete) && (
        <div className="mt-4 inline-flex items-center gap-2 text-[12.5px] tertiary">
          <Loader2 size={12} className="animate-spin" />
          {pendingComplete ? "Wrapping up…" : "Saving…"}
        </div>
      )}

      {serverError && (
        <div
          className="mt-3 rounded-input px-3 py-2 text-[12.5px]"
          style={{
            background: "rgba(248, 113, 113, 0.08)",
            border: "1px solid rgba(248, 113, 113, 0.30)",
            color: "#FCA5A5",
          }}
          role="alert"
        >
          {serverError}
        </div>
      )}

      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="glass w-full max-w-[420px] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="t-h4 mb-2">End this session?</h3>
            <p className="t-body-sm secondary mb-4">
              {isDemo
                ? "You'll lose the demo progress (no data saved)."
                : "Unanswered questions stay un-counted. You'll see your results next."}
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exitSession} className="btn btn-primary btn-sm">
                End session
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="btn btn-ghost btn-sm"
              >
                Keep going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
