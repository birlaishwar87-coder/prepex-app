"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { RefreshCw, Send, Sparkles } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { track } from "@/lib/analytics/mixpanel";
import { sendChatTurnAction } from "./actions";
import type { ChatMessage } from "@/lib/groq/chat";

const SUGGESTED_PROMPTS = [
  "Mock in 5 days — what should I shift?",
  "I'm overwhelmed today.",
  "Move tomorrow's Chemistry to evening.",
  "How am I doing this week?",
];

const PROVIDER_LABEL: Record<"gemini" | "anthropic" | "groq" | "none", string> = {
  gemini: "Gemini 2.5 Flash",
  anthropic: "Claude Haiku 4.5",
  groq: "Llama 3.3 70B",
  none: "No key set",
};

export function ChatClient({
  greeting,
  provider,
  hasAiKey,
}: {
  greeting: string;
  provider: "gemini" | "anthropic" | "groq" | "none";
  hasAiKey: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pending]);

  function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || pending) return;

    setError(null);
    setNeedsKey(false);
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: trimmed };
    // Use the up-to-date history at action call time.
    const historyForAction = messages;
    setMessages((m) => [...m, userMsg]);

    startTransition(async () => {
      const result = await sendChatTurnAction({
        history: historyForAction,
        userMessage: trimmed,
      });
      if (result.error) {
        setError(result.error);
        if (result.needsAiKey) setNeedsKey(true);
        // ACTUALLY roll back the user message so the suggested prompts
        // re-appear (they're hidden when messages.length > 0). Without
        // this, a quota error leaves a stuck user bubble + no path back
        // to the empty-state prompts.
        setMessages((m) => m.filter((msg) => msg !== userMsg));
        setInput(trimmed); // restore in composer so user can retry
        return;
      }
      track("ai_chat_message_sent", {
        message_length: trimmed.length,
        history_length: historyForAction.length,
      });
      if (result.reply) {
        setMessages((m) => [...m, { role: "assistant", content: result.reply! }]);
      }
    });
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <div className="flex h-[calc(100vh-120px)] max-h-[860px] flex-col">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">{greeting}</h1>
          <p className="t-body secondary">
            Talk to me about your plan, your week, or tough days. I&apos;m not a tutor — I&apos;m
            here for the execution side.
          </p>
        </div>
        <Pill variant="purple">
          {hasAiKey ? `AI Chat · ${PROVIDER_LABEL[provider]}` : "AI Chat · No key"}
        </Pill>
      </div>

      {/* Message scroll area */}
      <div
        ref={scrollRef}
        className="glass mb-4 flex-1 overflow-y-auto p-4"
        style={{ minHeight: 300 }}
      >
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center">
            <p className="t-body-sm tertiary mb-5 text-center">
              Try one of these, or ask anything about your plan.
            </p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  disabled={pending}
                  className="rounded-card border px-4 py-3 text-left text-[13.5px] transition-all"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,122,89,0.30)";
                    e.currentTarget.style.background = "rgba(255,122,89,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="flex flex-col gap-4 pb-2">
            {messages.map((m, i) => (
              <Bubble key={i} message={m} />
            ))}
            {pending && <ThinkingBubble />}
          </div>
        )}
      </div>

      {error && (
        <div
          className="mb-3 flex items-start justify-between gap-3 rounded-input px-3 py-2.5 text-sm"
          style={{
            background: needsKey
              ? "rgba(167, 139, 250, 0.08)"
              : "rgba(239, 68, 68, 0.08)",
            border: needsKey
              ? "1px solid rgba(167, 139, 250, 0.30)"
              : "1px solid rgba(239, 68, 68, 0.30)",
            color: needsKey ? "#C4B5FD" : "#FCA5A5",
          }}
          role="alert"
        >
          <span className="flex-1">{error}</span>
          {needsKey && (
            <Link href="/settings" className="btn btn-primary btn-sm flex-shrink-0">
              <Sparkles size={12} /> Add key
            </Link>
          )}
        </div>
      )}

      {/* Composer */}
      <div
        className="glass flex items-end gap-3 p-3"
        style={{ borderColor: "var(--border-default)" }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask about your week, your plan, your day…"
          rows={2}
          disabled={pending}
          className="flex-1 resize-none bg-transparent text-[14px] outline-none"
          style={{
            color: "var(--cream)",
            fontFamily: "inherit",
            lineHeight: 1.5,
            minHeight: 44,
            maxHeight: 140,
          }}
        />
        <a
          href="/today"
          className="btn btn-ghost btn-sm whitespace-nowrap"
          title="Regenerate plan lives on /today"
        >
          <RefreshCw size={13} /> Regenerate
        </a>
        <button
          type="button"
          onClick={() => send(input)}
          disabled={pending || !input.trim()}
          className="btn btn-primary"
          aria-label="Send"
        >
          <Send size={14} />
          {pending ? "Sending…" : "Send"}
        </button>
      </div>

      <p className="mt-2 text-center text-[11px] tertiary">
        Ephemeral — conversations don&apos;t save in V1. Refresh clears history.
      </p>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[80%] whitespace-pre-wrap rounded-card px-4 py-2.5 text-[14px] leading-relaxed"
        style={{
          background: isUser
            ? "linear-gradient(135deg, rgba(255,122,89,0.20), rgba(255,158,125,0.10))"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${isUser ? "rgba(255,122,89,0.30)" : "var(--border-default)"}`,
          color: "var(--cream)",
        }}
      >
        {message.content}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div
        className="flex items-center gap-2 rounded-card px-4 py-2.5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border-default)",
        }}
      >
        <span className="dot" />
        <span className="dot" style={{ animationDelay: "120ms" }} />
        <span className="dot" style={{ animationDelay: "240ms" }} />
        <style>{`
          .dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--coral);
            animation: chatBounce 1.2s ease-in-out infinite;
          }
          @keyframes chatBounce {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-4px); }
          }
        `}</style>
      </div>
    </div>
  );
}
