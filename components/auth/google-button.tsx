"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface GoogleButtonProps {
  redirect?: string;
}

export function GoogleButton({ redirect }: GoogleButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (redirect) callbackUrl.searchParams.set("next", redirect);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });
    if (oauthError) {
      setError(oauthError.message);
      setBusy(false);
    }
    // On success the browser navigates to Google; no further code runs here.
  }

  return (
    <>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={busy}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-btn border border-transparent text-sm font-semibold transition-all duration-200"
        style={{
          background: busy ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.95)",
          color: "#0c0e1a",
          cursor: busy ? "wait" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!busy) e.currentTarget.style.background = "#ffffff";
        }}
        onMouseLeave={(e) => {
          if (!busy) e.currentTarget.style.background = "rgba(255,255,255,0.95)";
        }}
      >
        <GoogleIcon />
        {busy ? "Connecting…" : "Continue with Google"}
      </button>
      {error && (
        <div className="mt-2 text-xs" style={{ color: "var(--error)" }}>
          {error}
        </div>
      )}
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 8 3l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c3 0 5.8 1.1 8 3l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5 0 9.5-1.9 12.9-5.1l-6-5.1c-2 1.5-4.4 2.2-6.9 2.2-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6 5.1c-.4.4 6.7-4.9 6.7-14.6 0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
