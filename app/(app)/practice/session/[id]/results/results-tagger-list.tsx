"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { RichText } from "../../../components/rich-text";
import { MistakeTagPicker } from "../../../components/mistake-tag-picker";
import { colorForSubject } from "@/lib/practice/question-utils";
import { chapterSlug } from "@/lib/library/slug";
import type { Database } from "@/lib/supabase/database.types";

type QuestionType = Database["public"]["Enums"]["question_type_t"];
type MistakeTag = Database["public"]["Enums"]["mistake_tag_t"];

export interface ResultsAttempt {
  id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean;
  mistake_tag: MistakeTag | null;
  time_spent_sec: number | null;
  question: {
    id: string;
    subject: string;
    chapter: string;
    topic: string | null;
    question_text: string;
    options: { A: string; B: string; C: string; D: string } | null;
    correct_answer: string;
    solution_text: string | null;
    question_type: QuestionType;
  } | null;
}

export function ResultsTaggerList({ attempts }: { attempts: ResultsAttempt[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2.5">
      {attempts.map((a, i) => {
        const open = expandedId === a.id;
        const skipped = a.selected_answer == null;
        const color = a.is_correct ? "#6EE7B7" : skipped ? "#A5B4FC" : "#FCA5A5";

        return (
          <div key={a.id} className="glass">
            <button
              type="button"
              onClick={() => setExpandedId(open ? null : a.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-bold text-[11.5px]"
                style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
              >
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="t-label capitalize" style={{ color: colorForSubject(a.question?.subject ?? "") }}>
                    {a.question?.subject ?? "—"}
                  </span>
                  <span className="text-[11.5px] tertiary">· {a.question?.chapter ?? ""}</span>
                </div>
                <div className="mt-0.5 line-clamp-1 text-[13px] cream-text">
                  {a.question?.question_text ?? ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.is_correct ? (
                  <Check size={14} style={{ color: "#6EE7B7" }} />
                ) : skipped ? (
                  <span className="text-[11.5px] tertiary">Skipped</span>
                ) : (
                  <X size={14} style={{ color: "#FCA5A5" }} />
                )}
                {open ? (
                  <ChevronDown size={14} className="tertiary" />
                ) : (
                  <ChevronRight size={14} className="tertiary" />
                )}
              </div>
            </button>

            {open && a.question && (
              <div className="border-t border-[var(--border-default)] px-4 py-4">
                <div className="text-[13.5px] cream-text leading-relaxed">
                  <RichText text={a.question.question_text} />
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-[12px] tertiary">
                  <span>
                    Your answer:{" "}
                    <span className="cream-text font-semibold">
                      {a.selected_answer ?? "—"}
                    </span>
                  </span>
                  <span>
                    Correct:{" "}
                    <span style={{ color: "#6EE7B7" }} className="font-semibold">
                      {a.question.correct_answer}
                    </span>
                  </span>
                  {a.time_spent_sec != null && (
                    <span>Time: {a.time_spent_sec}s</span>
                  )}
                </div>

                {a.question.solution_text && (
                  <div className="mt-3 border-t border-[var(--border-default)] pt-3">
                    <div className="t-label tertiary mb-1.5">Solution</div>
                    <div className="text-[13px] secondary leading-relaxed">
                      <RichText text={a.question.solution_text} />
                    </div>
                  </div>
                )}

                {a.question.chapter && (
                  <div className="mt-3 border-t border-[var(--border-default)] pt-3">
                    <Link
                      href={`/library/${chapterSlug(a.question.chapter)}`}
                      className="inline-flex items-center gap-1.5 text-[12px] coral-text font-semibold"
                    >
                      <BookOpen size={12} /> Open {a.question.chapter} in Library
                    </Link>
                  </div>
                )}

                {!a.is_correct && !skipped && (
                  <MistakeTagPicker
                    attemptId={a.id}
                    initialTag={a.mistake_tag}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
