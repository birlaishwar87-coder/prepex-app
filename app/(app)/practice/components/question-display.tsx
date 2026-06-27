"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Check, ChevronRight, SkipForward, X } from "lucide-react";
import { RichText } from "./rich-text";
import { MistakeTagPicker } from "./mistake-tag-picker";
import { formatElapsed } from "@/lib/practice/question-utils";
import type { MistakeTag, QuestionType } from "../actions";

/**
 * Renders one question with its options + handles two phases:
 *   active   → student picks an answer, submits or skips
 *   feedback → answer revealed, solution shown, mistake-tag picker on wrong
 *
 * Parent owns the question pointer + phase state; this component is stateless
 * across questions to avoid stale-input bugs on next.
 */

export interface QuestionForDisplay {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  question_type: QuestionType;
  question_text: string;
  options: { A: string; B: string; C: string; D: string };
  correct_answer: string;
  solution_text: string | null;
}

export type QuestionPhase = "active" | "feedback";

export interface FeedbackInfo {
  selectedAnswer: string | null;
  isCorrect: boolean;
  attemptId: string | null;
  mistakeTag: MistakeTag | null;
}

export function QuestionDisplay({
  question,
  index,
  total,
  phase,
  feedback,
  markedForReview,
  onSubmit,
  onSkip,
  onMarkForReview,
  onNext,
  onTagged,
  startTime,
}: {
  question: QuestionForDisplay;
  index: number;
  total: number;
  phase: QuestionPhase;
  feedback: FeedbackInfo | null;
  markedForReview: boolean;
  onSubmit: (answer: string, elapsedSec: number) => void;
  onSkip: (elapsedSec: number) => void;
  onMarkForReview: () => void;
  onNext: () => void;
  onTagged: (tag: MistakeTag) => void;
  /** ms timestamp the question became visible — used to clock time-spent. */
  startTime: number;
}) {
  const [selected, setSelected] = useState<string>("");
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const [integerInput, setIntegerInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(startTime);

  // Reset local state when the question changes.
  useEffect(() => {
    setSelected("");
    setMultiSelected([]);
    setIntegerInput("");
    setElapsed(0);
    startRef.current = startTime;
  }, [question.id, startTime]);

  // Tick clock only during active phase.
  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => {
      setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, question.id]);

  const isMulti = question.question_type === "multiple_correct";
  const isInteger = question.question_type === "integer";

  const studentAnswer = useMemo(() => {
    if (phase === "feedback") return feedback?.selectedAnswer ?? "";
    if (isMulti) return [...multiSelected].sort().join("");
    if (isInteger) return integerInput.trim();
    return selected;
  }, [phase, feedback, isMulti, isInteger, multiSelected, integerInput, selected]);

  const canSubmit = phase === "active" && studentAnswer.length > 0;

  function submit() {
    if (!canSubmit) return;
    onSubmit(studentAnswer, Math.max(1, elapsed));
  }
  function skip() {
    onSkip(Math.max(1, elapsed));
  }

  return (
    <div>
      {/* Header */}
      <div
        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-input border px-4 py-2.5"
        style={{
          background: "rgba(255,255,255,0.025)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="t-label tertiary">
            Q {index + 1} / {total}
          </span>
          <span className="t-label coral capitalize">{question.subject}</span>
          <span className="text-[11.5px] tertiary">· {question.chapter}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular text-[12px] secondary">{formatElapsed(elapsed)}</span>
          <button
            type="button"
            onClick={onMarkForReview}
            className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11.5px] font-semibold"
            style={{
              background: markedForReview ? "rgba(251, 191, 36, 0.10)" : "rgba(255,255,255,0.04)",
              borderColor: markedForReview ? "rgba(251, 191, 36, 0.50)" : "var(--border-default)",
              color: markedForReview ? "#FBBF24" : "var(--text-secondary)",
            }}
            aria-pressed={markedForReview}
          >
            {markedForReview ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
            Review
          </button>
        </div>
      </div>

      {/* Question body */}
      <div className="glass p-5">
        <div
          className="t-body cream-text leading-relaxed"
          style={{ fontSize: 15.5, lineHeight: 1.6 }}
        >
          <RichText text={question.question_text} />
        </div>

        <div className="mt-5 space-y-2.5">
          {isInteger ? (
            <input
              type="text"
              inputMode="numeric"
              disabled={phase === "feedback"}
              value={phase === "feedback" ? feedback?.selectedAnswer ?? "" : integerInput}
              onChange={(e) => setIntegerInput(e.target.value)}
              placeholder="Enter integer answer"
              className="field w-full"
            />
          ) : (
            (["A", "B", "C", "D"] as const).map((letter) => {
              const text = question.options[letter];
              if (!text) return null;
              return (
                <OptionRow
                  key={letter}
                  letter={letter}
                  text={text}
                  isMulti={isMulti}
                  phase={phase}
                  selected={
                    phase === "feedback"
                      ? feedback?.selectedAnswer?.includes(letter) ?? false
                      : isMulti
                        ? multiSelected.includes(letter)
                        : selected === letter
                  }
                  correctAnswer={question.correct_answer}
                  onPick={() => {
                    if (phase === "feedback") return;
                    if (isMulti) {
                      setMultiSelected((prev) =>
                        prev.includes(letter) ? prev.filter((x) => x !== letter) : [...prev, letter]
                      );
                    } else {
                      setSelected(letter);
                    }
                  }}
                />
              );
            })
          )}
        </div>

        {/* Active controls */}
        {phase === "active" && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="btn btn-primary"
            >
              <Check size={14} /> Submit
            </button>
            <button type="button" onClick={skip} className="btn btn-ghost">
              <SkipForward size={14} /> Skip
            </button>
          </div>
        )}

        {/* Feedback panel */}
        {phase === "feedback" && feedback && (
          <FeedbackPanel
            feedback={feedback}
            correctAnswer={question.correct_answer}
            solution={question.solution_text}
            onNext={onNext}
            onTagged={onTagged}
            isLast={index >= total - 1}
            questionType={question.question_type}
          />
        )}
      </div>

      {/* Progress dots */}
      <div className="mt-4 flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className="h-1 flex-1 rounded-full"
            style={{
              background: i < index ? "rgba(255, 122, 89, 0.50)" : "rgba(255,255,255,0.10)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function OptionRow({
  letter,
  text,
  isMulti,
  selected,
  phase,
  correctAnswer,
  onPick,
}: {
  letter: "A" | "B" | "C" | "D";
  text: string;
  isMulti: boolean;
  selected: boolean;
  phase: QuestionPhase;
  correctAnswer: string;
  onPick: () => void;
}) {
  // Highlighting during feedback: correct = green, picked-wrong = red.
  let bg = "rgba(255,255,255,0.025)";
  let borderColor = "var(--border-default)";
  let color = "var(--text-primary)";

  if (phase === "feedback") {
    const isCorrectLetter = correctAnswer.includes(letter);
    if (isCorrectLetter) {
      bg = "rgba(110, 231, 183, 0.10)";
      borderColor = "rgba(110, 231, 183, 0.50)";
      color = "#6EE7B7";
    } else if (selected) {
      bg = "rgba(248, 113, 113, 0.10)";
      borderColor = "rgba(248, 113, 113, 0.50)";
      color = "#FCA5A5";
    }
  } else if (selected) {
    bg = "rgba(255, 122, 89, 0.12)";
    borderColor = "rgba(255, 122, 89, 0.55)";
    color = "var(--coral)";
  }

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={phase === "feedback"}
      className="flex w-full items-start gap-3 rounded-input border px-4 py-3 text-left transition-colors"
      style={{ background: bg, borderColor, color, cursor: phase === "active" ? "pointer" : "default" }}
    >
      <span
        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[12px] font-bold"
        style={{
          background: "rgba(255,255,255,0.06)",
          color: "var(--text-secondary)",
        }}
      >
        {letter}
      </span>
      <span className="flex-1 text-[14px] leading-relaxed">
        <RichText text={text} />
      </span>
      {isMulti && phase === "active" && selected && <Check size={14} className="mt-1" />}
    </button>
  );
}

function FeedbackPanel({
  feedback,
  correctAnswer,
  solution,
  onNext,
  onTagged,
  isLast,
  questionType,
}: {
  feedback: FeedbackInfo;
  correctAnswer: string;
  solution: string | null;
  onNext: () => void;
  onTagged: (tag: MistakeTag) => void;
  isLast: boolean;
  questionType: QuestionType;
}) {
  return (
    <div
      className="mt-5 rounded-input border px-4 py-4"
      style={{
        background: feedback.isCorrect
          ? "rgba(110, 231, 183, 0.06)"
          : "rgba(248, 113, 113, 0.06)",
        borderColor: feedback.isCorrect
          ? "rgba(110, 231, 183, 0.30)"
          : "rgba(248, 113, 113, 0.30)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {feedback.isCorrect ? (
            <>
              <Check size={16} style={{ color: "#6EE7B7" }} />
              <strong className="text-[14px]" style={{ color: "#6EE7B7" }}>
                Correct
              </strong>
            </>
          ) : (
            <>
              <X size={16} style={{ color: "#FCA5A5" }} />
              <strong className="text-[14px]" style={{ color: "#FCA5A5" }}>
                {feedback.selectedAnswer == null ? "Skipped" : "Not quite"}
              </strong>
            </>
          )}
          <span className="text-[12px] tertiary">
            · Answer:&nbsp;
            <span className="cream-text font-semibold">{correctAnswer}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="btn btn-primary btn-sm"
        >
          {isLast ? "Finish" : "Next"} <ChevronRight size={14} />
        </button>
      </div>

      {solution && (
        <div className="mt-3 border-t border-[var(--border-default)] pt-3">
          <div className="t-label tertiary mb-1.5">Solution</div>
          <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <RichText text={solution} />
          </div>
        </div>
      )}

      {!feedback.isCorrect && feedback.selectedAnswer != null && (
        <MistakeTagPicker
          attemptId={feedback.attemptId}
          initialTag={feedback.mistakeTag}
          onTagged={onTagged}
        />
      )}

      {questionType === "multiple_correct" && (
        <p className="mt-3 text-[11.5px] tertiary">
          Multiple-correct: order doesn&apos;t matter — both AB and BA count the same.
        </p>
      )}
    </div>
  );
}
