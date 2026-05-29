"use client";

import { useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2 } from "lucide-react";
import { RevisionSession, type RevisionTarget } from "./components/revision-session";

export type QueueItem = {
  topicStateId: string;
  chapter: string;
  subject: "physics" | "chemistry" | "maths";
  topic: string | null;
  lastRevisedAt: string | null;
  nextRevisionDue: string;
  latestDifficultyRating: "easy" | "medium" | "hard" | null;
  revisionCount: number;
  onboardingMarked: boolean;
};

const SUBJECT_DOT: Record<string, string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
};

export function RevisionQueueClient({
  overdue,
  dueToday,
  comingSoon,
}: {
  overdue: QueueItem[];
  dueToday: QueueItem[];
  comingSoon: QueueItem[];
}) {
  const [target, setTarget] = useState<RevisionTarget | null>(null);

  function startRevision(item: QueueItem) {
    setTarget({
      topicStateId: item.topicStateId,
      chapter: item.chapter,
      subject: item.subject,
      topic: item.topic,
      lastRevisedAt: item.lastRevisedAt,
    });
  }

  const isEmpty = overdue.length + dueToday.length + comingSoon.length === 0;

  return (
    <>
      {isEmpty && (
        <div className="glass" style={{ padding: 28 }}>
          <div
            className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--success)" }}
          >
            <CheckCircle2 size={20} />
          </div>
          <h3 className="t-h4 mb-2">Nothing due right now.</h3>
          <p className="t-body-sm secondary">
            Topics enter rotation as you study them. Mark chapters in onboarding or finish a
            new-learning task — they show up here on the next spaced-repetition interval.
          </p>
        </div>
      )}

      <Group title="Overdue" subtitle="Most overdue first" items={overdue} accent="warning" onStart={startRevision} />
      <Group title="Due today" subtitle={`Today — ${dueToday.length} ${dueToday.length === 1 ? "topic" : "topics"}`} items={dueToday} accent="coral" onStart={startRevision} />
      <Group title="Coming soon" subtitle="Within the next 7 days" items={comingSoon} accent="muted" onStart={startRevision} />

      <RevisionSession target={target} onClose={() => setTarget(null)} />
    </>
  );
}

function Group({
  title,
  subtitle,
  items,
  accent,
  onStart,
}: {
  title: string;
  subtitle: string;
  items: QueueItem[];
  accent: "warning" | "coral" | "muted";
  onStart: (item: QueueItem) => void;
}) {
  if (items.length === 0) return null;
  const accentColor =
    accent === "warning" ? "var(--warning)" : accent === "coral" ? "var(--coral)" : "var(--text-tertiary)";
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="t-label" style={{ color: accentColor }}>
            {title}
          </div>
          <p className="text-[12.5px] tertiary mt-0.5">{subtitle}</p>
        </div>
        <span className="tabular text-[13px] secondary">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <QueueRow key={item.topicStateId} item={item} onStart={() => onStart(item)} />
        ))}
      </div>
    </section>
  );
}

function QueueRow({ item, onStart }: { item: QueueItem; onStart: () => void }) {
  const color = SUBJECT_DOT[item.subject] ?? "#A5B4FC";
  const dueDate = new Date(item.nextRevisionDue + "T12:00:00Z");
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const diff = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);
  const dueLabel =
    diff < 0
      ? `${Math.abs(diff)} ${Math.abs(diff) === 1 ? "day" : "days"} overdue`
      : diff === 0
      ? "Today"
      : `In ${diff} ${diff === 1 ? "day" : "days"}`;

  const ratingLabel = item.latestDifficultyRating
    ? `Last rating: ${item.latestDifficultyRating}`
    : `${item.revisionCount} ${item.revisionCount === 1 ? "revision" : "revisions"}`;

  return (
    <div
      className="glass relative flex items-stretch overflow-hidden p-0"
      style={{ transition: "all 240ms cubic-bezier(.2,.7,.2,1)" }}
    >
      <div className="w-1 flex-shrink-0" style={{ background: color }} />
      <div className="flex flex-1 flex-wrap items-center gap-3.5 px-4 py-3">
        <div className="min-w-0 flex-1" style={{ minWidth: 200 }}>
          <div className="text-[15px] font-semibold cream-text">
            <span className="capitalize">{item.subject}</span> · {item.chapter}
            {item.onboardingMarked && (
              <span className="ml-2 text-[10px] uppercase tracking-wider tertiary">Onboarded</span>
            )}
          </div>
          {item.topic && <div className="mt-0.5 text-[12.5px] secondary">{item.topic}</div>}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="pill" style={{ padding: "3px 8px", fontSize: 11 }}>
              <CalendarClock size={11} /> {dueLabel}
            </span>
            <span className="pill" style={{ padding: "3px 8px", fontSize: 11 }}>
              {ratingLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] font-semibold transition-all"
          style={{
            background: "rgba(167, 139, 250, 0.15)",
            color: "#C4B5FD",
            borderColor: "rgba(167, 139, 250, 0.35)",
            transitionDuration: "180ms",
          }}
        >
          Start <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
