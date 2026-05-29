"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { addBacklogItemsAction } from "../actions";
import type { Database } from "@/lib/supabase/database.types";

type BacklogPriority = Database["public"]["Enums"]["backlog_priority_t"];

export type AddBacklogModalProps = {
  open: boolean;
  onClose: () => void;
  chapters: Array<{
    id: string;
    name: string;
    subject: "physics" | "chemistry" | "maths";
  }>;
  /** Chapter IDs already represented in the backlog — disabled in the picker. */
  alreadyInBacklog: Set<string>;
};

const SUBJECT_LABEL: Record<string, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  maths: "Mathematics",
};
const SUBJECT_DOT: Record<string, string> = {
  physics: "#A5B4FC",
  chemistry: "#C4B5FD",
  maths: "#FF9E7D",
};

export function AddBacklogModal({
  open,
  onClose,
  chapters,
  alreadyInBacklog,
}: AddBacklogModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState<BacklogPriority>("normal");
  const [openSubj, setOpenSubj] = useState<string | null>("physics");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (selected.size === 0) {
      setError("Pick at least one chapter.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const items = Array.from(selected).map((chapterId) => ({ chapterId, priority }));
      const result = await addBacklogItemsAction({ items });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSelected(new Set());
      onClose();
    });
  }

  // Group chapters by subject.
  const grouped: Record<string, Array<{ id: string; name: string }>> = {
    physics: [],
    chemistry: [],
    maths: [],
  };
  for (const c of chapters) grouped[c.subject].push({ id: c.id, name: c.name });

  return (
    <Modal open={open} onClose={onClose} width={620}>
      <div className="p-7">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="t-h3 mb-1">Add backlog chapters</h2>
            <p className="t-body-sm secondary">
              Mark what&apos;s pending. The planner will start pulling them into your days.
            </p>
          </div>
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

        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="pill pill-coral tabular">{selected.size} selected</div>
          <div className="flex items-center gap-1.5">
            {(["urgent", "normal", "low"] as BacklogPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className="rounded-input border px-2.5 py-1 text-[11px] font-semibold capitalize"
                style={{
                  background:
                    priority === p ? "rgba(255,122,89,0.15)" : "rgba(255,255,255,0.025)",
                  borderColor:
                    priority === p ? "rgba(255,122,89,0.45)" : "var(--border-default)",
                  color:
                    priority === p ? "var(--coral-lighter)" : "var(--text-secondary)",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div
          className="max-h-[400px] overflow-y-auto rounded-card border"
          style={{ borderColor: "var(--border-default)" }}
        >
          {(["physics", "chemistry", "maths"] as const).map((subj) => {
            const open = openSubj === subj;
            const list = grouped[subj];
            const count = list.filter((c) => selected.has(c.id)).length;
            return (
              <div
                key={subj}
                style={{ borderBottom: "1px solid var(--border-default)" }}
              >
                <button
                  type="button"
                  onClick={() => setOpenSubj(open ? null : subj)}
                  className="flex w-full items-center justify-between bg-transparent px-4 py-3"
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
                      transform: open ? "rotate(180deg)" : undefined,
                      transition: "transform 220ms",
                    }}
                  >
                    <ChevronDown size={16} />
                  </div>
                </button>
                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: open ? 800 : 0,
                    opacity: open ? 1 : 0,
                    transition: "all 320ms cubic-bezier(.2,.7,.2,1)",
                  }}
                >
                  <div className="grid grid-cols-1 gap-1 px-3 pb-3 md:grid-cols-2">
                    {list.map((c) => {
                      const isSel = selected.has(c.id);
                      const isDup = alreadyInBacklog.has(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => !isDup && toggle(c.id)}
                          disabled={isDup}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left"
                          style={{
                            background: isSel ? "rgba(255,122,89,0.08)" : "transparent",
                            opacity: isDup ? 0.4 : 1,
                            cursor: isDup ? "not-allowed" : "pointer",
                          }}
                        >
                          <div
                            className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[5px] border-[1.5px]"
                            style={{
                              borderColor: isSel ? "var(--coral)" : "var(--border-hover)",
                              background: isSel ? "var(--coral)" : "transparent",
                            }}
                          >
                            {isSel && <Check size={11} stroke="#050010" strokeWidth={3.5} />}
                          </div>
                          <span
                            className="text-[13px]"
                            style={{
                              color: isSel ? "var(--cream)" : "var(--text-secondary)",
                            }}
                          >
                            {c.name}
                            {isDup && (
                              <span className="ml-1 text-[11px] tertiary">(in backlog)</span>
                            )}
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

        {error && (
          <div
            className="mt-4 rounded-input px-3 py-2.5 text-sm"
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

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={pending || selected.size === 0}
            className="btn btn-primary"
          >
            {pending ? "Adding…" : `Add ${selected.size || ""}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
