"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { track } from "@/lib/analytics/mixpanel";
import { deleteAccountAction } from "./actions";

export function DeleteAccountModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function doDelete() {
    setError(null);
    startTransition(async () => {
      // Track BEFORE the action: the action redirects on success and we'd
      // lose the chance.
      track("account_deleted");
      const result = await deleteAccountAction({ confirm });
      // If we reach this line, the redirect didn't happen → there was an error.
      if (result?.error) setError(result.error);
    });
  }

  const confirmOk = confirm.trim().toLowerCase() === "delete my account";

  return (
    <Modal open={open} onClose={onClose} width={480} dismissOnBackdrop={!pending}>
      <div className="p-7">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(239, 68, 68, 0.12)", color: "#FCA5A5" }}
            >
              <AlertTriangle size={18} />
            </div>
            <h2 className="t-h3">Delete account</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)" }}
          >
            <X size={16} />
          </button>
        </div>

        <p className="t-body-sm secondary mb-1">
          This removes your account and everything attached to it — profile, plans, tasks,
          revisions, check-ins, backlog, the streak you&apos;ve been building. It happens
          immediately. No 30-day grace.
        </p>
        <p className="t-body-sm tertiary mb-5">
          If you just want a clean slate, the &quot;Clear check-in history&quot; option above
          resets the burnout baseline without deleting the account.
        </p>

        <div className="field mb-3">
          <input
            id="delete_confirm"
            type="text"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder=" "
            disabled={pending}
            autoComplete="off"
          />
          <label htmlFor="delete_confirm">Type &quot;delete my account&quot;</label>
        </div>

        {error && (
          <div
            className="mb-3 rounded-input px-3 py-2.5 text-sm"
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

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="btn btn-ghost"
          >
            Keep my account
          </button>
          <button
            type="button"
            onClick={doDelete}
            disabled={!confirmOk || pending}
            className="btn"
            style={{
              background: "rgba(239, 68, 68, 0.18)",
              color: "#FCA5A5",
              border: "1px solid rgba(239, 68, 68, 0.40)",
              opacity: !confirmOk || pending ? 0.5 : 1,
              cursor: !confirmOk || pending ? "not-allowed" : "pointer",
            }}
          >
            {pending ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
