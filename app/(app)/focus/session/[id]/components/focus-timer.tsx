"use client";

export function FocusTimer({
  elapsedSec,
  plannedSec,
  running,
  size = 280,
  label,
}: {
  elapsedSec: number;
  plannedSec: number | null;
  running: boolean;
  size?: number;
  label?: string;
}) {
  const r = size / 2 - 30;
  const c = 2 * Math.PI * r;
  // For stopwatch (plannedSec null): no progress fill.
  // For pomodoro/custom: progress = elapsed/planned, capped at 1.
  const pct = plannedSec ? Math.min(1, elapsedSec / plannedSec) : 0;
  const remainingOrElapsed = plannedSec
    ? Math.max(0, plannedSec - elapsedSec)
    : elapsedSec;
  const mm = Math.floor(remainingOrElapsed / 60);
  const ss = Math.floor(remainingOrElapsed % 60);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Pulsing coral halo */}
      <div
        className="absolute"
        style={{
          inset: -16,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255, 122, 89, 0.25), transparent 65%)",
          filter: "blur(24px)",
          animation: running ? "focusHalo 2.6s ease-in-out infinite" : "none",
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative"
      >
        <defs>
          <linearGradient id="focusRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF7A59" />
            <stop offset="100%" stopColor="#FF9E7D" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r - 22}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
          strokeDasharray="2 6"
        />
        {plannedSec ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#focusRing)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: "stroke-dashoffset 1000ms linear",
              filter: "drop-shadow(0 0 10px rgba(255, 122, 89, 0.6))",
            }}
          />
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#focusRing)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="6 14"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              animation: running ? "focusSpin 12s linear infinite" : "none",
              filter: "drop-shadow(0 0 10px rgba(255, 122, 89, 0.6))",
            }}
          />
        )}
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <div
          className="tabular cream-text"
          style={{
            fontSize: size * 0.22,
            fontWeight: 800,
            lineHeight: 1,
            textShadow:
              "0 2px 12px rgba(0,0,0,0.6), 0 0 32px rgba(255, 122, 89, 0.3)",
          }}
        >
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </div>
        <div
          className="t-label tertiary mt-2.5"
          style={{ letterSpacing: "0.12em" }}
        >
          {running ? "FOCUS" : "PAUSED"} {label ? `· ${label}` : ""}
        </div>
      </div>
      <style>{`
        @keyframes focusHalo {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        @keyframes focusSpin {
          to { transform: rotate(270deg); }
        }
      `}</style>
    </div>
  );
}
