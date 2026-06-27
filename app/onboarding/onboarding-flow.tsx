"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowRight,
  Book,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  GraduationCap,
  Layers,
  type LucideIcon,
  Minus,
  Moon,
  Plus,
  Rocket,
  Stethoscope,
  Sun,
  Sunrise,
  Sunset,
  Target,
  Upload,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils/cn";
import type { Database } from "@/lib/supabase/database.types";
import {
  completeOnboardingAction,
  saveCoachingAction,
  saveExamAction,
  saveGoalAction,
  saveHoursAction,
  saveTopicsAction,
} from "./actions";

// ============================================================
// Types
// ============================================================
type Goal = Database["public"]["Enums"]["goal_type"];
type Cls = Database["public"]["Enums"]["class_type"];
type CoachType = Database["public"]["Enums"]["coach_type"];
type TimeWindow = Database["public"]["Enums"]["time_window_t"];

export type ChapterRow = {
  id: string;
  subject: "physics" | "chemistry" | "maths";
  name: string;
  chapter_order: number | null;
};

export type InitialData = {
  goal: Goal | null;
  examDate: string | null;
  currentClass: Cls | null;
  coachType: CoachType | null;
  coachingName: string | null;
  batch: string | null;
  hoursWeekday: number | null;
  hoursWeekend: number | null;
  sameDailyTarget: boolean | null;
  windows: TimeWindow[] | null;
};

type FlowData = {
  goal: Goal | null;
  examDate: string;
  currentClass: Cls | null;
  coachType: CoachType | null;
  coachingName: string;
  batch: string;
  hoursWeekday: number;
  hoursWeekend: number;
  sameDailyTarget: boolean;
  windows: TimeWindow[];
  studiedChapterIds: Set<string>;
};

const TOTAL_STEPS = 7;

// ============================================================
// Root
// ============================================================
export function OnboardingFlow({
  chapters,
  initialStep,
  initialData,
}: {
  chapters: ChapterRow[];
  initialStep: number;
  initialData: InitialData;
}) {
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState<FlowData>(() => ({
    goal: initialData.goal,
    examDate: initialData.examDate ?? "2027-01-25",
    currentClass: initialData.currentClass,
    coachType: initialData.coachType,
    coachingName: initialData.coachingName ?? "",
    batch: initialData.batch ?? "",
    hoursWeekday: initialData.hoursWeekday ?? 4,
    hoursWeekend: initialData.hoursWeekend ?? 8,
    sameDailyTarget: initialData.sameDailyTarget ?? false,
    windows: initialData.windows ?? [],
    studiedChapterIds: new Set(),
  }));

  function patch<K extends keyof FlowData>(key: K, value: FlowData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function next() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }
  function back() {
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="flex min-h-screen flex-col">
      {step < TOTAL_STEPS && <ProgressTop step={step} total={TOTAL_STEPS} />}

      <div key={step} className="step-anim flex flex-1 items-center justify-center">
        {step === 1 && <Step1 next={next} />}
        {step === 2 && <Step2 data={data} patch={patch} next={next} back={back} />}
        {step === 3 && <Step3 data={data} patch={patch} next={next} back={back} />}
        {step === 4 && <Step4 data={data} patch={patch} next={next} back={back} />}
        {step === 5 && <Step5 data={data} patch={patch} next={next} back={back} />}
        {step === 6 && (
          <Step6 chapters={chapters} data={data} patch={patch} next={next} back={back} />
        )}
        {step === 7 && <Step7 data={data} />}
      </div>

      <style>{`
        .step-anim { animation: stepIn 420ms cubic-bezier(.2,.7,.2,1); }
        @keyframes stepIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}

// ============================================================
// Progress bar
// ============================================================
function ProgressTop({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div className="mx-auto w-full max-w-[720px] px-8 pt-6">
      <div className="mb-4 flex justify-center">
        <Logo size={20} />
      </div>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="t-label tertiary">Onboarding progress</div>
        <div className="t-label tertiary tabular">
          Step {step} of {total}
        </div>
      </div>
      <div className="h-1 overflow-hidden rounded bg-white/[0.05]">
        <div
          className="h-full rounded transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #FF7A59, #FF9E7D)",
            boxShadow: "0 0 12px rgba(255, 122, 89, 0.5)",
            transitionTimingFunction: "cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

// ============================================================
// StepShell — shared frame with Continue/Back/Skip
// ============================================================
function StepShell({
  children,
  onBack,
  onContinue,
  canContinue = true,
  continueLabel = "Continue",
  hint = "You can change this later in Settings.",
  skip,
  pending,
  error,
}: {
  children: React.ReactNode;
  onBack?: () => void;
  onContinue: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  hint?: string | null;
  skip?: { label: string; onClick: () => void };
  pending?: boolean;
  error?: string | null;
}) {
  return (
    <div className="mx-auto w-[min(680px,100%)] px-4 py-8">
      <div
        className="glass reveal"
        style={{
          padding: "clamp(32px, 5vw, 56px)",
          background: "rgba(20, 8, 40, 0.55)",
        }}
      >
        {children}

        {error && (
          <div
            className="mt-5 rounded-input px-3 py-2.5 text-sm"
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

        <div className="mt-9 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue || pending}
            className="btn btn-primary btn-lg w-full"
            style={{ height: 52, fontSize: 15 }}
          >
            {pending ? "Saving…" : continueLabel}
            {!pending && <ArrowRight size={16} />}
          </button>
          <div className="flex items-center gap-3.5 text-[13px]">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                disabled={pending}
                className="bg-transparent p-1.5 tertiary"
              >
                ← Back
              </button>
            )}
            {skip && (
              <button
                type="button"
                onClick={skip.onClick}
                disabled={pending}
                className="bg-transparent p-1.5 tertiary"
              >
                {skip.label}
              </button>
            )}
          </div>
          {hint && <div className="mt-1 text-[11.5px] tertiary">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OptionCard — reusable selectable card
// ============================================================
function OptionCard({
  selected,
  onClick,
  disabled,
  Icon,
  title,
  sub,
  badge,
  tall,
}: {
  selected: boolean;
  onClick?: () => void;
  disabled?: boolean;
  Icon?: LucideIcon;
  title: string;
  sub?: string;
  badge?: string;
  tall?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "relative flex flex-col gap-3 rounded-[14px] border p-[18px] text-left transition-all",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
      style={{
        background: selected ? "rgba(255, 122, 89, 0.10)" : "rgba(255,255,255,0.02)",
        borderColor: selected ? "rgba(255, 122, 89, 0.6)" : "var(--border-default)",
        color: "inherit",
        opacity: disabled ? 0.45 : 1,
        minHeight: tall ? 130 : undefined,
        boxShadow: selected
          ? "0 0 0 4px rgba(255, 122, 89, 0.10), 0 0 24px rgba(255, 122, 89, 0.18)"
          : undefined,
        transitionTimingFunction: "cubic-bezier(.2,.7,.2,1)",
        transitionDuration: "220ms",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.borderColor = "var(--border-hover)";
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !selected) {
          e.currentTarget.style.borderColor = "var(--border-default)";
          e.currentTarget.style.background = "rgba(255,255,255,0.02)";
        }
      }}
    >
      {badge && (
        <div
          className="absolute right-3 top-3 rounded-full border px-2 py-[3px] text-[10px] font-bold uppercase"
          style={{
            background:
              badge === "Soon" ? "rgba(76, 29, 149, 0.25)" : "rgba(255, 122, 89, 0.18)",
            color: badge === "Soon" ? "rgba(250,247,242,0.6)" : "#FF9E7D",
            borderColor:
              badge === "Soon" ? "rgba(76, 29, 149, 0.4)" : "rgba(255, 122, 89, 0.4)",
            letterSpacing: "0.05em",
          }}
        >
          {badge}
        </div>
      )}
      {Icon && (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-[10px]"
          style={{
            background: selected ? "rgba(255,122,89,0.18)" : "rgba(255,255,255,0.05)",
            color: selected ? "#FF9E7D" : "var(--text-secondary)",
            transition: "all 220ms",
          }}
        >
          <Icon size={18} />
        </div>
      )}
      <div>
        <div
          className="font-semibold text-cream"
          style={{ fontSize: 15, marginBottom: sub ? 4 : 0 }}
        >
          {title}
        </div>
        {sub && <div className="text-[12.5px] tertiary leading-relaxed">{sub}</div>}
      </div>
      {selected && (
        <div
          className="absolute bottom-2.5 right-3 flex h-[18px] w-[18px] items-center justify-center rounded-full"
          style={{ background: "var(--coral)", color: "#050010" }}
        >
          <Check size={12} strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

// ============================================================
// STEP 1 — Welcome
// ============================================================
function Step1({ next }: { next: () => void }) {
  return (
    <StepShell onContinue={next} continueLabel="Let's start" hint={null}>
      <h1 className="t-h2 mb-2 text-center">Hey. Let&apos;s build your prep plan.</h1>
      <p className="t-body secondary text-center">
        This takes 3 minutes. We&apos;ll never ask twice.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        {(
          [
            { Icon: Calendar, label: "Your real timetable" },
            { Icon: Clock, label: "Your actual hours" },
            { Icon: Target, label: "Your weak areas" },
          ] as const
        ).map((b) => (
          <div
            key={b.label}
            className="rounded-xl border p-[18px] text-center"
            style={{
              background: "rgba(255,255,255,0.025)",
              borderColor: "var(--border-default)",
            }}
          >
            <div
              className="mx-auto mb-2.5 flex h-9 w-9 items-center justify-center rounded-[10px]"
              style={{ background: "rgba(255, 122, 89, 0.12)", color: "var(--coral)" }}
            >
              <b.Icon size={18} />
            </div>
            <div className="text-[13px] font-medium text-cream">{b.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs tertiary">
        All answers are private. Used only for your plan.
      </p>
    </StepShell>
  );
}

// ============================================================
// STEP 2 — Goal
// ============================================================
function Step2({
  data,
  patch,
  next,
  back,
}: {
  data: FlowData;
  patch: <K extends keyof FlowData>(k: K, v: FlowData[K]) => void;
  next: () => void;
  back: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const goals: Array<{
    id: Goal;
    title: string;
    Icon: LucideIcon;
    badge?: string;
    disabled?: boolean;
  }> = [
    { id: "jee_main", title: "JEE Main only", Icon: Target },
    { id: "jee_adv", title: "JEE Main + Advanced", Icon: Rocket, badge: "Recommended" },
    { id: "neet", title: "NEET", Icon: Stethoscope, badge: "Soon", disabled: true },
    { id: "cuet", title: "CUET", Icon: Book, badge: "Soon", disabled: true },
    { id: "jee_cuet", title: "JEE + CUET", Icon: Layers, badge: "Soon", disabled: true },
    {
      id: "boards",
      title: "Class 12 Boards only",
      Icon: GraduationCap,
      badge: "Soon",
      disabled: true,
    },
  ];

  function onContinue() {
    if (!data.goal) return;
    setError(null);
    startTransition(async () => {
      const res = await saveGoalAction({ goal: data.goal! });
      if (res.error) {
        setError(res.error);
        return;
      }
      next();
    });
  }

  return (
    <StepShell
      onContinue={onContinue}
      onBack={back}
      canContinue={!!data.goal}
      pending={pending}
      error={error}
    >
      <h1 className="t-h2 mb-2 text-center">What are you preparing for?</h1>
      <p className="t-body-sm secondary text-center">
        This filters your syllabus, mocks, and partner matching.
      </p>
      <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2">
        {goals.map((g) => (
          <OptionCard
            key={g.id}
            selected={data.goal === g.id}
            onClick={() => patch("goal", g.id)}
            Icon={g.Icon}
            title={g.title}
            badge={g.badge}
            disabled={g.disabled}
            tall
          />
        ))}
      </div>
    </StepShell>
  );
}

// ============================================================
// STEP 3 — Exam date + class
// ============================================================
function Step3({
  data,
  patch,
  next,
  back,
}: {
  data: FlowData;
  patch: <K extends keyof FlowData>(k: K, v: FlowData[K]) => void;
  next: () => void;
  back: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const ed = data.examDate ? new Date(data.examDate) : today;
  const daysOut = Math.max(0, Math.round((ed.getTime() - today.getTime()) / 86_400_000));

  const classes: Array<{ id: Cls; title: string; sub: string }> = [
    { id: "class_11", title: "Class 11", sub: "Foundation year" },
    { id: "class_12", title: "Class 12", sub: "Board year" },
    { id: "dropper_1", title: "Dropper · 1st year", sub: "First attempt after 12th" },
    { id: "dropper_2", title: "Dropper · 2nd+", sub: "Second attempt or more" },
  ];

  function commit(examDateOverride?: string | null) {
    if (!data.currentClass) return;
    setError(null);
    startTransition(async () => {
      const res = await saveExamAction({
        examDate: examDateOverride === undefined ? data.examDate || null : examDateOverride,
        currentClass: data.currentClass!,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      next();
    });
  }

  return (
    <StepShell
      onContinue={() => commit()}
      onBack={back}
      canContinue={!!data.currentClass}
      pending={pending}
      error={error}
      skip={{
        label: "I don't know my exam date yet",
        onClick: () => commit(null),
      }}
    >
      <h1 className="t-h2 mb-2 text-center">When&apos;s your exam?</h1>
      <p className="t-body-sm secondary mb-6 text-center">
        Default is the known JEE 2027 schedule. Change if you have a specific paper date.
      </p>

      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
        style={{
          background: "rgba(255,255,255,0.025)",
          borderColor: "var(--border-default)",
        }}
      >
        <div>
          <div className="mb-1 text-xs tertiary">Exam date</div>
          <input
            type="date"
            value={data.examDate}
            onChange={(e) => patch("examDate", e.target.value)}
            className="bg-transparent text-lg font-semibold text-cream outline-none"
            style={{ fontFamily: "inherit", colorScheme: "dark" }}
          />
        </div>
        <div className="text-right">
          <div className="mb-1 text-[11px] uppercase tracking-wider tertiary">From today</div>
          <div
            className="tabular text-[30px] font-extrabold leading-none text-coral"
            style={{ textShadow: "0 0 16px rgba(255,122,89,0.4)" }}
          >
            {daysOut}
            <span className="ml-2 text-sm font-semibold secondary">days</span>
          </div>
        </div>
      </div>

      <div className="divider my-7" />

      <div className="t-label tertiary mb-3.5">Your current class</div>
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {classes.map((c) => (
          <OptionCard
            key={c.id}
            selected={data.currentClass === c.id}
            onClick={() => patch("currentClass", c.id)}
            title={c.title}
            sub={c.sub}
          />
        ))}
      </div>
    </StepShell>
  );
}

// ============================================================
// STEP 4 — Coaching
// ============================================================
const COACHINGS = ["Allen", "Aakash", "FIITJEE", "Resonance", "Vibrant", "PW", "Bansal", "Other"];
const BATCHES = ["Foundation", "Dropper", "Test Series", "Other"];

function Step4({
  data,
  patch,
  next,
  back,
}: {
  data: FlowData;
  patch: <K extends keyof FlowData>(k: K, v: FlowData[K]) => void;
  next: () => void;
  back: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const options: Array<{ id: CoachType; label: string }> = [
    { id: "yes", label: "Yes, I'm in a coaching" },
    { id: "self", label: "Self-prep only (no coaching)" },
    { id: "online", label: "Online courses + self-prep" },
  ];

  function onContinue() {
    if (!data.coachType) return;
    setError(null);
    startTransition(async () => {
      const res = await saveCoachingAction({
        coachType: data.coachType!,
        coachingName: data.coachingName || null,
        batch: data.batch || null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      next();
    });
  }

  return (
    <StepShell
      onContinue={onContinue}
      onBack={back}
      canContinue={!!data.coachType}
      pending={pending}
      error={error}
    >
      <h1 className="t-h2 mb-2 text-center">Are you in a coaching?</h1>
      <p className="t-body-sm secondary mb-6 text-center">
        Tells us when you&apos;re in lecture vs free for self-study.
      </p>

      <div className="flex flex-col gap-2.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => patch("coachType", o.id)}
            className="flex items-center gap-3.5 rounded-xl border px-[18px] py-3.5 text-left transition-all"
            style={{
              background:
                data.coachType === o.id
                  ? "rgba(255, 122, 89, 0.10)"
                  : "rgba(255,255,255,0.025)",
              borderColor:
                data.coachType === o.id ? "rgba(255, 122, 89, 0.5)" : "var(--border-default)",
              boxShadow:
                data.coachType === o.id ? "0 0 24px rgba(255, 122, 89, 0.15)" : undefined,
              transitionDuration: "200ms",
            }}
          >
            <div
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-[1.5px]"
              style={{
                borderColor:
                  data.coachType === o.id ? "var(--coral)" : "var(--border-hover)",
              }}
            >
              {data.coachType === o.id && (
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: "var(--coral)",
                    boxShadow: "0 0 8px var(--coral)",
                  }}
                />
              )}
            </div>
            <div className="text-[15px] font-medium">{o.label}</div>
          </button>
        ))}
      </div>

      {data.coachType === "yes" && (
        <div
          className="mt-3.5 rounded-xl border p-[18px]"
          style={{
            background: "rgba(76, 29, 149, 0.10)",
            borderColor: "rgba(76, 29, 149, 0.35)",
          }}
        >
          <div className="grid grid-cols-2 gap-2.5">
            <div className="field relative">
              <select
                value={data.coachingName}
                onChange={(e) => patch("coachingName", e.target.value)}
                className="h-[52px] w-full rounded-[10px] border text-sm outline-none"
                style={{
                  background: "var(--bg-input)",
                  borderColor: "var(--border-default)",
                  color: "var(--cream)",
                  padding: "18px 12px 6px",
                  appearance: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="">Select…</option>
                {COACHINGS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span
                className="pointer-events-none absolute left-3 top-1.5 text-[10px] font-semibold uppercase"
                style={{ color: "var(--coral)", letterSpacing: "0.04em" }}
              >
                Coaching
              </span>
            </div>
            <div className="field relative">
              <select
                value={data.batch}
                onChange={(e) => patch("batch", e.target.value)}
                className="h-[52px] w-full rounded-[10px] border text-sm outline-none"
                style={{
                  background: "var(--bg-input)",
                  borderColor: "var(--border-default)",
                  color: "var(--cream)",
                  padding: "18px 12px 6px",
                  appearance: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="">Select…</option>
                {BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <span
                className="pointer-events-none absolute left-3 top-1.5 text-[10px] font-semibold uppercase"
                style={{ color: "var(--coral)", letterSpacing: "0.04em" }}
              >
                Batch
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="divider my-6" />
      <div
        className="rounded-xl border-2 border-dashed p-5 text-center"
        style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.015)" }}
      >
        <div
          className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgba(255, 122, 89, 0.10)", color: "var(--coral)" }}
        >
          <Upload size={18} />
        </div>
        <div className="mb-1 text-sm font-semibold">Got a schedule screenshot?</div>
        <div className="mb-3 text-[12.5px] tertiary">
          {/* PHASE_2 — OCR ingestion is a later feature. For V1 this is a
              placeholder so users see the affordance and skip cleanly. */}
          Auto-build is coming soon — for now, you can add timetable details in Settings later.
        </div>
        <button type="button" disabled className="btn btn-text btn-sm" style={{ opacity: 0.5 }}>
          Coming soon
        </button>
      </div>
    </StepShell>
  );
}

// ============================================================
// STEP 5 — Hours + windows
// ============================================================
function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 16,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="stepper-btn flex h-9 w-9 items-center justify-center rounded-[10px] border"
        style={{
          background: "rgba(255,255,255,0.04)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
        }}
      >
        <Minus size={14} />
      </button>
      <div className="min-w-[100px] text-center">
        <span className="tabular text-[32px] font-extrabold leading-none text-cream">
          {value}
        </span>
        <span className="ml-1.5 text-[13px] tertiary">hours</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="stepper-btn flex h-9 w-9 items-center justify-center rounded-[10px] border"
        style={{
          background: "rgba(255,255,255,0.04)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
        }}
      >
        <Plus size={14} />
      </button>
      <style>{`
        .stepper-btn { transition: all 180ms; cursor: pointer; }
        .stepper-btn:hover { background: rgba(255,122,89,0.12) !important; border-color: rgba(255,122,89,0.4) !important; color: var(--coral) !important; }
        .stepper-btn:active { transform: scale(0.94); }
      `}</style>
    </div>
  );
}

function Step5({
  data,
  patch,
  next,
  back,
}: {
  data: FlowData;
  patch: <K extends keyof FlowData>(k: K, v: FlowData[K]) => void;
  next: () => void;
  back: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const windows: Array<{ id: TimeWindow; label: string; sub: string; Icon: LucideIcon }> = [
    { id: "morning", label: "Morning", sub: "5 AM – 11 AM", Icon: Sunrise },
    { id: "midday", label: "Midday", sub: "11 AM – 4 PM", Icon: Sun },
    { id: "evening", label: "Evening", sub: "4 PM – 9 PM", Icon: Sunset },
    { id: "night", label: "Night", sub: "9 PM – 4 AM", Icon: Moon },
  ];

  function toggleWindow(id: TimeWindow) {
    patch(
      "windows",
      data.windows.includes(id) ? data.windows.filter((x) => x !== id) : [...data.windows, id]
    );
  }

  const styleLabel = useMemo(() => {
    const w = data.windows;
    if (w.length === 0) return null;
    if (w.includes("night") && !w.includes("morning")) return "Night owl";
    if (w.includes("morning") && !w.includes("night")) return "Day person";
    return "Mixed schedule";
  }, [data.windows]);

  function onContinue() {
    setError(null);
    startTransition(async () => {
      const res = await saveHoursAction({
        hoursWeekday: data.hoursWeekday,
        hoursWeekend: data.hoursWeekend,
        sameDailyTarget: data.sameDailyTarget,
        windows: data.windows,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      next();
    });
  }

  return (
    <StepShell
      onContinue={onContinue}
      onBack={back}
      canContinue={data.windows.length > 0 && data.hoursWeekday > 0}
      pending={pending}
      error={error}
    >
      <h1 className="t-h2 mb-2 text-center">How many hours can you study daily?</h1>
      <p className="t-body-sm secondary mb-7 text-center">
        Your real life, not aspirational. The plan respects this.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-5"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}
        >
          <div className="t-label tertiary mb-3.5">Weekdays</div>
          <NumberStepper value={data.hoursWeekday} onChange={(v) => patch("hoursWeekday", v)} />
        </div>
        <div
          className="rounded-xl border p-5"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}
        >
          <div className="t-label tertiary mb-3.5">Weekends</div>
          <NumberStepper value={data.hoursWeekend} onChange={(v) => patch("hoursWeekend", v)} />
        </div>
      </div>

      <label className="mt-3.5 flex cursor-pointer items-center gap-2.5 text-[13px] secondary">
        <input
          type="checkbox"
          checked={data.sameDailyTarget}
          onChange={(e) => patch("sameDailyTarget", e.target.checked)}
          className="h-4 w-4"
          style={{ accentColor: "#FF7A59" }}
        />
        Same target every day
      </label>

      <div className="divider my-7" />

      <h3 className="t-h4 mb-1">When do you usually study?</h3>
      <p className="t-body-sm secondary mb-4">Pick all that apply.</p>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {windows.map((w) => {
          const active = data.windows.includes(w.id);
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => toggleWindow(w.id)}
              className="flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all"
              style={{
                background: active ? "rgba(255, 122, 89, 0.10)" : "rgba(255,255,255,0.025)",
                borderColor: active ? "rgba(255, 122, 89, 0.5)" : "var(--border-default)",
                transitionDuration: "200ms",
              }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{
                  background: active ? "rgba(255,122,89,0.15)" : "rgba(255,255,255,0.04)",
                  color: active ? "var(--coral)" : "var(--text-secondary)",
                }}
              >
                <w.Icon size={18} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{w.label}</div>
                <div className="mt-0.5 text-[11.5px] tertiary">{w.sub}</div>
              </div>
              {active && (
                <div
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
                  style={{ background: "var(--coral)", color: "#050010" }}
                >
                  <Check size={11} strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {styleLabel && (
        <div className="mt-4 text-[13px] secondary">
          Your style:{" "}
          <span className="font-semibold" style={{ color: "var(--coral-lighter)" }}>
            {styleLabel}
          </span>
        </div>
      )}
    </StepShell>
  );
}

// ============================================================
// STEP 6 — Topics studied
// ============================================================
const SUBJECT_LABEL: Record<"physics" | "chemistry" | "maths", string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Mathematics",
};
const SUBJECT_DOT: Record<"physics" | "chemistry" | "maths", string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
};

function Step6({
  chapters,
  data,
  patch,
  next,
  back,
}: {
  chapters: ChapterRow[];
  data: FlowData;
  patch: <K extends keyof FlowData>(k: K, v: FlowData[K]) => void;
  next: () => void;
  back: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openSubj, setOpenSubj] = useState<"physics" | "chemistry" | "maths" | null>("physics");

  const grouped = useMemo(() => {
    const g: Record<"physics" | "chemistry" | "maths", ChapterRow[]> = {
      physics: [],
      chemistry: [],
      maths: [],
    };
    for (const c of chapters) g[c.subject].push(c);
    return g;
  }, [chapters]);

  function toggle(id: string) {
    const s = new Set(data.studiedChapterIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    patch("studiedChapterIds", s);
  }
  function markAll() {
    patch("studiedChapterIds", new Set(chapters.map((c) => c.id)));
  }
  function clearAll() {
    patch("studiedChapterIds", new Set());
  }

  function commit() {
    setError(null);
    startTransition(async () => {
      const res = await saveTopicsAction({ chapterIds: Array.from(data.studiedChapterIds) });
      if (res.error) {
        setError(res.error);
        return;
      }
      next();
    });
  }

  const totalChecked = data.studiedChapterIds.size;

  return (
    <StepShell
      onContinue={commit}
      onBack={back}
      continueLabel="Done"
      skip={{ label: "Skip", onClick: commit }}
      pending={pending}
      error={error}
    >
      <h1 className="t-h2 mb-2 text-center">Which chapters have you studied?</h1>
      <p className="t-body-sm secondary text-center">
        Tap to mark studied. Even partial study counts.
      </p>
      <p className="t-body-sm tertiary mb-5 mt-1.5 text-center">
        Marked chapters skip new learning and go straight to revision rotation.
      </p>

      <div className="mb-3.5 flex items-center justify-between">
        <div className="pill pill-coral tabular">{totalChecked} chapters marked</div>
        <div className="flex gap-2">
          <button type="button" onClick={markAll} className="btn btn-text btn-sm">
            Mark all
          </button>
          <button type="button" onClick={clearAll} className="btn btn-text btn-sm">
            Clear
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {(Object.keys(grouped) as Array<"physics" | "chemistry" | "maths">).map((subj) => {
          const open = openSubj === subj;
          const list = grouped[subj];
          const count = list.filter((c) => data.studiedChapterIds.has(c.id)).length;
          return (
            <div
              key={subj}
              className="overflow-hidden rounded-xl border transition-all"
              style={{
                background: "rgba(255,255,255,0.025)",
                borderColor: open ? "rgba(255,255,255,0.12)" : "var(--border-default)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenSubj(open ? null : subj)}
                className="flex w-full items-center justify-between bg-transparent px-[18px] py-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: SUBJECT_DOT[subj],
                      boxShadow: `0 0 8px ${SUBJECT_DOT[subj]}`,
                    }}
                  />
                  <span className="t-label cream-text">{SUBJECT_LABEL[subj]}</span>
                  <span className="text-xs tertiary">
                    {count} of {list.length}
                  </span>
                </div>
                <div
                  className="tertiary"
                  style={{
                    transform: open ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 220ms",
                  }}
                >
                  <ChevronDown size={18} />
                </div>
              </button>
              <div
                className="overflow-hidden"
                style={{
                  maxHeight: open ? 1200 : 0,
                  opacity: open ? 1 : 0,
                  transition: "all 360ms cubic-bezier(.2,.7,.2,1)",
                }}
              >
                <div className="grid grid-cols-1 gap-1.5 px-[18px] pb-[18px] md:grid-cols-2">
                  {list.map((ch) => {
                    const checked = data.studiedChapterIds.has(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggle(ch.id)}
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all"
                        style={{
                          background: checked ? "rgba(255, 122, 89, 0.08)" : "transparent",
                          color: "inherit",
                          transitionDuration: "160ms",
                        }}
                      >
                        <div
                          className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]"
                          style={{
                            borderColor: checked ? "var(--coral)" : "var(--border-hover)",
                            background: checked ? "var(--coral)" : "transparent",
                            transition: "all 180ms",
                          }}
                        >
                          {checked && <Check size={11} stroke="#050010" strokeWidth={3.5} />}
                        </div>
                        <span
                          className="text-[13px]"
                          style={{ color: checked ? "var(--cream)" : "var(--text-secondary)" }}
                        >
                          {ch.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </StepShell>
  );
}

// ============================================================
// STEP 7 — Generating viz + auto-complete
// ============================================================
function NeuralViz({ size = 240 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size * dpr;
    c.height = size * dpr;
    c.style.width = size + "px";
    c.style.height = size + "px";
    ctx.scale(dpr, dpr);

    const layers = [1, 8, 16, 24, 16, 8];
    type Node = { x: number; y: number; z: number; layer: number; seed: number };
    const nodes: Node[] = [];
    layers.forEach((count, li) => {
      const radius = (li / (layers.length - 1)) * size * 0.42;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        nodes.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: (li - layers.length / 2) * 0.3,
          layer: li,
          seed: Math.random() * Math.PI * 2,
        });
      }
    });

    let raf = 0;
    let t = 0;
    function draw() {
      if (!ctx) return;
      t += 0.012;
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2,
        cy = size / 2;
      const rot = t * 0.4;
      const proj = nodes.map((n) => {
        const x = n.x * Math.cos(rot) - n.z * 60 * Math.sin(rot);
        const z = n.x * Math.sin(rot) + n.z * 60 * Math.cos(rot);
        const scale = 400 / (400 - z);
        return {
          x: cx + x * scale,
          y: cy + n.y * scale,
          z,
          scale,
          layer: n.layer,
          seed: n.seed,
        };
      });
      proj.forEach((a, i) => {
        proj.forEach((b, j) => {
          if (j <= i) return;
          if (Math.abs(a.layer - b.layer) === 1) {
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < 70) {
              const alpha = Math.max(0, 1 - dist / 70) * 0.4;
              ctx.strokeStyle = `rgba(255, 158, 125, ${alpha})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        });
      });
      proj.forEach((p) => {
        const pulse = 0.7 + Math.sin(t * 3 + p.seed) * 0.3;
        ctx.fillStyle = `rgba(255, 122, 89, ${0.7 * pulse})`;
        ctx.shadowBlur = 10 * pulse;
        ctx.shadowColor = "rgba(255, 122, 89, 1)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4 * p.scale * pulse, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [size]);
  return <canvas ref={ref} />;
}

function Step7({ data }: { data: FlowData }) {
  const [idx, setIdx] = useState(0);
  const [pct, setPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  const messages = [
    "Analyzing your timeline…",
    "Mapping your syllabus…",
    "Calibrating to your hours…",
    "Optimizing subject windows…",
    "Scheduling revision intervals…",
    "Setting up your dashboard…",
  ];

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // Fire the action IMMEDIATELY — the redirect to /today is the long pole
    // (especially in dev mode, where /today has to compile on first hit).
    // The viz keeps playing alongside instead of adding 6.5s on top.
    let mounted = true;
    const t1 = setInterval(
      () => setIdx((i) => (i + 1) % messages.length),
      1300
    );
    // Progress climbs to ~92% then holds — pegging it at 100% before the
    // redirect actually fires would be a lie. The remaining 8% snaps on
    // navigation. Tuned so 0→92% takes ~30s, which covers a typical dev
    // compile of /today.
    const t2 = setInterval(
      () => setPct((p) => (p < 92 ? p + 0.6 : p)),
      200
    );

    (async () => {
      try {
        const res = await completeOnboardingAction();
        if (!mounted) return;
        // Server action throws NEXT_REDIRECT on success — so reaching here
        // with a result means it errored.
        if (res?.error) setError(res.error);
      } catch (err) {
        // NEXT_REDIRECT is special-cased by React and re-thrown; anything
        // else here is a true failure (e.g. network drop).
        const msg = err instanceof Error ? err.message : String(err);
        if (!mounted) return;
        if (!msg.includes("NEXT_REDIRECT")) {
          setError("Couldn't finish setup. Reload the page to retry.");
        }
      }
    })();

    return () => {
      mounted = false;
      clearInterval(t1);
      clearInterval(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const examDate = data.examDate ? new Date(data.examDate) : null;
  const days = examDate
    ? Math.max(0, Math.round((examDate.getTime() - Date.now()) / 86_400_000))
    : 0;
  const goalLabel = (
    {
      jee_main: "JEE Main only",
      jee_adv: "JEE Main + Advanced",
      neet: "NEET",
      cuet: "CUET",
      jee_cuet: "JEE + CUET",
      boards: "Class 12 Boards",
      other: "Custom path",
    } as const
  )[data.goal ?? "jee_adv"];

  const summary: Array<{ ok: boolean; text: string }> = [
    { ok: true, text: `${goalLabel} · ${days} days` },
    {
      ok: true,
      text: `${data.hoursWeekday}h weekday / ${data.hoursWeekend}h weekend`,
    },
    {
      ok: true,
      text: `${data.studiedChapterIds.size} chapters already studied`,
    },
    {
      ok: !!data.coachingName,
      text: data.coachingName
        ? `${data.coachingName}${data.batch ? ` · ${data.batch}` : ""} schedule`
        : "Self-prep schedule",
    },
  ];

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-4 py-8">
      <div className="w-[min(600px,100%)] text-center">
        <div className="mb-4 flex justify-center">
          <NeuralViz size={Math.min(280, 320)} />
        </div>
        <h1 className="t-h2 mb-2">Generating your plan…</h1>
        <p className="t-body secondary mb-7 min-h-[28px]">{messages[idx]}</p>

        <div
          className="mx-auto mb-7 h-1 max-w-[360px] overflow-hidden rounded bg-white/[0.05]"
        >
          <div
            className="h-full rounded transition-all"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #FF7A59, #FF9E7D)",
              boxShadow: "0 0 16px rgba(255, 122, 89, 0.6)",
              transitionDuration: "200ms",
              transitionTimingFunction: "ease-out",
            }}
          />
        </div>

        <div className="glass mx-auto max-w-[360px] text-left" style={{ padding: 20 }}>
          <div className="t-label tertiary mb-3">Based on</div>
          <div className="flex flex-col gap-2">
            {summary.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[13px]">
                <div
                  className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(16, 185, 129, 0.18)", color: "var(--success)" }}
                >
                  <Check size={10} strokeWidth={3.5} />
                </div>
                <span className="secondary">{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div
            className="mx-auto mt-6 max-w-[360px] rounded-input px-3 py-2.5 text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.30)",
              color: "#FCA5A5",
            }}
            role="alert"
          >
            Couldn&apos;t finalize: {error}. Refresh and try again.
          </div>
        )}
      </div>
    </div>
  );
}
