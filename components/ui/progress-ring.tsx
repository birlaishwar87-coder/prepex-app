import { useId } from "react";

interface ProgressRingProps {
  value: number;
  total: number;
  size?: number;
  label?: string;
  /** Stroke gradient ends. Default: coral. */
  from?: string;
  to?: string;
}

export function ProgressRing({
  value,
  total,
  size = 80,
  label,
  from = "#FF7A59",
  to = "#FF9E7D",
}: ProgressRingProps) {
  const gradId = useId();
  const pct = total === 0 ? 0 : Math.min(1, Math.max(0, value / total));
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            filter: "drop-shadow(0 0 6px rgba(255,122,89,0.5))",
            transition: "stroke-dashoffset 720ms cubic-bezier(.2,.7,.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className="tabular font-extrabold text-cream leading-none"
          style={{ fontSize: size * 0.28 }}
        >
          {value}
          <span style={{ color: "var(--text-tertiary)", fontSize: size * 0.2 }}>/{total}</span>
        </div>
        {label && (
          <div
            className="mt-1 font-medium uppercase tracking-wider"
            style={{ fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
