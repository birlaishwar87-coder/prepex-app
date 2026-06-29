"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Settings as SettingsIcon,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  dismissAiKeyPromptAction,
  saveAiKeyAction,
} from "../../settings/actions";

type Provider = "gemini" | "groq" | "anthropic";

const PROVIDERS: Array<{
  id: Provider;
  name: string;
  tagline: string;
  description: string;
  Icon: typeof Sparkles;
  accent: string;
  getKeyUrl: string;
  recommended?: boolean;
}> = [
  {
    id: "gemini",
    name: "Google Gemini",
    tagline: "RECOMMENDED · FREE",
    description: "1,500 requests/day on Gemini 2.5 Flash. No credit card.",
    Icon: Sparkles,
    accent: "#A78BFA",
    getKeyUrl: "https://aistudio.google.com/app/apikey",
    recommended: true,
  },
  {
    id: "groq",
    name: "Groq",
    tagline: "FREE · FAST",
    description: "Free tier, 100k tokens/day. Llama 3.3 70B.",
    Icon: Zap,
    accent: "#FF7A59",
    getKeyUrl: "https://console.groq.com/keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    tagline: "PAID · BEST",
    description: "Claude Haiku 4.5. $5 trial credit.",
    Icon: Cpu,
    accent: "#6EE7B7",
    getKeyUrl: "https://console.anthropic.com/settings/keys",
  },
];

/**
 * First-load modal that prompts a new user to add their own AI provider
 * key. Skippable — closed-community members can dismiss and add later via
 * Settings. The /today page also surfaces a small reminder banner if they
 * dismiss without adding a key, so the path back is always one click away.
 */
export function AiKeyPrompt({ onConnected }: { onConnected?: () => void }) {
  const [open, setOpen] = useState(true);
  const [activeProvider, setActiveProvider] = useState<Provider>("gemini");
  const [draft, setDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [skipPending, startSkip] = useTransition();

  if (!open) return null;

  const provider = PROVIDERS.find((p) => p.id === activeProvider)!;

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await saveAiKeyAction({ provider: activeProvider, key: draft });
      if (r.error) {
        setError(r.error);
        return;
      }
      onConnected?.();
      setOpen(false);
      // Force a refresh so server components re-fetch with the new key.
      window.location.reload();
    });
  }

  function skip() {
    startSkip(async () => {
      await dismissAiKeyPromptAction();
      setOpen(false);
    });
  }

  return (
    <div
      // items-start on mobile so the modal stays visible above the soft
      // keyboard. 100dvh tracks the dynamic viewport for accurate sizing.
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto px-3 py-4 sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="glass relative my-auto w-full max-w-[640px] max-h-[calc(100dvh-32px)] overflow-auto"
        style={{ padding: 24, background: "rgba(20, 8, 40, 0.92)" }}
      >
        <button
          type="button"
          onClick={skip}
          disabled={skipPending}
          className="absolute right-4 top-4 tertiary"
          aria-label="Skip for now"
        >
          <X size={18} />
        </button>

        <div className="mb-5">
          <div
            className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "rgba(167, 139, 250, 0.18)",
              border: "1px solid rgba(167, 139, 250, 0.40)",
              color: "#A78BFA",
            }}
          >
            <Sparkles size={20} />
          </div>
          <h2 className="t-h2 mb-1.5">Connect AI to enable Prepex.</h2>
          <p className="t-body secondary">
            Pick a provider, grab a free key, paste it here. Each key only counts against your
            own quota — no shared rate limits.
          </p>
        </div>

        {/* Provider tabs */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {PROVIDERS.map((p) => {
            const active = activeProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActiveProvider(p.id);
                  setDraft("");
                  setError(null);
                }}
                className="rounded-card border p-3 text-left transition-colors"
                style={{
                  background: active ? `${p.accent}14` : "rgba(255,255,255,0.02)",
                  borderColor: active ? `${p.accent}66` : "var(--border-default)",
                  boxShadow: active ? `0 0 0 1px ${p.accent}33` : undefined,
                  cursor: "pointer",
                }}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <p.Icon size={13} style={{ color: p.accent }} />
                  <span className="text-[12.5px] font-bold cream-text">{p.name}</span>
                </div>
                <div className="text-[9.5px] font-bold uppercase tracking-wider" style={{ color: p.accent }}>
                  {p.tagline}
                </div>
              </button>
            );
          })}
        </div>

        <p className="mb-3 text-[12.5px] secondary">{provider.description}</p>

        {/* Input */}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Paste your ${provider.name} key`}
              className="field w-full pr-9 text-[13px] tabular"
              autoComplete="off"
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim().length > 0) save();
              }}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 tertiary"
              aria-label={showKey ? "Hide key" : "Show key"}
              tabIndex={-1}
            >
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending || draft.trim().length === 0}
            className="btn btn-primary"
            style={{ minWidth: 110 }}
          >
            {pending ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Saving…
              </>
            ) : (
              "Connect"
            )}
          </button>
        </div>

        <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
          <a
            href={provider.getKeyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] font-semibold"
            style={{ color: provider.accent }}
          >
            <ExternalLink size={12} />
            Get a {provider.name} key (free)
          </a>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-[12px] font-semibold tertiary"
          >
            <SettingsIcon size={12} /> Manage in Settings
          </Link>
        </div>

        {error && (
          <p
            className="mb-3 rounded-input px-3 py-2 text-[12px]"
            style={{
              background: "rgba(248, 113, 113, 0.08)",
              border: "1px solid rgba(248, 113, 113, 0.30)",
              color: "#FCA5A5",
            }}
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-[11.5px] tertiary">
          <button type="button" onClick={skip} disabled={skipPending} className="underline">
            Skip for now
          </button>
          <span>Your keys stay on your profile · RLS owner-only</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline banner shown on /today when the user has no AI key. Smaller than
 * the full prompt, persistent — clicking opens the prompt.
 */
export function NoAiKeyBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <div
      className="mb-5 flex items-start gap-3 rounded-card border px-4 py-3"
      style={{
        background: "rgba(167, 139, 250, 0.08)",
        borderColor: "rgba(167, 139, 250, 0.30)",
      }}
      role="alert"
    >
      <Sparkles
        size={18}
        style={{ color: "#A78BFA", flexShrink: 0, marginTop: 2 }}
      />
      <div className="flex-1 text-[13.5px]">
        <div className="font-semibold cream-text">Connect AI to generate plans.</div>
        <div className="mt-0.5 tertiary">
          Each user brings their own key so quota stays free. Takes 30 seconds.
        </div>
      </div>
      <button
        type="button"
        onClick={onConnect}
        className="btn btn-primary btn-sm flex-shrink-0"
      >
        Connect
      </button>
    </div>
  );
}
