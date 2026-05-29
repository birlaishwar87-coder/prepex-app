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

  return <ChatClient greeting={greeting} />;
}
