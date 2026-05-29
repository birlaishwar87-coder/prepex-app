import { AlertTriangle } from "lucide-react";

/**
 * Shown when generate-plan fell back to the previous successful plan due
 * to a Groq error (PRD §1.6). Warm, not alarming.
 */
export function FallbackBanner({ reason }: { reason?: string | null }) {
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
        <div className="font-semibold cream-text">
          Couldn&apos;t refresh today&apos;s plan
        </div>
        <div className="mt-0.5 tertiary">
          Using yesterday&apos;s structure. {reason ? `(${reason})` : "We're looking at it."} Tap
          Regenerate to try again.
        </div>
      </div>
    </div>
  );
}
