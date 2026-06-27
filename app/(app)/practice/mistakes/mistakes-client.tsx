"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronRight, Loader2, RotateCw } from "lucide-react";
import { RichText } from "../components/rich-text";
import { retestMistakeAction, type Difficulty } from "../actions";
import { colorForSubject } from "@/lib/practice/question-utils";
import type { MistakeRow } from "./page";

type TabKey = "due" | "upcoming" | "all";

export function MistakesClient({ entries }: { entries: (MistakeRow & { isDue: boolean; isOverdue: boolean })[] }) {
  const [tab, setTab] = useState<TabKey>("due");
  const [activeId, setActiveId] = useState<string | null>(null);

  const tabs = useMemo(() => {
    const due = entries.filter((e) => e.isDue);
    const upcoming = entries.filter((e) => !e.isDue);
    return { due, upcoming, all: entries };
  }, [entries]);

  const list = tabs[tab];
  const active = entries.find((e) => e.id === activeId) ?? null;

  if (entries.length === 0) {
    return <EmptyMistakes />;
  }

  return (
    <div>
      <div className="mb-4 flex gap-1.5">
        <Tab label={`Due (${tabs.due.length})`} active={tab === "due"} onClick={() => setTab("due")} />
        <Tab label={`Upcoming (${tabs.upcoming.length})`} active={tab === "upcoming"} onClick={() => setTab("upcoming")} />
        <Tab label={`All (${tabs.all.length})`} active={tab === "all"} onClick={() => setTab("all")} />
      </div>

      {list.length === 0 ? (
        <div className="glass p-6 text-center">
          <p className="t-body-sm tertiary">
            Nothing here right now. Stay sharp.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((e) => (
            <EntryRow key={e.id} entry={e} onOpen={() => setActiveId(e.id)} />
          ))}
        </div>
      )}

      {active && (
        <ReviewModal entry={active} onClose={() => setActiveId(null)} />
      )}
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-3 py-1.5 text-[12.5px] font-semibold"
      style={{
        background: active ? "rgba(255, 122, 89, 0.10)" : "rgba(255,255,255,0.04)",
        borderColor: active ? "rgba(255, 122, 89, 0.50)" : "var(--border-default)",
        color: active ? "var(--coral)" : "var(--text-secondary)",
      }}
    >
      {label}
    </button>
  );
}

function EntryRow({
  entry,
  onOpen,
}: {
  entry: MistakeRow & { isDue: boolean; isOverdue: boolean };
  onOpen: () => void;
}) {
  const subject = entry.question?.subject ?? "—";
  const color = colorForSubject(subject);
  const chapter = entry.question?.chapter ?? entry.topic ?? "Saved mistake";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass glass-tilt flex w-full items-center gap-4 p-4 text-left"
    >
      <div
        className="h-10 w-1 flex-shrink-0 rounded-full"
        style={{ background: color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="t-label capitalize" style={{ color }}>{subject}</span>
          <span className="text-[11.5px] tertiary">· {chapter}</span>
          {entry.isOverdue && (
            <span
              className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
              style={{ background: "rgba(248, 113, 113, 0.12)", color: "#FCA5A5" }}
            >
              Overdue
            </span>
          )}
          {!entry.isOverdue && entry.isDue && (
            <span
              className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
              style={{ background: "rgba(251, 191, 36, 0.12)", color: "#FBBF24" }}
            >
              Due
            </span>
          )}
        </div>
        <div className="mt-1.5 line-clamp-1 text-[13.5px] cream-text">
          {truncate(entry.question?.question_text ?? entry.topic ?? "Saved item", 110)}
        </div>
        <div className="mt-1 flex gap-3 text-[11.5px] tertiary">
          <span>Reviewed {entry.review_count ?? 0}×</span>
          <span>Interval {entry.current_interval_days ?? 1}d</span>
          {entry.next_review_date && <span>Next: {entry.next_review_date}</span>}
        </div>
      </div>
      <ChevronRight size={16} className="flex-shrink-0 tertiary" />
    </button>
  );
}

function ReviewModal({
  entry,
  onClose,
}: {
  entry: MistakeRow & { isDue: boolean; isOverdue: boolean };
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [phase, setPhase] = useState<"recall" | "feedback">("recall");
  const [error, setError] = useState<string | null>(null);

  function rate(rating: Difficulty) {
    setError(null);
    startTransition(async () => {
      const { error: e } = await retestMistakeAction({ entryId: entry.id, rating });
      if (e) {
        setError(e);
        return;
      }
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 md:items-center"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="glass w-full max-w-[680px] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="t-label coral capitalize">{entry.question?.subject ?? "Saved item"}</div>
            <div className="t-h4 mt-1 cream-text">
              {entry.question?.chapter ?? entry.topic ?? "Mistake review"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[18px] tertiary"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {phase === "recall" ? (
          <>
            {entry.question?.question_text ? (
              <div className="rounded-input border p-4" style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}>
                <div className="t-label tertiary mb-2">Question</div>
                <div className="text-[14px] cream-text leading-relaxed">
                  <RichText text={entry.question.question_text} />
                </div>
              </div>
            ) : (
              <div className="rounded-input border p-4" style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}>
                <p className="t-body-sm tertiary">
                  Manually-added entry. Recall the concept, then rate yourself.
                </p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPhase("feedback")}
                className="btn btn-primary btn-sm"
              >
                Reveal answer
              </button>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-input border p-4" style={{ background: "rgba(110, 231, 183, 0.06)", borderColor: "rgba(110, 231, 183, 0.30)" }}>
              <div className="t-label" style={{ color: "#6EE7B7" }}>Correct answer</div>
              <div className="mt-1 text-[14px] cream-text font-semibold">
                {entry.correct_answer ?? entry.question?.correct_answer ?? "—"}
              </div>
              {entry.question?.solution_text && (
                <div className="mt-3 border-t border-[var(--border-default)] pt-3">
                  <div className="t-label tertiary mb-1.5">Solution</div>
                  <div className="text-[13px] secondary leading-relaxed">
                    <RichText text={entry.question.solution_text} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="t-label tertiary mb-2">How did that feel?</div>
              <div className="flex flex-wrap gap-2">
                <RateButton onClick={() => rate("hard")} color="#FCA5A5" label="Hard" hint="Reset to +1 day" pending={pending} />
                <RateButton onClick={() => rate("medium")} color="#FBBF24" label="Medium" hint="Step forward" pending={pending} />
                <RateButton onClick={() => rate("easy")} color="#6EE7B7" label="Easy" hint="Double the gap" pending={pending} />
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-input px-3 py-2 text-[12.5px]" style={{ background: "rgba(248, 113, 113, 0.08)", color: "#FCA5A5" }}>
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RateButton({
  onClick,
  color,
  label,
  hint,
  pending,
}: {
  onClick: () => void;
  color: string;
  label: string;
  hint: string;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex flex-col items-start gap-0.5 rounded-md border px-3 py-2 text-left"
      style={{
        background: `${color}1A`,
        borderColor: `${color}55`,
        color,
        minWidth: 110,
        cursor: pending ? "default" : "pointer",
      }}
    >
      <span className="text-[13px] font-semibold">{label}</span>
      <span className="text-[11px] opacity-70">{hint}</span>
      {pending && <Loader2 size={12} className="mt-1 animate-spin" />}
    </button>
  );
}

function EmptyMistakes() {
  return (
    <div className="glass mx-auto max-w-[640px] p-8 text-center">
      <div
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          background: "rgba(255, 122, 89, 0.12)",
          color: "var(--coral)",
          border: "1px solid rgba(255, 122, 89, 0.30)",
        }}
      >
        <RotateCw size={22} />
      </div>
      <h3 className="t-h3 mb-2">No mistakes saved yet.</h3>
      <p className="t-body-sm secondary">
        Wrong answers from practice land here automatically and come back on a spaced schedule.
        Get started from the Practice hub.
      </p>
    </div>
  );
}

function truncate(s: string, n: number) {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1).trim()}…`;
}
