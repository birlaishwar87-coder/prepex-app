"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Flame, Home, Inbox, LogOut, MessageSquare, RefreshCw, Settings } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  id: string;
  label: string;
  href: string;
  Icon: typeof Home;
  badge?: string;
}

const NAV: NavItem[] = [
  { id: "today", label: "Today", href: "/today", Icon: Home },
  { id: "plan", label: "Plan", href: "/today", Icon: Calendar },
  { id: "revision", label: "Revision", href: "/revision", Icon: RefreshCw },
  { id: "backlog", label: "Backlog", href: "/backlog", Icon: Inbox },
  { id: "chat", label: "AI Chat", href: "/chat", Icon: MessageSquare },
  { id: "settings", label: "Settings", href: "/settings", Icon: Settings },
];

interface SidebarProps {
  streak?: number;
  userName?: string;
  userMeta?: string;
  /** When provided, sidebar shows the user chip + Sign out button. */
  signedIn?: boolean;
}

export function Sidebar({
  streak = 0,
  userName = "Sign in",
  userMeta = "Set up your profile",
  signedIn = false,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="prepex-sidebar fixed top-0 bottom-0 left-0 z-50 flex w-60 flex-col p-4"
      style={{
        background: "rgba(10, 1, 24, 0.65)",
        backdropFilter: "blur(40px) saturate(140%)",
        WebkitBackdropFilter: "blur(40px) saturate(140%)",
        borderRight: "1px solid var(--border-default)",
      }}
    >
      <Link href="/" className="block px-3.5 pt-3 pb-6">
        <Logo size={20} />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-white"
                  : "text-[rgba(250,247,242,0.6)] hover:bg-white/[0.04] hover:text-cream"
              )}
              style={
                isActive
                  ? {
                      background:
                        "linear-gradient(90deg, rgba(255, 122, 89, 0.18), rgba(255,122,89,0.02) 70%)",
                    }
                  : undefined
              }
            >
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded"
                  style={{
                    background: "var(--coral)",
                    boxShadow: "0 0 12px rgba(255, 122, 89, 0.7)",
                  }}
                />
              )}
              <item.Icon size={18} stroke={isActive ? "var(--coral)" : "currentColor"} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    isActive ? "text-base-100" : "text-coral-lighter"
                  )}
                  style={{
                    background: isActive ? "var(--coral)" : "rgba(255, 122, 89, 0.15)",
                    color: isActive ? "#050010" : "var(--coral-lighter)",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Streak mini card */}
      <div
        className="mt-3 rounded-xl p-3.5"
        style={{
          background: "linear-gradient(135deg, rgba(255, 122, 89, 0.15), rgba(255, 122, 89, 0.04))",
          border: "1px solid rgba(255, 122, 89, 0.25)",
          boxShadow: "0 0 16px rgba(255, 122, 89, 0.10)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg animate-flame-flicker"
            style={{ background: "rgba(255, 122, 89, 0.2)", color: "var(--coral)" }}
          >
            <Flame size={18} fill="currentColor" />
          </div>
          <div>
            <div className="tabular text-lg font-extrabold leading-none text-cream">{streak}</div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
              Day streak
            </div>
          </div>
        </div>
      </div>

      {/* User chip + signout */}
      <div className="mt-3 flex flex-col gap-2">
        <div
          className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div
            className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #4C1D95, #FF7A59)" }}
          >
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-cream">{userName}</div>
            <div className="text-[11px] text-text-tertiary">{userMeta}</div>
          </div>
        </div>

        {signedIn && (
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-[12.5px] font-medium transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-default)",
                color: "var(--text-tertiary)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                e.currentTarget.style.color = "#FCA5A5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.color = "var(--text-tertiary)";
              }}
            >
              <LogOut size={13} />
              Sign out
            </button>
          </form>
        )}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .prepex-sidebar { display: none; }
        }
      `}</style>
    </aside>
  );
}
