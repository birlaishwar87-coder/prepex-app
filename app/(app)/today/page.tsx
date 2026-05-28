import { Pill } from "@/components/ui/pill";

export default function TodayPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Today</h1>
          <p className="t-body secondary">Your daily plan — coming in Phase 6.</p>
        </div>
        <Pill variant="coral">Phase 6</Pill>
      </div>

      <div className="glass" style={{ padding: 32 }}>
        <h2 className="t-h3 mb-3">What lands here in Phase 6</h2>
        <ul className="space-y-2 text-sm secondary">
          <li>• 30-second emotional check-in that modulates plan intensity (PRD §3)</li>
          <li>• 4–6 personalized tasks with subject-aware time windows (PRD §1.2.3)</li>
          <li>• Task cards with type-specific CTAs: Start session / Start revision / Practice</li>
          <li>• Manual add task + Regenerate plan with reason capture (PRD §1.3.4)</li>
          <li>• Bad Day Protocol when returning after 2+ inactive days (PRD §4.3)</li>
        </ul>
      </div>
    </div>
  );
}
