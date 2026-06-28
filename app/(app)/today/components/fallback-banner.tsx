import { AlertTriangle } from "lucide-react";

/**
 * Shown when generate-plan fell back to the previous successful plan due
 * to an AI provider error (PRD §1.6). Warm, not alarming.
 *
 * `reason` is already sanitized upstream by sanitizeProviderError() in
 * lib/groq/generate-plan.ts — never raw provider JSON. We hard-cap length
 * here as a belt-and-braces guard against any future leakage path.
 */
export function FallbackBanner({ reason }: { reason?: string | null }) {
  const safeReason =
    reason && reason.length > 0
      ? reason.length > 160
        ? `${reason.slice(0, 157).trim()}…`
        : reason
      : "Yesterday's plan still works while we recover.";

  return (
    <div
      className="mb-5 flex items-start gap-3 rounded-card border px-4 py-3"
      style={{
        background: "rgba(245, 158, 11, 0.08)",
        borderColor: "rgba(245, 158, 11, 0.30)",
      }}
      role="alert"
    >
      <AlertTriangle size={18} style={{ color: "var(--warning)", flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 text-[13.5px]" style={{ color: "var(--text-secondary)" }}>
        <div className="font-semibold cream-text">Today&apos;s plan kept yesterday&apos;s shape.</div>
        <div className="mt-0.5 tertiary">{safeReason}</div>
      </div>
    </div>
  );
}
