import { Pill } from "@/components/ui/pill";

export default function ChatPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">AI Chat</h1>
          <p className="t-body secondary">
            Open chat that adjusts your plan — coming in Phase 9.
          </p>
        </div>
        <Pill variant="purple">Phase 9</Pill>
      </div>

      <div className="glass" style={{ padding: 32 }}>
        <h2 className="t-h3 mb-3">What lands here in Phase 9</h2>
        <ul className="space-y-2 text-sm secondary">
          <li>• Groq-powered chat (llama-3.3-70b-versatile) for plan adjustments</li>
          <li>• &quot;I have a mock in 5 days&quot; / &quot;I&apos;m overwhelmed&quot; → plan regenerates with context</li>
          <li>• All chat happens through a server route — GROQ_API_KEY never leaves the server</li>
        </ul>
      </div>
    </div>
  );
}
