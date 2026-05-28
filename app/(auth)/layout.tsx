import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

// Shared layout for /login and /signup — center a glass card,
// add a quiet "back home" link, and a footer with terms.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Link
        href="/"
        className="fixed left-6 top-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm secondary transition-all duration-200 hover:text-coral"
        style={{ transition: "color 180ms, background 180ms" }}
      >
        <ArrowLeft size={14} />
        Back home
      </Link>

      {children}

      <div className="fixed bottom-5 left-0 right-0 px-6 text-center text-[11.5px] tertiary">
        By continuing, you agree to our{" "}
        <Link href="/" className="underline-offset-4 hover:underline secondary">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/" className="underline-offset-4 hover:underline secondary">
          Privacy Policy
        </Link>
        .
      </div>
    </div>
  );
}
