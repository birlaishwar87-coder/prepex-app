import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

// Phase 1 placeholder landing. Real marketing landing lands in a later phase
// (the JSX reference at prepex design jsx/landing.jsx is the visual target).
export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col">
      <nav className="flex items-center justify-between px-6 py-6 md:px-10">
        <Logo size={22} />
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn btn-text">
            Login
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
              Try free
            </Button>
          </Link>
        </div>
      </nav>

      <section className="flex flex-1 items-center justify-center px-6 py-20 md:px-10">
        <div className="max-w-[760px] text-center">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
            style={{
              borderColor: "rgba(255, 122, 89, 0.25)",
              background: "rgba(255, 122, 89, 0.06)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--coral)", boxShadow: "0 0 8px var(--coral)" }}
            />
            <span className="t-label coral">For JEE 2027 Aspirants</span>
          </div>

          <h1 className="t-display-hero mb-6 text-cream" style={{ textWrap: "balance" }}>
            Plan <span className="text-text-tertiary font-extrabold">·</span> Execute{" "}
            <span className="text-text-tertiary font-extrabold">·</span> Survive{" "}
            <span className="text-text-tertiary font-extrabold">·</span>{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FF7A59 0%, #FF9E7D 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Win.
            </span>
          </h1>

          <p
            className="t-body-lg mb-8 max-w-[560px] mx-auto secondary"
            style={{ textWrap: "pretty" }}
          >
            The execution app for JEE aspirants. Real prep that shows up — even on bad days.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Link href="/signup">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
                Start for free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">
                Login
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm tertiary">
            Free during early access. No credit card. Built by JEE aspirants.
          </p>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs tertiary md:px-10">
        © 2026 Prepex. Plan · Execute · Survive · Win.
      </footer>
    </div>
  );
}
