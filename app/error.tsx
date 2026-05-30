"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Logo } from "@/components/ui/logo";

/**
 * Global error boundary. Catches anything thrown inside the App Router tree
 * that wasn't handled by a closer error.tsx.
 *
 * Brand voice: older-sibling. No "Oops!". No "Something went wrong!".
 * Just calm, specific, with a way forward.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console — Phase 11 polish stops here. Sentry / structured
    // logging gets wired later when the app actually has users.
    // eslint-disable-next-line no-console
    console.error("[prepex] runtime error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center px-6 py-12">
      <Logo size={28} className="mb-8" />
      <div className="glass w-full text-center" style={{ padding: 40 }}>
        <h1 className="t-h2 mb-3">Something broke on our side.</h1>
        <p className="t-body-sm secondary mb-2">
          Not your fault. We&apos;re not going to pretend we&apos;ve seen this one before.
        </p>
        {error.digest && (
          <p className="mb-5 text-[11px] tertiary">
            Reference: <code className="tabular">{error.digest}</code>
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button type="button" onClick={() => reset()} className="btn btn-primary">
            <RefreshCw size={14} /> Try that again
          </button>
          <Link href="/today" className="btn btn-ghost">
            Back to Today
          </Link>
        </div>
      </div>
    </div>
  );
}
