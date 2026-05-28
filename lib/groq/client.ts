import "server-only";
import Groq from "groq-sdk";

// Locked Phase 5 model — fast, cheap, good reasoning for plan generation.
export const GROQ_PLAN_MODEL = "llama-3.3-70b-versatile" as const;

let cached: Groq | null = null;

export function getGroqClient(): Groq {
  if (cached) return cached;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY missing. Set it in .env.local (server-only).");
  }
  cached = new Groq({ apiKey });
  return cached;
}
