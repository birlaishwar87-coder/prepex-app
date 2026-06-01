import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Pill } from "@/components/ui/pill";

export const metadata = { title: "PYQ mode · Prepex" };

export default function PracticePyqPage() {
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
          <h1 className="t-h1 mb-2">PYQ mode</h1>
          <p className="t-body secondary">
            Last five years of JEE Main + Advanced. Filter by year, paper, subject.
          </p>
        </div>
        <Pill variant="purple">Phase 2.4</Pill>
      </div>

      <div className="glass" style={{ padding: 28 }}>
        <h3 className="t-h4 mb-2">What lands here in Phase 2.4</h3>
        <ul className="t-body-sm secondary space-y-1.5">
          <li>• Year picker (2021 – 2025)</li>
          <li>• Paper toggle (Main / Advanced)</li>
          <li>• Shift filter (Jan / Apr · attempt 1 / 2) for Main</li>
          <li>• Subject + chapter narrowing</li>
          <li>• Start → creates a practice_session with mode=&apos;pyq&apos;</li>
        </ul>
      </div>
    </div>
  );
}
