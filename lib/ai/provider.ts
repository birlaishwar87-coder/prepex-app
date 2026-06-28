import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";

// ============================================================
// AI Provider abstraction
// ============================================================
//
// Three providers, picked at runtime by env-var presence in priority order:
//
//   1. Google Gemini     (when GEMINI_API_KEY is set — generous free tier)
//   2. Anthropic Claude  (when ANTHROPIC_API_KEY is set)
//   3. Groq llama        (default, free but small daily cap)
//
// All three have compatible chat/plan patterns, so callers don't care
// which one is active. We expose two helpers: callPlanGen() for the
// strict-JSON planner, and callChat() for free-form conversation.

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

export function isGeminiEnabled(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export function isAnthropicEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function activeProviderName(): "gemini" | "anthropic" | "groq" {
  if (isGeminiEnabled()) return "gemini";
  if (isAnthropicEnabled()) return "anthropic";
  return "groq";
}

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing — provider abstraction misrouted");
  geminiClient = new GoogleGenAI({ apiKey });
  return geminiClient;
}

let groqClient: Groq | null = null;
function getGroq(): Groq {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY missing in .env.local");
  groqClient = new Groq({ apiKey });
  return groqClient;
}

let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing — provider abstraction misrouted");
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

// ============================================================
// Plan generation — strict JSON output
// ============================================================
export async function callPlanGen(args: {
  system: string;
  userJson: string;
}): Promise<string> {
  if (isGeminiEnabled()) {
    const ai = getGemini();
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

  if (isAnthropicEnabled()) {
    const client = getAnthropic();
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

  // Default: Groq
  const groq = getGroq();
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
}): Promise<string> {
  if (isGeminiEnabled()) {
    const ai = getGemini();
    // Gemini uses role: 'model' for assistant turns (not 'assistant')
    // and a parts: [{ text }] shape for content.
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

  if (isAnthropicEnabled()) {
    const client = getAnthropic();
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

  const groq = getGroq();
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
  // ```json\n{...}\n```   →   {...}
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i;
  const m = s.match(fence);
  return m ? m[1].trim() : s;
}
