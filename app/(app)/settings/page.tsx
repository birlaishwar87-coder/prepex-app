import { Pill } from "@/components/ui/pill";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Settings</h1>
          <p className="t-body secondary">Profile, exam date, hours — coming in Phase 10.</p>
        </div>
        <Pill>Phase 10</Pill>
      </div>

      <div className="glass" style={{ padding: 32 }}>
        <h2 className="t-h3 mb-3">What lands here in Phase 10</h2>
        <ul className="space-y-2 text-sm secondary">
          <li>• Edit goal, exam date, current class</li>
          <li>• Adjust daily hours (weekday / weekend) and time windows</li>
          <li>• Update coaching + batch</li>
          <li>• Clear check-in history (resets Burnout Detection baseline) (PRD §3.5)</li>
          <li>• Wellness resources page with helplines (PRD §4.5)</li>
        </ul>
      </div>
    </div>
  );
}
