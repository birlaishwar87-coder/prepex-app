import Link from "next/link";
import { Logo } from "@/components/ui/logo";

// Phase 3 wires real Supabase auth here. Phase 1 just holds the route.
export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center px-6">
      <Logo size={24} className="mb-8" />
      <div className="glass w-full text-center" style={{ padding: 40 }}>
        <h1 className="t-h2 mb-3">Get started</h1>
        <p className="t-body-sm secondary mb-6">Signup lands in Phase 3. Onboarding flow lands in Phase 4.</p>
        <Link href="/" className="btn btn-text">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
