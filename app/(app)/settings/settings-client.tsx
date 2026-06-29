"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  AlertTriangle,
  Check,
  LogOut,
  Minus,
  Moon,
  Plus,
  Stethoscope,
  Sun,
  Sunrise,
  Sunset,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { Tables } from "@/lib/supabase/database.types";
import {
  clearCheckinHistoryAction,
  saveCoachingAction,
  saveExamAction,
  saveGoalAction,
  saveHoursAction,
  saveProfileAction,
} from "./actions";
import { DeleteAccountModal } from "./delete-account-modal";
import { IntelligenceHubSection } from "./intelligence-hub";

type Profile = Tables<"profiles">;

const COACHINGS = ["Allen", "Aakash", "FIITJEE", "Resonance", "Vibrant", "PW", "Bansal", "Other"];
const BATCHES = ["Foundation", "Dropper", "Test Series", "Other"];

export function SettingsClient({ profile }: { profile: Profile }) {
  return (
    <div className="flex flex-col gap-6">
      <IntelligenceHubSection
        geminiKey={profile.gemini_api_key}
        groqKey={profile.groq_api_key}
        anthropicKey={profile.anthropic_api_key}
      />
      <ProfileSection profile={profile} />
      <GoalSection profile={profile} />
      <ExamSection profile={profile} />
      <HoursSection profile={profile} />
      <CoachingSection profile={profile} />
      <PrivacySection />
      <DangerSection />
    </div>
  );
}

// ============================================================
// Section shell
// ============================================================
function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass" style={{ padding: 24 }}>
      <div className="mb-3.5">
        <h2 className="t-h4">{title}</h2>
        {hint && <p className="mt-1 text-[12.5px] tertiary">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function SaveButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Saving…" : label}
    </button>
  );
}

function FieldError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div
      className="mt-3 rounded-input px-3 py-2.5 text-sm"
      style={{
        background: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.30)",
        color: "#FCA5A5",
      }}
      role="alert"
    >
      {error}
    </div>
  );
}

function SavedTick({ saved }: { saved?: boolean }) {
  if (!saved) return null;
  return (
    <span
      className="mt-3 inline-flex items-center gap-1.5 text-[12px]"
      style={{ color: "var(--success)" }}
    >
      <Check size={12} /> Saved
    </span>
  );
}

// ============================================================
// Profile (first name + phone)
// ============================================================
function ProfileSection({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(saveProfileAction, { error: null });
  return (
    <Section title="Profile" hint="What you go by, and how we reach you for account events.">
      <form action={action} className="flex flex-col gap-3">
        <div className="field">
          <input
            id="first_name"
            name="first_name"
            type="text"
            defaultValue={profile.first_name ?? ""}
            placeholder=" "
          />
          <label htmlFor="first_name">First name</label>
        </div>
        <div className="field">
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={profile.phone ?? ""}
            placeholder=" "
          />
          <label htmlFor="phone">Phone</label>
        </div>
        <FieldError error={state.error} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <SavedTick saved={state.saved} />
          <SaveButton />
        </div>
      </form>
    </Section>
  );
}

// ============================================================
// Goal
// ============================================================
const GOAL_LABELS: Record<string, string> = {
  jee_main: "JEE Main only",
  jee_adv: "JEE Main + Advanced",
  neet: "NEET",
  cuet: "CUET",
  jee_cuet: "JEE + CUET",
  boards: "Class 12 Boards only",
  other: "Other / Custom",
};

function GoalSection({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(saveGoalAction, { error: null });
  return (
    <Section title="Goal" hint="Filters syllabus, mocks, and partner matching.">
      <form action={action} className="flex flex-col gap-3">
        {/* Static label — the .field float-label CSS doesn't fire on
            <select> (no :placeholder-shown), which made the label
            overlap the value. */}
        <div className="relative">
          <label htmlFor="goal" className="t-label tertiary mb-2 block">
            Your exam target
          </label>
          <select
            id="goal"
            name="goal"
            defaultValue={profile.goal ?? "jee_adv"}
            className="w-full appearance-none rounded-input border bg-[var(--bg-input)] px-3 text-[15px] outline-none cursor-pointer"
            style={{
              borderColor: "var(--border-default)",
              color: "var(--cream)",
              fontFamily: "inherit",
              height: 48,
              paddingRight: 32,
            }}
          >
            {Object.entries(GOAL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <FieldError error={state.error} />
        <div className="mt-2 flex items-center justify-between gap-3">
          <SavedTick saved={state.saved} />
          <SaveButton />
        </div>
      </form>
    </Section>
  );
}

// ============================================================
// Exam date + class
// ============================================================
const CLASSES = [
  { id: "class_11", label: "Class 11" },
  { id: "class_12", label: "Class 12" },
  { id: "dropper_1", label: "Dropper · 1st year" },
  { id: "dropper_2", label: "Dropper · 2nd+" },
  { id: "other", label: "Other" },
] as const;

function ExamSection({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(saveExamAction, { error: null });
  return (
    <Section title="Exam date + class" hint="Drives pacing and weekly progress framing.">
      <form action={action} className="flex flex-col gap-4">
        <div
          className="flex items-center justify-between gap-4 rounded-input border p-4"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}
        >
          <div>
            <div className="t-label tertiary mb-1">Exam date</div>
            <input
              type="date"
              name="exam_date"
              defaultValue={profile.exam_date ?? ""}
              className="bg-transparent text-lg font-semibold text-cream outline-none"
              style={{ fontFamily: "inherit", colorScheme: "dark" }}
            />
          </div>
        </div>
        <div>
          <div className="t-label tertiary mb-2">Current class</div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {CLASSES.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-input border px-3 py-2.5 text-[13.5px]"
                style={{
                  background:
                    profile.current_class === c.id
                      ? "rgba(255,122,89,0.10)"
                      : "rgba(255,255,255,0.025)",
                  borderColor:
                    profile.current_class === c.id
                      ? "rgba(255,122,89,0.40)"
                      : "var(--border-default)",
                }}
              >
                <input
                  type="radio"
                  name="current_class"
                  value={c.id}
                  defaultChecked={profile.current_class === c.id}
                  style={{ accentColor: "#FF7A59" }}
                />
                {c.label}
              </label>
            ))}
          </div>
        </div>
        <FieldError error={state.error} />
        <div className="mt-1 flex items-center justify-between gap-3">
          <SavedTick saved={state.saved} />
          <SaveButton />
        </div>
      </form>
    </Section>
  );
}

// ============================================================
// Hours + windows
// ============================================================
const WINDOWS = [
  { id: "morning", label: "Morning", sub: "5 AM – 11 AM", Icon: Sunrise },
  { id: "midday", label: "Midday", sub: "11 AM – 4 PM", Icon: Sun },
  { id: "evening", label: "Evening", sub: "4 PM – 9 PM", Icon: Sunset },
  { id: "night", label: "Night", sub: "9 PM – 4 AM", Icon: Moon },
] as const;

function HoursSection({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(saveHoursAction, { error: null });
  const [weekday, setWeekday] = useState(profile.daily_hours_weekday ?? 6);
  const [weekend, setWeekend] = useState(profile.daily_hours_weekend ?? 8);
  const [sameDaily, setSameDaily] = useState(profile.same_daily_target ?? false);
  const initialWindows = new Set<string>((profile.time_windows ?? []) as unknown as string[]);

  return (
    <Section title="Hours + time windows" hint="The planner respects these, never overshoots them.">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="Weekday" name="hours_weekday" value={weekday} onChange={setWeekday} />
          <Stepper
            label="Weekend"
            name="hours_weekend"
            value={sameDaily ? weekday : weekend}
            onChange={setWeekend}
            disabled={sameDaily}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] secondary">
          <input
            type="checkbox"
            name="same_daily"
            checked={sameDaily}
            onChange={(e) => setSameDaily(e.target.checked)}
            style={{ accentColor: "#FF7A59" }}
          />
          Same target every day
        </label>

        <div>
          <div className="t-label tertiary mb-2">When do you usually study?</div>
          <div className="grid grid-cols-2 gap-2">
            {WINDOWS.map((w) => {
              const checked = initialWindows.has(w.id);
              return (
                <label
                  key={w.id}
                  className="flex cursor-pointer items-center gap-3 rounded-input border px-3 py-2.5"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    borderColor: "var(--border-default)",
                  }}
                >
                  <input
                    type="checkbox"
                    name={`window_${w.id}`}
                    defaultChecked={checked}
                    style={{ accentColor: "#FF7A59" }}
                  />
                  <w.Icon size={16} style={{ color: "var(--text-secondary)" }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold">{w.label}</div>
                    <div className="text-[11px] tertiary">{w.sub}</div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <FieldError error={state.error} />
        <div className="mt-1 flex items-center justify-between gap-3">
          <SavedTick saved={state.saved} />
          <SaveButton />
        </div>
      </form>
    </Section>
  );
}

function Stepper({
  label,
  name,
  value,
  onChange,
  disabled,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="rounded-input border p-3.5"
      style={{
        background: "rgba(255,255,255,0.025)",
        borderColor: "var(--border-default)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div className="t-label tertiary mb-2">{label}</div>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => !disabled && onChange(Math.max(0, value - 1))}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-md border-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "var(--text-primary)",
          }}
        >
          <Minus size={13} />
        </button>
        <div className="min-w-[68px] flex-1 text-center">
          <span className="tabular text-xl font-bold text-cream">{value}</span>
          <span className="ml-1 text-[12px] tertiary">hours</span>
        </div>
        <button
          type="button"
          onClick={() => !disabled && onChange(Math.min(16, value + 1))}
          disabled={disabled}
          className="flex h-8 w-8 items-center justify-center rounded-md border-none"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "var(--text-primary)",
          }}
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Coaching
// ============================================================
const COACH_OPTIONS = [
  { id: "yes", label: "Yes, in a coaching" },
  { id: "self", label: "Self-prep only" },
  { id: "online", label: "Online courses + self-prep" },
] as const;

function CoachingSection({ profile }: { profile: Profile }) {
  const [state, action] = useFormState(saveCoachingAction, { error: null });
  const [coachType, setCoachType] = useState<string>(profile.coach_type ?? "self");
  return (
    <Section title="Coaching" hint="Tells the planner when you're in lecture vs free.">
      <form action={action} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2">
          {COACH_OPTIONS.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-3 rounded-input border px-3.5 py-3 text-[14px]"
              style={{
                background:
                  coachType === o.id ? "rgba(255,122,89,0.10)" : "rgba(255,255,255,0.025)",
                borderColor:
                  coachType === o.id ? "rgba(255,122,89,0.40)" : "var(--border-default)",
              }}
            >
              <input
                type="radio"
                name="coach_type"
                value={o.id}
                checked={coachType === o.id}
                onChange={() => setCoachType(o.id)}
                style={{ accentColor: "#FF7A59" }}
              />
              {o.label}
            </label>
          ))}
        </div>

        {coachType === "yes" && (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="coaching_name" className="t-label tertiary mb-2 block">
                Coaching
              </label>
              <select
                id="coaching_name"
                name="coaching_name"
                defaultValue={profile.coaching_name ?? ""}
                className="w-full appearance-none rounded-input border bg-[var(--bg-input)] px-3 text-[14px] outline-none cursor-pointer"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--cream)",
                  height: 44,
                  paddingRight: 32,
                }}
              >
                <option value="">Select…</option>
                {COACHINGS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="batch" className="t-label tertiary mb-2 block">
                Batch
              </label>
              <select
                id="batch"
                name="batch"
                defaultValue={profile.batch ?? ""}
                className="w-full appearance-none rounded-input border bg-[var(--bg-input)] px-3 text-[14px] outline-none cursor-pointer"
                style={{
                  borderColor: "var(--border-default)",
                  color: "var(--cream)",
                  height: 44,
                  paddingRight: 32,
                }}
              >
                <option value="">Select…</option>
                {BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <FieldError error={state.error} />
        <div className="mt-1 flex items-center justify-between gap-3">
          <SavedTick saved={state.saved} />
          <SaveButton />
        </div>
      </form>
    </Section>
  );
}

// ============================================================
// Privacy
// ============================================================
function PrivacySection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [doneAt, setDoneAt] = useState<string | null>(null);

  function clearHistory() {
    setError(null);
    startTransition(async () => {
      const result = await clearCheckinHistoryAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setDoneAt(new Date().toISOString());
      setConfirmOpen(false);
    });
  }

  return (
    <Section
      title="Privacy"
      hint="Your data stays yours. These controls give you direct, no-friction options."
    >
      <div className="flex flex-col gap-4">
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-input border p-3.5"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}
        >
          <div>
            <div className="text-[14px] font-semibold cream-text">
              Clear check-in history
            </div>
            <div className="mt-0.5 text-[12.5px] tertiary">
              Removes every mood check-in we&apos;ve recorded. Resets the burnout baseline.
            </div>
            {doneAt && (
              <div
                className="mt-1.5 inline-flex items-center gap-1.5 text-[12px]"
                style={{ color: "var(--success)" }}
              >
                <Check size={12} /> Cleared.
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="btn btn-ghost btn-sm"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>

        <Link
          href="/wellness"
          className="flex items-center justify-between rounded-input border px-3.5 py-3 text-[14px] transition-all"
          style={{
            background: "rgba(76, 29, 149, 0.10)",
            borderColor: "rgba(76, 29, 149, 0.30)",
            color: "var(--cream)",
          }}
        >
          <span className="flex items-center gap-2.5">
            <Stethoscope size={15} style={{ color: "#C4B5FD" }} /> Wellness resources
            (counsellor helplines)
          </span>
          <span style={{ color: "var(--text-tertiary)" }}>→</span>
        </Link>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} width={460}>
        <div className="p-7">
          <h3 className="t-h3 mb-2">Clear check-in history?</h3>
          <p className="t-body-sm secondary">
            Removes all daily check-in entries. The burnout-detection baseline resets so the
            system starts learning your mood patterns from scratch. No way to undo.
          </p>
          {error && (
            <div
              className="mt-4 rounded-input px-3 py-2.5 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={clearHistory}
              disabled={pending}
              className="btn btn-primary"
              style={{ background: "linear-gradient(135deg, #ef4444, #f87171)", color: "#fff" }}
            >
              {pending ? "Clearing…" : "Clear history"}
            </button>
          </div>
        </div>
      </Modal>
    </Section>
  );
}

// ============================================================
// Danger zone
// ============================================================
function DangerSection() {
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <Section title="Account" hint="Sign out anywhere or close the account.">
      <div className="flex flex-col gap-3">
        <form
          action="/auth/signout"
          method="post"
          className="flex items-center justify-between rounded-input border px-3.5 py-3"
          style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}
        >
          <div>
            <div className="text-[14px] font-semibold cream-text">Sign out</div>
            <div className="text-[12px] tertiary">Ends this session.</div>
          </div>
          <button type="submit" className="btn btn-ghost btn-sm">
            <LogOut size={13} /> Sign out
          </button>
        </form>

        <div
          className="flex flex-wrap items-center justify-between gap-2.5 rounded-input border p-3.5"
          style={{
            background: "rgba(239, 68, 68, 0.05)",
            borderColor: "rgba(239, 68, 68, 0.25)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 text-[14px] font-semibold cream-text">
              <AlertTriangle size={13} style={{ color: "#FCA5A5" }} /> Delete account
            </div>
            <div className="mt-0.5 text-[12px] tertiary">
              Removes your account and everything attached to it. Immediate.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="btn btn-ghost btn-sm"
            style={{
              color: "#FCA5A5",
              borderColor: "rgba(239, 68, 68, 0.30)",
            }}
          >
            <Trash2 size={13} /> Delete…
          </button>
        </div>
      </div>
      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </Section>
  );
}
