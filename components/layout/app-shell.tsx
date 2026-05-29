import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { MobileBottomNav } from "./mobile-bottom-nav";

interface AppShellProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  streak?: number;
  userName?: string;
  userMeta?: string;
  signedIn?: boolean;
  backlogCount?: number;
}

/**
 * The signed-in app layout — 240px sidebar (≥860px) + mobile bottom nav (<860px).
 * Optional right panel slot (≥1200px) for streak card / quick stats / tomorrow preview.
 */
export function AppShell({
  children,
  rightPanel,
  streak,
  userName,
  userMeta,
  signedIn,
  backlogCount,
}: AppShellProps) {
  return (
    <>
      <Sidebar
        streak={streak}
        userName={userName}
        userMeta={userMeta}
        signedIn={signedIn}
        backlogCount={backlogCount}
      />
      <MobileBottomNav />
      <main className="prepex-main min-h-screen pl-[240px] pr-10 pt-8 pb-16 flex gap-8">
        <div className="flex-1 max-w-[800px] min-w-0">{children}</div>
        {rightPanel && (
          <aside className="prepex-right w-80 flex-shrink-0 hidden xl:block">{rightPanel}</aside>
        )}
        <style>{`
          @media (max-width: 1200px) {
            .prepex-right { display: none; }
          }
          @media (max-width: 860px) {
            .prepex-main { margin-left: 0; padding-left: 16px; padding-right: 16px; padding-bottom: 88px; }
          }
        `}</style>
      </main>
    </>
  );
}
