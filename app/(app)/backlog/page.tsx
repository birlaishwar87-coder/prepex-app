import { Pill } from "@/components/ui/pill";

export default function BacklogPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Backlog</h1>
          <p className="t-body secondary">
            Missed tasks redistribute gently — coming in Phase 8.
          </p>
        </div>
        <Pill variant="warning">Phase 8</Pill>
      </div>

      <div className="glass" style={{ padding: 32 }}>
        <h2 className="t-h3 mb-3">What lands here in Phase 8</h2>
        <ul className="space-y-2 text-sm secondary">
          <li>
            • Priority decay: <code className="font-mono">max(0.2, 1.0 - days_overdue × 0.05)</code>
          </li>
          <li>• 4-tier Backlog Health: Healthy / Building / Heavy / Time to recover (PRD §11.4)</li>
          <li>• Recovery Mode at 25+ tasks — student-initiated, 50/30/20 split (PRD §11.5)</li>
          <li>• First 7 days of usage: backlog count hidden — no early-shame (PRD §11.8)</li>
        </ul>
      </div>
    </div>
  );
}
