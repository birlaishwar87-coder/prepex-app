import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Chapter practice · Prepex" };

export default function PracticeChapterPage() {
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
          <h1 className="t-h1 mb-2">Chapter practice</h1>
          <p className="t-body secondary">
            Pick a subject + chapter + difficulty. We&apos;ll pull from the curated bank.
          </p>
        </div>
        <Pill variant="warning">Phase 2.4</Pill>
      </div>

      <div className="glass" style={{ padding: 28 }}>
        <h3 className="t-h4 mb-2">What lands here in Phase 2.4</h3>
        <ul className="t-body-sm secondary space-y-1.5">
          <li>• Subject + chapter + topic filters (cascading from chapters table)</li>
          <li>• Difficulty + question type checkboxes</li>
          <li>• Number-of-questions stepper (5–25)</li>
          <li>• Time limit toggle</li>
          <li>• &quot;Start practice&quot; → creates a practice_session row + redirects to /practice/session/[id]</li>
        </ul>
      </div>
    </div>
  );
}
