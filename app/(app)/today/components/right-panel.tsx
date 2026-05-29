"use client";

import { ChevronDown, Flame } from "lucide-react";
import { useState } from "react";
import { ProgressRing } from "@/components/ui/progress-ring";

export type RightPanelData = {
  streak: number;
  bestStreak: number;
  freezesAvailable: number;
  /** 28-day intensity array, oldest first. 0 = no activity, 1..4 = increasing. */
  heatmap: number[];
  completedToday: number;
  totalToday: number;
  tomorrowPreview: Array<{
    subject: string;
    chapter: string | null;
    minutes: number;
    type: string;
  }>;
  hoursFocusedThisWeek: number;
  completionRatePct: number;
};

export function RightPanel({ data }: { data: RightPanelData }) {
  return (
    <div className="flex flex-col gap-4">
      <StreakCard
        streak={data.streak}
        best={data.bestStreak}
        freezes={data.freezesAvailable}
        heatmap={data.heatmap}
      />

      <div
        className="glass flex items-center gap-4.5 p-5"
        style={{ padding: 20 }}
      >
        <ProgressRing value={data.completedToday} total={Math.max(1, data.totalToday)} size={72} />
        <div>
          <div className="t-label tertiary">Today&apos;s score</div>
          <div className="t-body cream-text mt-1">
            {data.totalToday === 0
              ? "No plan yet."
              : data.completedToday === data.totalToday
              ? "All done. Strong day."
              : `${data.totalToday - data.completedToday} tasks to go`}
          </div>
        </div>
      </div>

      <QuickStats
        focusedHours={data.hoursFocusedThisWeek}
        completionRate={data.completionRatePct}
      />

      <TomorrowPreview previews={data.tomorrowPreview} />
    </div>
  );
}

function StreakCard({
  streak,
  best,
  freezes,
  heatmap,
}: {
  streak: number;
  best: number;
  freezes: number;
  heatmap: number[];
}) {
  const intensityColors = [
    "rgba(255,255,255,0.04)",
    "rgba(255,122,89,0.22)",
    "rgba(255,122,89,0.42)",
    "rgba(255,122,89,0.65)",
    "rgba(255,122,89,0.92)",
  ];
  return (
    <div className="glass" style={{ padding: 20 }}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div
            className="tabular text-[52px] font-extrabold leading-none text-cream"
            style={{ textShadow: "0 0 24px rgba(255,122,89,0.5), 0 2px 0 rgba(255,122,89,0.2)" }}
          >
            {streak}
          </div>
          <div className="t-label tertiary mt-1.5">Day streak</div>
        </div>
        <div
          className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] animate-flame-flicker"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(255,158,125,0.5), rgba(255,122,89,0.25) 60%, rgba(255,122,89,0.05))",
            border: "1px solid rgba(255,122,89,0.4)",
            color: "var(--coral)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 24px rgba(255,122,89,0.3)",
          }}
        >
          <Flame size={26} fill="currentColor" />
        </div>
      </div>

      <div className="grid grid-cols-14 gap-[3px]" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
        {Array.from({ length: 28 }).map((_, i) => {
          const intensity = Math.min(4, Math.max(0, heatmap[i] ?? 0));
          return (
            <div
              key={i}
              title={`Day ${i + 1}`}
              className="aspect-square rounded-[3px]"
              style={{ background: intensityColors[intensity] }}
            />
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-[11.5px] tertiary">
        <span>
          Best:{" "}
          <span className="tabular" style={{ color: "var(--text-secondary)" }}>
            {best}d
          </span>
        </span>
        <span>{freezes} freeze available</span>
      </div>
    </div>
  );
}

function QuickStats({
  focusedHours,
  completionRate,
}: {
  focusedHours: number;
  completionRate: number;
}) {
  const stats = [
    { v: `${focusedHours}h`, label: "Focused this week", color: "var(--coral)" },
    { v: `${completionRate}%`, label: "Completion rate", color: "#A78BFA" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="glass flex items-center justify-between"
          style={{ padding: "14px 16px" }}
        >
          <span className="text-[12px] secondary">{s.label}</span>
          <span className="tabular text-[18px] font-extrabold" style={{ color: s.color }}>
            {s.v}
          </span>
        </div>
      ))}
    </div>
  );
}

function TomorrowPreview({
  previews,
}: {
  previews: Array<{ subject: string; chapter: string | null; minutes: number; type: string }>;
}) {
  const [open, setOpen] = useState(true);
  if (previews.length === 0) {
    return (
      <div className="glass" style={{ padding: 16 }}>
        <div className="t-label" style={{ color: "var(--text-secondary)" }}>
          Tomorrow
        </div>
        <div className="mt-2.5 text-[12px] tertiary">No plan yet for tomorrow.</div>
      </div>
    );
  }
  const SUBJECT_DOT: Record<string, string> = {
    physics: "#A5B4FC",
    chemistry: "#C4B5FD",
    maths: "#FF9E7D",
    revision: "#FBBF24",
    wellness: "#6EE7B7",
  };
  return (
    <div className="glass" style={{ padding: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-transparent border-none p-0"
      >
        <div className="t-label" style={{ color: "var(--text-secondary)" }}>
          Tomorrow
        </div>
        <div
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 220ms",
            color: "var(--text-tertiary)",
          }}
        >
          <ChevronDown size={14} />
        </div>
      </button>
      {open && (
        <div className="mt-3.5 flex flex-col gap-2">
          {previews.slice(0, 4).map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 rounded-lg border px-2.5 py-2"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "var(--border-default)",
                opacity: 0.85,
              }}
            >
              <div
                className="h-6 w-1 flex-shrink-0 rounded-sm"
                style={{ background: SUBJECT_DOT[p.subject] ?? "#A5B4FC" }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold capitalize cream-text">
                  {p.subject}
                </div>
                <div className="text-[11px] tertiary truncate">
                  {p.chapter ?? p.type}
                </div>
              </div>
              <div className="tabular text-[11px] tertiary">{p.minutes}m</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
