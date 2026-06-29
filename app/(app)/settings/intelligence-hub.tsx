"use client";

import { useState, useTransition } from "react";
import {
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { saveAiKeyAction } from "./actions";

type Provider = "gemini" | "groq" | "anthropic";

interface ProviderMeta {
  id: Provider;
  name: string;
  tagline: string;
  description: string;
  setupHint: string;
  Icon: typeof Sparkles;
  accent: string;
  recommended?: boolean;
  getKeyUrl: string;
  getKeyLabel: string;
}

// Order matters (2026-06-29 v2): Groq first because Gemini key
// creation blocks new Google accounts that don't have a GCP project.
// See [[bug-gemini-no-cloud-projects]] — diagnosed during community demo.
const PROVIDERS: ProviderMeta[] = [
  {
    id: "groq",
    name: "Groq LPU",
    tagline: "EASIEST · FREE",
    description:
      "Llama 3.3 70B on dedicated inference. 100k tokens/day free. Setup takes 30 sec.",
    setupHint: "Sign in with Google → API Keys → Create. No Cloud project needed.",
    Icon: Zap,
    accent: "#FF7A59",
    recommended: true,
    getKeyUrl: "https://console.groq.com/keys",
    getKeyLabel: "Get Groq API key (recommended)",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tagline: "BEST QUALITY · FREE",
    description:
      "Gemini 2.5 Flash. Generous free tier (~1,500 req/day). Needs a Google Cloud project — see hint below.",
    setupHint:
      "Click 'Create API key' → choose 'Create API key in NEW project' (not the dropdown). If you see 'No Cloud Projects Available', you picked the wrong path — go back and pick the new-project one.",
    Icon: Sparkles,
    accent: "#A78BFA",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    getKeyLabel: "Get Gemini API key",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    tagline: "PAID · BEST QUALITY",
    description:
      "Claude Haiku 4.5. $5 trial credit on signup, then pay-as-you-go (~$1/M tokens).",
    setupHint: "Sign up → Settings → API Keys → Create.",
    Icon: Cpu,
    accent: "#6EE7B7",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
    getKeyLabel: "Get Anthropic API key",
  },
];

function maskKey(k: string | null | undefined): string {
  if (!k) return "";
  if (k.length <= 8) return "•".repeat(k.length);
  return `${"•".repeat(k.length - 6)}${k.slice(-6)}`;
}

export function IntelligenceHubSection({
  geminiKey,
  groqKey,
  anthropicKey,
}: {
  geminiKey: string | null;
  groqKey: string | null;
  anthropicKey: string | null;
}) {
  // Determine primary engine — same priority order as the runtime
  // resolver in lib/ai/provider.ts: Gemini > Anthropic > Groq.
  const primary: Provider | null = geminiKey
    ? "gemini"
    : anthropicKey
      ? "anthropic"
      : groqKey
        ? "groq"
        : null;

  return (
    <div className="glass" style={{ padding: 24 }}>
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="t-h4">Intelligence Hub</h2>
          <p className="mt-1 text-[12.5px] tertiary">
            Connect your own AI key. Each key only counts against your quota — no shared rate
            limits.
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]"
          style={{
            background: primary ? "rgba(110, 231, 183, 0.10)" : "rgba(251, 191, 36, 0.10)",
            borderColor: primary ? "rgba(110, 231, 183, 0.30)" : "rgba(251, 191, 36, 0.30)",
            color: primary ? "#34D399" : "#FBBF24",
          }}
        >
          {primary ? (
            <>
              <Sparkles size={11} /> AI active · using {PROVIDERS.find((p) => p.id === primary)!.name}
            </>
          ) : (
            <>No AI key set yet</>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {PROVIDERS.map((p) => (
          <ProviderCard
            key={p.id}
            meta={p}
            currentKey={
              p.id === "gemini" ? geminiKey : p.id === "groq" ? groqKey : anthropicKey
            }
            isPrimary={primary === p.id}
          />
        ))}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[11.5px] tertiary">
        <Shield size={12} /> Your keys live on your profile. RLS restricts read access to your
        own account only — no other user (including Ishwar) can read them.
      </p>
    </div>
  );
}

function ProviderCard({
  meta,
  currentKey,
  isPrimary,
}: {
  meta: ProviderMeta;
  currentKey: string | null;
  isPrimary: boolean;
}) {
  const [editing, setEditing] = useState(currentKey === null);
  const [showKey, setShowKey] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await saveAiKeyAction({ provider: meta.id, key: draft });
      if (r.error) {
        setError(r.error);
        return;
      }
      setSavedTick(true);
      setEditing(false);
      setDraft("");
      setTimeout(() => setSavedTick(false), 2500);
    });
  }

  function clear() {
    setError(null);
    startTransition(async () => {
      const r = await saveAiKeyAction({ provider: meta.id, key: "" });
      if (r.error) {
        setError(r.error);
        return;
      }
      setEditing(true);
      setDraft("");
    });
  }

  return (
    <div
      className="relative rounded-card border p-4"
      style={{
        background: isPrimary ? `${meta.accent}10` : "rgba(255,255,255,0.02)",
        borderColor: isPrimary ? `${meta.accent}55` : "var(--border-default)",
        boxShadow: isPrimary ? `0 0 0 1px ${meta.accent}33` : undefined,
      }}
    >
      {isPrimary && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider"
          style={{
            background: `${meta.accent}22`,
            color: meta.accent,
            border: `1px solid ${meta.accent}55`,
          }}
        >
          Primary
        </span>
      )}

      <div className="mb-2.5 flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: `${meta.accent}22`,
            border: `1px solid ${meta.accent}55`,
            color: meta.accent,
          }}
        >
          <meta.Icon size={16} />
        </div>
        <div>
          <div className="text-[13.5px] font-bold cream-text">{meta.name}</div>
          <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: meta.accent }}>
            {meta.tagline}
          </div>
        </div>
      </div>

      <p className="mb-2 text-[12px] secondary leading-snug">{meta.description}</p>
      <div
        className="mb-3 rounded-input px-2.5 py-1.5 text-[10.5px] leading-relaxed"
        style={{
          background: `${meta.accent}10`,
          border: `1px solid ${meta.accent}30`,
          color: "var(--text-secondary)",
        }}
      >
        <span className="font-bold uppercase tracking-wider" style={{ color: meta.accent }}>
          Setup ·{" "}
        </span>
        {meta.setupHint}
      </div>

      {!editing && currentKey ? (
        <div className="space-y-2">
          <div
            className="flex items-center justify-between rounded-input px-2.5 py-2 text-[12px]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border-default)",
            }}
          >
            <span className="tabular truncate" style={{ color: "var(--text-secondary)" }}>
              {showKey ? currentKey : maskKey(currentKey)}
            </span>
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="ml-2 flex-shrink-0 tertiary"
              aria-label={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn btn-ghost btn-sm flex-1"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              className="btn btn-text btn-sm"
              style={{ color: "#FCA5A5" }}
            >
              Remove
            </button>
          </div>
          {savedTick && (
            <p className="text-[11px]" style={{ color: "#34D399" }}>
              ✓ Saved.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Paste your ${meta.name} key`}
              className="field w-full pr-9 text-[12.5px] tabular"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 tertiary"
              aria-label={showKey ? "Hide key" : "Show key"}
              tabIndex={-1}
            >
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending || draft.trim().length === 0}
              className="btn btn-primary btn-sm flex-1"
            >
              {pending ? (
                <>
                  <Loader2 size={11} className="animate-spin" /> Saving…
                </>
              ) : (
                "Save key"
              )}
            </button>
            {currentKey && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft("");
                  setError(null);
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-[11.5px]" style={{ color: "#FCA5A5" }}>
          {error}
        </p>
      )}

      <a
        href={meta.getKeyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold"
        style={{ color: meta.accent }}
      >
        <ExternalLink size={11} />
        {meta.getKeyLabel}
      </a>
    </div>
  );
}
