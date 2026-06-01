import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "Mock test · Prepex" };

export default function PracticeMockPage() {
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
          <h1 className="t-h1 mb-2">Mock test</h1>
          <p className="t-body secondary">
            Long mixed-question session pulled from PYQs. Timed. Scored at the end.
          </p>
        </div>
        <Pill variant="success">Phase 2.4</Pill>
      </div>

      <div className="glass" style={{ padding: 28 }}>
        <h3 className="t-h4 mb-2">What lands here in Phase 2.4</h3>
        <ul className="t-body-sm secondary space-y-1.5">
          <li>• Paper preset: Main (90 Q · 3h) / Advanced (54 Q · 3h)</li>
          <li>• Subject distribution + difficulty mix per preset</li>
          <li>• Full timer, mock-style discipline (no going back)</li>
          <li>• Post-mock analysis with subject-wise + tag breakdown</li>
          <li>• Mock OCR upload + AI parsing (PRD §12) deferred to V3</li>
        </ul>
      </div>
    </div>
  );
}
