import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import type { Database } from "@/lib/supabase/database.types";
import { SessionClient, type SessionData } from "./session-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Focus session · Prepex" };

type Row = {
  id: string;
  timer_mode: Database["public"]["Enums"]["focus_timer_mode_t"];
  planned_duration_sec: number | null;
  actual_duration_sec: number | null;
  subject: string | null;
  chapter: string | null;
  topic: string | null;
  task_type: string | null;
  linked_task_id: string | null;
  milestones: Array<{ id: number; label: string; done: boolean }> | null;
  started_at: string | null;
  ended_at: string | null;
};

export default async function FocusSessionPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = getSupabaseServerClient();

  const { data: session } = await supabase
    .from("focus_sessions")
    .select(
      "id, timer_mode, planned_duration_sec, actual_duration_sec, subject, chapter, topic, task_type, linked_task_id, milestones, started_at, ended_at"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle<Row>();
  if (!session) notFound();

  const startedAtMs = session.started_at
    ? new Date(session.started_at).getTime()
    : Date.now();
  const resumeElapsed = session.ended_at
    ? session.actual_duration_sec ?? 0
    : Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));

  const data: SessionData = {
    id: session.id,
    timerMode: session.timer_mode,
    plannedSec: session.planned_duration_sec,
    subject: session.subject,
    chapter: session.chapter,
    topic: session.topic,
    taskType: session.task_type,
    linkedTaskId: session.linked_task_id,
    milestones: session.milestones ?? [],
    startedAtMs,
    alreadyEnded: !!session.ended_at,
    resumeElapsedSec: resumeElapsed,
  };

  return <SessionClient data={data} />;
}
