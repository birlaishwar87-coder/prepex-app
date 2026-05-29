"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ChevronDown, Minus, Plus, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { addCustomTaskAction, addTaskInitial } from "../actions";

const SUBJECTS = ["physics", "chemistry", "maths", "revision", "wellness"] as const;
const TASK_TYPES = [
  { id: "new_learning", label: "New learning" },
  { id: "revision", label: "Revision" },
  { id: "practice", label: "Practice" },
  { id: "dpp", label: "DPP" },
] as const;
const WINDOWS = ["morning", "midday", "evening", "night", "anytime"] as const;

export function AddTaskModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}) {
  const [state, formAction] = useFormState(addCustomTaskAction, addTaskInitial);
  const [subject, setSubject] = useState<string>("physics");
  const [taskType, setTaskType] = useState<string>("new_learning");
  const [duration, setDuration] = useState(60);
  const [window, setWindow] = useState<string>("morning");

  useEffect(() => {
    if (!state.error && onAdded) {
      // No error → action completed. Caller closes the modal.
    }
  }, [state, onAdded]);

  return (
    <Modal open={open} onClose={onClose} width={540}>
      <div className="p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="t-h3">Add custom task</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-3.5">
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

          <div className="grid grid-cols-2 gap-2.5">
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
            <div className="grid grid-cols-4 gap-1.5">
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

          <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-5 gap-1">
                {WINDOWS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWindow(w)}
                    className="rounded-[9px] border px-1 py-2 text-[10px] font-semibold capitalize"
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

          {state.error && (
            <div
              className="rounded-input px-3 py-2.5 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.30)",
                color: "#FCA5A5",
              }}
              role="alert"
            >
              {state.error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </Modal>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Adding…" : "Add task"}
    </button>
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
    <div className="field relative">
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none capitalize"
        style={{
          height: 56,
          padding: "22px 12px 8px",
          background: "var(--bg-input)",
          border: "1px solid var(--border-default)",
          borderRadius: 10,
          color: "var(--cream)",
          outline: "none",
          fontSize: 15,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label htmlFor={id}>{label}</label>
      <div
        className="pointer-events-none absolute right-3"
        style={{ top: 18, color: "var(--text-tertiary)" }}
      >
        <ChevronDown size={16} />
      </div>
    </div>
  );
}
