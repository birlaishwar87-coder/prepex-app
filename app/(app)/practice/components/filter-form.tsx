"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import {
  startPracticeSessionAction,
  type Difficulty,
  type PracticeMode,
  type QuestionType,
  type Subject,
} from "../actions";

/**
 * Shared filter builder for Chapter / PYQ / Custom / Mock setup.
 *
 * Each variant pre-checks defaults that match the PRD intent for that
 * mode; the user can adjust before starting. Server-side `startPracticeSession`
 * gracefully returns no_questions when the seed hasn't loaded — the form
 * surfaces that as a callout.
 */

const ALL_DIFFICULTIES: { id: Difficulty; label: string; color: string }[] = [
  { id: "easy", label: "Easy", color: "#6EE7B7" },
  { id: "medium", label: "Medium", color: "#FBBF24" },
  { id: "hard", label: "Hard", color: "#FF9E7D" },
  { id: "very_hard", label: "Very Hard", color: "#F87171" },
];

const ALL_QTYPES: { id: QuestionType; label: string }[] = [
  { id: "single_correct", label: "Single correct" },
  { id: "multiple_correct", label: "Multiple correct" },
  { id: "integer", label: "Integer" },
  { id: "assertion_reason", label: "Assertion–Reason" },
];

const SUBJECTS: { id: Subject; label: string; color: string }[] = [
  { id: "physics", label: "Physics", color: "#A5B4FC" },
  { id: "chemistry", label: "Chemistry", color: "#C4B5FD" },
  { id: "maths", label: "Maths", color: "#FF9E7D" },
];

export interface ChapterOption {
  id: string;
  name: string;
  subject: Subject;
}

export function FilterForm({
  mode,
  chapters,
  showYears = false,
  showCount = true,
  defaultCount = 10,
  defaultDifficulties,
  defaultQuestionTypes,
  showTimeLimit = true,
  defaultTimeLimitMinutes = null,
  preselectedSubject = null,
  preselectedChapterIds = [],
  title,
  description,
  submitLabel = "Start practice",
}: {
  mode: PracticeMode;
  chapters: ChapterOption[];
  showYears?: boolean;
  showCount?: boolean;
  defaultCount?: number;
  defaultDifficulties?: Difficulty[];
  defaultQuestionTypes?: QuestionType[];
  showTimeLimit?: boolean;
  defaultTimeLimitMinutes?: number | null;
  /** Deep-link pre-fill — e.g. coming from /library/[chapter] "Practice this chapter". */
  preselectedSubject?: Subject | null;
  preselectedChapterIds?: string[];
  title: string;
  description: string;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [subject, setSubject] = useState<Subject | null>(preselectedSubject);
  const [chapterIds, setChapterIds] = useState<string[]>(preselectedChapterIds);
  const [topic, setTopic] = useState("");
  const [difficulties, setDifficulties] = useState<Difficulty[]>(
    defaultDifficulties ?? ["easy", "medium", "hard"]
  );
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(
    defaultQuestionTypes ?? ["single_correct"]
  );
  const [count, setCount] = useState(defaultCount);
  const [timeLimit, setTimeLimit] = useState<number | null>(defaultTimeLimitMinutes);
  const [pyqYears, setPyqYears] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const filteredChapters = subject
    ? chapters.filter((c) => c.subject === subject)
    : chapters;

  function toggleArray<T>(
    arr: T[],
    val: T,
    setter: (next: T[]) => void
  ) {
    if (arr.includes(val)) setter(arr.filter((x) => x !== val));
    else setter([...arr, val]);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await startPracticeSessionAction({
        mode,
        subject,
        chapterIds,
        topic: topic.trim() || null,
        difficulties,
        questionTypes,
        pyqYears: showYears ? pyqYears : [],
        count,
        timeLimitMinutes: timeLimit,
      });
      if (result.ok) {
        router.push(`/practice/session/${result.sessionId}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="t-h1 mb-2">{title}</h1>
        <p className="t-body secondary">{description}</p>
      </div>

      <div className="glass space-y-6 p-5">
        <Section label="Subject">
          <div className="flex flex-wrap gap-2">
            <Chip
              active={subject === null}
              color="#A5B4FC"
              onClick={() => {
                setSubject(null);
                setChapterIds([]);
              }}
            >
              All
            </Chip>
            {SUBJECTS.map((s) => (
              <Chip
                key={s.id}
                active={subject === s.id}
                color={s.color}
                onClick={() => {
                  setSubject(s.id);
                  setChapterIds([]);
                }}
              >
                {s.label}
              </Chip>
            ))}
          </div>
        </Section>

        {filteredChapters.length > 0 && (
          <Section label="Chapter(s) — optional">
            <div
              className="grid grid-cols-1 gap-1.5 overflow-y-auto rounded-input p-2 md:grid-cols-2"
              style={{
                maxHeight: 220,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid var(--border-default)",
              }}
            >
              {filteredChapters.map((c) => {
                const checked = chapterIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px]"
                    style={{
                      background: checked ? "rgba(255, 122, 89, 0.08)" : "transparent",
                      color: checked ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArray(chapterIds, c.id, setChapterIds)}
                      className="accent-[var(--coral)]"
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-[11.5px] tertiary">
              Leave empty to draw from any chapter in the selected subject.
            </p>
          </Section>
        )}

        <Section label="Topic — optional">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. friction, integration, electrochemistry"
            className="field w-full"
          />
        </Section>

        <Section label="Difficulty">
          <div className="flex flex-wrap gap-2">
            {ALL_DIFFICULTIES.map((d) => (
              <Chip
                key={d.id}
                active={difficulties.includes(d.id)}
                color={d.color}
                onClick={() => toggleArray(difficulties, d.id, setDifficulties)}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section label="Question types">
          <div className="flex flex-wrap gap-2">
            {ALL_QTYPES.map((q) => (
              <Chip
                key={q.id}
                active={questionTypes.includes(q.id)}
                color="#A5B4FC"
                onClick={() => toggleArray(questionTypes, q.id, setQuestionTypes)}
              >
                {q.label}
              </Chip>
            ))}
          </div>
        </Section>

        {showYears && (
          <Section label="Past JEE years">
            <div className="flex flex-wrap gap-2">
              {[2020, 2021, 2022, 2023, 2024].map((y) => (
                <Chip
                  key={y}
                  active={pyqYears.includes(y)}
                  color="#A78BFA"
                  onClick={() => toggleArray(pyqYears, y, setPyqYears)}
                >
                  {y}
                </Chip>
              ))}
            </div>
            <p className="mt-1 text-[11.5px] tertiary">
              Leave empty to draw from any year.
            </p>
          </Section>
        )}

        {showCount && (
          <Section label={`Number of questions — ${count}`}>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--coral)]"
            />
            <div className="mt-1 flex justify-between text-[11.5px] tertiary">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </Section>
        )}

        {showTimeLimit && (
          <Section label="Time limit">
            <div className="flex flex-wrap gap-2">
              <Chip
                active={timeLimit === null}
                color="#A5B4FC"
                onClick={() => setTimeLimit(null)}
              >
                No limit
              </Chip>
              {[15, 30, 60, 120].map((m) => (
                <Chip
                  key={m}
                  active={timeLimit === m}
                  color="#A5B4FC"
                  onClick={() => setTimeLimit(m)}
                >
                  {m} min
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {error && (
          <div
            className="rounded-input px-4 py-3 text-[13px]"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.30)",
              color: "#FCA5A5",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={pending || questionTypes.length === 0 || difficulties.length === 0}
            className="btn btn-primary"
          >
            {pending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Starting…
              </>
            ) : (
              <>
                <Play size={14} /> {submitLabel}
              </>
            )}
          </button>
          <span className="text-[12px] tertiary">
            {count} questions · {timeLimit ? `${timeLimit} min` : "no time limit"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="t-label tertiary mb-2">{label}</div>
      {children}
    </div>
  );
}

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
      style={{
        background: active ? `${color}1F` : "rgba(255,255,255,0.04)",
        borderColor: active ? `${color}66` : "var(--border-default)",
        color: active ? color : "var(--text-secondary)",
      }}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
