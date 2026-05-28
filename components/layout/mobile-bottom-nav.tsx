"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Home, Inbox, MessageSquare, Settings } from "lucide-react";

const TABS = [
  { id: "today", label: "Today", href: "/today", Icon: Home },
  { id: "plan", label: "Plan", href: "/today", Icon: Calendar },
  { id: "chat", label: "Chat", href: "/chat", Icon: MessageSquare },
  { id: "backlog", label: "Backlog", href: "/backlog", Icon: Inbox },
  { id: "settings", label: "Profile", href: "/settings", Icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="prepex-mobile-nav fixed bottom-0 left-0 right-0 z-50 hidden h-16 items-center justify-around px-2"
      style={{
        background: "rgba(10, 1, 24, 0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid var(--border-default)",
      }}
    >
      {TABS.map((t) => {
        const active = pathname === t.href || (t.href !== "/" && pathname?.startsWith(t.href));
        return (
          <Link
            key={t.id}
            href={t.href}
            className="relative flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-semibold"
            style={{
              color: active ? "var(--coral)" : "rgba(250,247,242,0.55)",
              transition: "color 200ms",
            }}
          >
            {active && (
              <span
                aria-hidden
                className="absolute -top-0.5 h-1 w-1 rounded-full"
                style={{ background: "var(--coral)", boxShadow: "0 0 6px var(--coral)" }}
              />
            )}
            <t.Icon size={20} />
            <span>{t.label}</span>
          </Link>
        );
      })}
      <style>{`
        @media (max-width: 860px) {
          .prepex-mobile-nav { display: flex; }
        }
      `}</style>
    </nav>
  );
}
