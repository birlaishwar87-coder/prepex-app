import { Sparkles } from "lucide-react";

export function SampleBanner() {
  return (
    <div
      className="mb-5 flex items-start gap-3 rounded-input border px-4 py-3"
      style={{
        background: "rgba(255, 122, 89, 0.06)",
        borderColor: "rgba(255, 122, 89, 0.30)",
      }}
    >
      <Sparkles size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--coral)" }} />
      <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
        <strong className="cream-text">Sample session — PLACEHOLDER questions.</strong> Real
        content seeds in Phase 2.5. Answers here are not saved.
      </div>
    </div>
  );
}
