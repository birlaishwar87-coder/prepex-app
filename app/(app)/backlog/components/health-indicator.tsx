// PRD §11.4 — 4-tier health label. Brand rule: even Tier 4 is framed as
// "Time to recover," not "you're behind."

import { CheckCircle2, Layers, AlertTriangle, Lightbulb } from "lucide-react";

export type HealthTier = "healthy" | "building" | "heavy" | "time_to_recover";

const TIERS: Record<
  HealthTier,
  { label: string; copy: string; color: string; bg: string; Icon: typeof CheckCircle2 }
> = {
  healthy: {
    label: "Healthy",
    copy: "Light load. Stay consistent.",
    color: "#6EE7B7",
    bg: "rgba(16, 185, 129, 0.10)",
    Icon: CheckCircle2,
  },
  building: {
    label: "Building",
    copy: "Things are piling up gently. Keep an eye on it.",
    color: "#FBBF24",
    bg: "rgba(245, 158, 11, 0.10)",
    Icon: Layers,
  },
  heavy: {
    label: "Heavy",
    copy: "Time to be deliberate. Pick high-priority items first.",
    color: "#FCA5A5",
    bg: "rgba(239, 68, 68, 0.08)",
    Icon: AlertTriangle,
  },
  time_to_recover: {
    label: "Time to recover",
    copy: "Recovery Mode can split the next 7 days 50/30/20.",
    color: "#FF9E7D",
    bg: "rgba(255, 122, 89, 0.12)",
    Icon: Lightbulb,
  },
};

export function HealthIndicator({ tier }: { tier: HealthTier }) {
  const meta = TIERS[tier];
  const Icon = meta.Icon;
  return (
    <div
      className="flex items-start gap-3 rounded-card border px-4 py-3.5"
      style={{ background: meta.bg, borderColor: `${meta.color}40` }}
    >
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: `${meta.color}22`, color: meta.color }}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="t-label" style={{ color: meta.color }}>
            Backlog health
          </span>
        </div>
        <div className="mt-0.5 text-[15px] font-semibold cream-text">{meta.label}</div>
        <div className="mt-0.5 text-[12.5px] tertiary">{meta.copy}</div>
      </div>
    </div>
  );
}

/** PRD §11.4 thresholds. */
export function computeHealthTier(args: {
  count: number;
  avgAgeDays: number;
}): HealthTier {
  // Per PRD §11.5, Recovery Mode prompt threshold is 25+. We align the
  // "Time to recover" tier to the same threshold for consistency.
  if (args.count >= 25) return "time_to_recover";
  if (args.count >= 20 || args.avgAgeDays >= 14) return "heavy";
  if (args.count >= 10 || args.avgAgeDays >= 7) return "building";
  return "healthy";
}
