import { Pill } from "@/components/ui/pill";

export default function RevisionPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Revision</h1>
          <p className="t-body secondary">Spaced repetition on autopilot — coming in Phase 7.</p>
        </div>
        <Pill variant="purple">Phase 7</Pill>
      </div>

      <div className="glass" style={{ padding: 32 }}>
        <h2 className="t-h3 mb-3">What lands here in Phase 7</h2>
        <ul className="space-y-2 text-sm secondary">
          <li>• Revision schedule at +1, +3, +7, +14, +30, +60 days from study (PRD §2.2.1)</li>
          <li>• Hard rating → reset to +1 day; Medium → continue; Easy → double the interval</li>
          <li>• Quick recall → self-quiz → reference review → difficulty rating flow (PRD §2.5.2)</li>
          <li>• Phase transitions: Not Started → In Revision → Mastered (PRD §2.3.2)</li>
        </ul>
      </div>
    </div>
  );
}
