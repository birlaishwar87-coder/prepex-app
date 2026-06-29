import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

// ============================================================
// AI Provider abstraction — BYOK aware
// ============================================================
//
// Each user brings their own API key (BYOK), stored on their profile.
// Callers pass `keys` from the user's profile. If no `keys` passed (or
// all empty), we fall back to env-level keys for admin / dev use.
//
// Priority order:
//   1. Google Gemini    (Gemini 2.5 Flash) — free tier per user
//   2. Anthropic Claude (claude-haiku-4-5)
//   3. Groq llama       (default fallback)

export type AiKeys = {
  gemini?: string | null;
  groq?: string | null;
  anthropic?: string | null;
};

export class NoAiKeyError extends Error {
  constructor() {
    super("No AI provider key configured for this user.");
    this.name = "NoAiKeyError";
  }
}

export const GEMINI_PLAN_MODEL =
  process.env.GEMINI_PLAN_MODEL || "gemini-2.5-flash";
export const GEMINI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash";

export const ANTHROPIC_PLAN_MODEL =
  process.env.ANTHROPIC_PLAN_MODEL || "claude-haiku-4-5";
export const ANTHROPIC_CHAT_MODEL =
  process.env.ANTHROPIC_CHAT_MODEL || "claude-haiku-4-5";

export const GROQ_PLAN_MODEL = "llama-3.3-70b-versatile" as const;
export const GROQ_CHAT_MODEL = "llama-3.3-70b-versatile" as const;

type ResolvedProvider =
  | { name: "gemini"; key: string }
  | { name: "anthropic"; key: string }
  | { name: "groq"; key: string }
  | { name: "none" };

/** Resolve which provider to use for this call. */
function resolveProvider(keys?: AiKeys | null): ResolvedProvider {
  const gemini = keys?.gemini?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (gemini) return { name: "gemini", key: gemini };
  const anthropic =
    keys?.anthropic?.trim() || process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropic) return { name: "anthropic", key: anthropic };
  const groq = keys?.groq?.trim() || process.env.GROQ_API_KEY?.trim();
  if (groq) return { name: "groq", key: groq };
  return { name: "none" };
}

/**
 * Public helper — what provider would be used for a given user?
 * Used by the Settings UI to show the "PRIMARY" badge on the right card.
 */
export function activeProviderName(keys?: AiKeys | null): "gemini" | "anthropic" | "groq" | "none" {
  return resolveProvider(keys).name;
}

// Legacy helper kept for backward compat (used by error messages elsewhere)
export function isAnthropicEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// ============================================================
// Plan generation — strict JSON output
// ============================================================
export async function callPlanGen(args: {
  system: string;
  userJson: string;
  keys?: AiKeys | null;
}): Promise<string> {
  const provider = resolveProvider(args.keys);

  if (provider.name === "none") {
    throw new NoAiKeyError();
  }

  if (provider.name === "gemini") {
    const ai = new GoogleGenAI({ apiKey: provider.key });
    const response = await ai.models.generateContent({
      model: GEMINI_PLAN_MODEL,
      contents: args.userJson,
      config: {
        systemInstruction: args.system,
        temperature: 0.3,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });
    return stripJsonFences((response.text ?? "").trim());
  }

  if (provider.name === "anthropic") {
    const client = new Anthropic({ apiKey: provider.key });
    const message = await client.messages.create({
      model: ANTHROPIC_PLAN_MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system: args.system,
      messages: [
        {
          role: "user",
          content: args.userJson + "\n\nReturn ONLY the JSON object — no markdown, no commentary.",
        },
      ],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return stripJsonFences(text);
  }

  // Groq
  const groq = new Groq({ apiKey: provider.key });
  const completion = await groq.chat.completions.create({
    model: GROQ_PLAN_MODEL,
    response_format: { type: "json_object" },
    temperature: 0.3,
    max_tokens: 4000,
    messages: [
      { role: "system", content: args.system },
      { role: "user", content: args.userJson },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

// ============================================================
// Free-form chat
// ============================================================
export type ChatRole = "user" | "assistant";
export type ChatMsg = { role: ChatRole; content: string };

export async function callChat(args: {
  system: string;
  history: ChatMsg[];
  userMessage: string;
  maxTokens?: number;
  keys?: AiKeys | null;
}): Promise<string> {
  const provider = resolveProvider(args.keys);

  if (provider.name === "none") {
    throw new NoAiKeyError();
  }

  if (provider.name === "gemini") {
    const ai = new GoogleGenAI({ apiKey: provider.key });
    const contents = [
      ...args.history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: args.userMessage }] },
    ];
    const response = await ai.models.generateContent({
      model: GEMINI_CHAT_MODEL,
      contents,
      config: {
        systemInstruction: args.system,
        temperature: 0.7,
        maxOutputTokens: args.maxTokens ?? 700,
      },
    });
    return (response.text ?? "").trim();
  }

  if (provider.name === "anthropic") {
    const client = new Anthropic({ apiKey: provider.key });
    const message = await client.messages.create({
      model: ANTHROPIC_CHAT_MODEL,
      max_tokens: args.maxTokens ?? 700,
      temperature: 0.7,
      system: args.system,
      messages: [
        ...args.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: args.userMessage },
      ],
    });
    return message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
  }

  // Groq
  const groq = new Groq({ apiKey: provider.key });
  const completion = await groq.chat.completions.create({
    model: GROQ_CHAT_MODEL,
    temperature: 0.7,
    max_tokens: args.maxTokens ?? 700,
    messages: [
      { role: "system", content: args.system },
      ...args.history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: args.userMessage },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

function stripJsonFences(s: string): string {
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const m = s.match(fence);
  return m ? m[1].trim() : s;
}
