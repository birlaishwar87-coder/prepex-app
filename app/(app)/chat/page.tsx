import { getCurrentProfile } from "@/lib/supabase/get-user";
import { ChatClient } from "./chat-client";

export default async function ChatPage() {
  const profile = await getCurrentProfile();
  const firstName = profile?.first_name?.trim() || "friend";

  // Tailored greeting based on time of day in user's TZ — small touch.
  const hours = new Date().toLocaleString("en-US", {
    timeZone: profile?.timezone ?? "Asia/Kolkata",
    hour: "2-digit",
    hour12: false,
  });
  const h = parseInt(hours, 10);
  const greeting =
    h < 5
      ? `Late one tonight, ${firstName}.`
      : h < 12
      ? `Morning, ${firstName}.`
      : h < 17
      ? `Hey ${firstName}.`
      : h < 21
      ? `Evening, ${firstName}.`
      : `Hi ${firstName}.`;

  // BYOK: tell the client which provider their key resolves to, so the
  // pill label is honest ("AI Chat · Gemini" not "llama-3.3" if they
  // chose Gemini). Priority order matches resolveProvider().
  const provider: "gemini" | "anthropic" | "groq" | "none" = profile?.gemini_api_key
    ? "gemini"
    : profile?.anthropic_api_key
      ? "anthropic"
      : profile?.groq_api_key
        ? "groq"
        : "none";
  const hasAiKey = provider !== "none";

  return <ChatClient greeting={greeting} provider={provider} hasAiKey={hasAiKey} />;
}
