import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Custom practice · Prepex" };

export default function PracticeCustomPage() {
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
          <h1 className="t-h1 mb-2">Custom Practice Builder</h1>
          <p className="t-body secondary">
            Build your own session — any subject, chapter, topic, difficulty. Up to 5 a day.
          </p>
        </div>
        <Pill variant="coral">Phase 2.4</Pill>
      </div>

      <div className="glass" style={{ padding: 28 }}>
        <h3 className="t-h4 mb-2">What lands here in Phase 2.4</h3>
        <ul className="t-body-sm secondary space-y-1.5">
          <li>• Full filter form: subject → chapter → topic → sub-topic</li>
          <li>• Difficulty + question-type checkboxes</li>
          <li>• Source toggle: curated / Main PYQ / Advanced PYQ</li>
          <li>• Number of questions + time limit</li>
          <li>• 5-sessions-per-day server enforcement (PRD §5.3.3)</li>
        </ul>
      </div>
    </div>
  );
}
