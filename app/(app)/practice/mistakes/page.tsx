import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Mistake notebook · Prepex" };

export default function PracticeMistakesPage() {
  return (
    <div>
      <Link
        href="/practice"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Practice
      </Link>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Mistake notebook</h1>
          <p className="t-body secondary">
            Every wrong answer comes back on schedule. Rate it Hard, Medium, or Easy each time.
          </p>
        </div>
        <Pill variant="warning">Phase 2.4</Pill>
      </div>

      <div className="glass" style={{ padding: 28 }}>
        <h3 className="t-h4 mb-2">What lands here in Phase 2.4</h3>
        <ul className="t-body-sm secondary space-y-1.5">
          <li>• Due today / overdue / upcoming groups</li>
          <li>• Filter by subject + mistake tag (silly / conceptual / time / guess)</li>
          <li>• Tap a row → review session (re-attempt + Hard/Medium/Easy)</li>
          <li>• 3 consecutive Easy → archived (mastered)</li>
          <li>• Pattern recognition — marks lost by category this week</li>
        </ul>
      </div>
    </div>
  );
}
