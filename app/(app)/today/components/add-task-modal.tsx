"use client";

import { useRef, useState, useTransition } from "react";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { addCustomTaskAction } from "../actions";

const SUBJECTS = ["physics", "chemistry", "maths", "revision", "wellness"] as const;
const TASK_TYPES = [
  { id: "new_learning", label: "New learning" },
  { id: "revision", label: "Revision" },
  { id: "practice", label: "Practice" },
  { id: "dpp", label: "DPP" },
] as const;
const WINDOWS = ["morning", "midday", "evening", "night", "anytime"] as const;

/**
 * Switched from useFormState → useTransition (2026-06-29). Reason: the
 * useFormState shape ({ error: null | string }) made it impossible to
 * distinguish "initial state" from "successfully added", so the modal
 * couldn't auto-close. Manual submit fires the action, awaits the
 * result, and closes the modal on success — feels instant to the user.
 */
export function AddTaskModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [subject, setSubject] = useState<string>("physics");
  const [taskType, setTaskType] = useState<string>("new_learning");
  const [duration, setDuration] = useState(60);
  const [window, setWindow] = useState<string>("morning");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addCustomTaskAction({ error: null }, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Reset form + close. Parent's revalidatePath('/today') has already
      // been called server-side; the new task appears on next render.
      formRef.current?.reset();
      setSubject("physics");
      setTaskType("new_learning");
      setDuration(60);
      setWindow("morning");
      onAdded?.();
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} width={540}>
      <div className="p-5 sm:p-7">
        <div className="mb-4 sm:mb-5 flex items-center justify-between gap-2">
          <h2 className="t-h3">Add custom task</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3.5">
          <div className="field">
            <input
              id="task_chapter"
              name="chapter"
              type="text"
              placeholder=" "
              autoFocus
            />
            <label htmlFor="task_chapter">Chapter or task name</label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <SelectField
              id="task_subject"
              name="subject"
              label="Subject"
              value={subject}
              onChange={setSubject}
              options={SUBJECTS.map((s) => ({ value: s, label: s }))}
            />
            <div className="field">
              <input id="task_topic" name="topic" type="text" placeholder=" " />
              <label htmlFor="task_topic">Topic (optional)</label>
            </div>
          </div>

          <div>
            <div className="t-label tertiary mb-2">Task type</div>
            <input type="hidden" name="task_type" value={taskType} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {TASK_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTaskType(t.id)}
                  className="rounded-[9px] border px-1.5 py-2.5 text-[12px] font-semibold"
                  style={{
                    background:
                      taskType === t.id ? "rgba(255,122,89,0.18)" : "rgba(255,255,255,0.03)",
                    borderColor:
                      taskType === t.id ? "rgba(255,122,89,0.5)" : "var(--border-default)",
                    color: taskType === t.id ? "var(--coral-lighter)" : "var(--text-secondary)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="t-label tertiary mb-2">Duration</div>
              <input type="hidden" name="duration" value={duration} />
              <div
                className="flex items-center gap-2.5 rounded-input border px-3 py-2"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border-default)" }}
              >
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.max(5, d - 5))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border-none"
                  style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-primary)" }}
                >
                  <Minus size={12} />
                </button>
                <div className="flex-1 text-center">
                  <span className="tabular text-lg font-bold">{duration}</span>
                  <span className="ml-1 text-[11px] tertiary">min</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDuration((d) => Math.min(240, d + 5))}
                  className="flex h-7 w-7 items-center justify-center rounded-md border-none"
                  style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-primary)" }}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
            <div>
              <div className="t-label tertiary mb-2">Time slot</div>
              <input type="hidden" name="time_window" value={window} />
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWindow(w)}
                    className="rounded-[9px] border px-1.5 py-2 text-[11px] sm:text-[10.5px] font-semibold capitalize whitespace-nowrap"
                    style={{
                      background:
                        window === w ? "rgba(255,122,89,0.18)" : "rgba(255,255,255,0.03)",
                      borderColor:
                        window === w ? "rgba(255,122,89,0.5)" : "var(--border-default)",
                      color: window === w ? "var(--coral-lighter)" : "var(--text-secondary)",
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div
              className="rounded-input px-3 py-2.5 text-sm"
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

          <div className="mt-2 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} disabled={pending} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? "Adding…" : "Add task"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function SelectField({
  id,
  name,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="t-label tertiary mb-2 block">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none capitalize cursor-pointer"
        style={{
          height: 44,
          padding: "0 32px 0 12px",
          background: "var(--bg-input)",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          color: "var(--cream)",
          outline: "none",
          fontSize: 14,
          fontFamily: "inherit",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <div
        className="pointer-events-none absolute right-3"
        style={{ bottom: 14, color: "var(--text-tertiary)" }}
      >
        <ChevronDown size={14} />
      </div>
    </div>
  );
}
