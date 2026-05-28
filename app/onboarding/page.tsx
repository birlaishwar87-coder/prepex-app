import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// Onboarding is per-user; never prerender.
export const dynamic = "force-dynamic";

// Phase 4 builds the full 7-step onboarding per PRD §1.0.2.
export default function OnboardingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[680px] flex-col items-center justify-center px-6">
      <Logo size={24} className="mb-8" />
      <div className="glass w-full text-center" style={{ padding: 56 }}>
        <h1 className="t-h2 mb-3">Let&apos;s build your prep plan</h1>
        <p className="t-body secondary mb-6">
          7-step onboarding lands in Phase 4. It captures: goal, exam date, class, coaching, daily
          hours, time windows, and chapters already studied.
        </p>
        <Link href="/today" className="btn btn-ghost">
          Skip to app preview →
        </Link>
      </div>
    </div>
  );
}
