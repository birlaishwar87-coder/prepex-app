import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { StartForm } from "./start-form";

export const dynamic = "force-dynamic";

// Single-button landing for the closed community build.
// Returning members (with a valid cookie) bounce straight to the app —
// new visitors fill one name field and tap Get started. No login / signup.
export default async function LandingPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle<{ onboarding_completed_at: string | null }>();
    redirect(profile?.onboarding_completed_at ? "/today" : "/onboarding");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col">
      <nav className="flex items-center justify-between px-6 py-6 md:px-10">
        <Logo size={22} />
      </nav>

      <section className="flex flex-1 items-center justify-center px-6 py-12 md:px-10">
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

          <StartForm />
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-xs tertiary md:px-10">
        © 2026 Prepex. Plan · Execute · Survive · Win.
      </footer>
    </div>
  );
}
