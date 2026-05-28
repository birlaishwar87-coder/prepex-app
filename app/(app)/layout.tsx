import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

// All signed-in surfaces (today, revision, backlog, chat, settings) share this shell.
// Phase 3 wires real auth + user data into the sidebar.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell streak={0} userName="Sign in" userMeta="Phase 3 wires auth">
      {children}
    </AppShell>
  );
}
