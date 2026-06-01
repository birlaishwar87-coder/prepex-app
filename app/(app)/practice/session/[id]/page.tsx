import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Practice session · Prepex" };

interface Props {
  params: { id: string };
}

export default function PracticeSessionPage({ params }: Props) {
  return (
    <div>
      <Link
        href="/practice"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> End session
      </Link>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Active session</h1>
          <p className="t-body-sm tertiary tabular">id: {params.id}</p>
        </div>
        <Pill variant="coral">Phase 2.4</Pill>
      </div>

      <div className="glass" style={{ padding: 28 }}>
        <h3 className="t-h4 mb-2">What lands here in Phase 2.4</h3>
        <ul className="t-body-sm secondary space-y-1.5">
          <li>• PRD §5.4.1 — question-by-question UI with timer + progress bar</li>
          <li>• Options A/B/C/D with single/multi-select per question_type</li>
          <li>• Mark for review · Skip · Submit answer</li>
          <li>• Anti-distraction: no notifications, no nav, confirm-on-exit</li>
          <li>• KaTeX rendering for math; image questions load progressively</li>
          <li>• Auto-save to question_attempts on each submit</li>
          <li>• End → post-practice analysis page (§5.5) with mistake tagging</li>
        </ul>
      </div>
    </div>
  );
}
