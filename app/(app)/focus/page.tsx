import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { SetupClient } from "./setup-client";
import type { Database, Tables } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Focus · Prepex" };

type Subject = Database["public"]["Enums"]["subject_t"];

type TaskContext = {
  id: string;
  subject: Subject;
  chapter: string | null;
  topic: string | null;
  estimatedMinutes: number;
  taskType: string;
} | null;

export default async function FocusSetupPage({
  searchParams,
}: {
  searchParams: { taskId?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = getSupabaseServerClient();

  let taskContext: TaskContext = null;
  if (searchParams.taskId) {
    const { data: task } = await supabase
      .from("tasks")
      .select("id, subject, chapter, topic, estimated_minutes, task_type, status")
      .eq("id", searchParams.taskId)
      .eq("user_id", user.id)
      .maybeSingle<
        Pick<
          Tables<"tasks">,
          "id" | "subject" | "chapter" | "topic" | "estimated_minutes" | "task_type" | "status"
        >
      >();
    if (task && task.status !== "completed") {
      taskContext = {
        id: task.id,
        subject: task.subject,
        chapter: task.chapter,
        topic: task.topic,
        estimatedMinutes: task.estimated_minutes,
        taskType: task.task_type,
      };
    }
  }

  return (
    <div>
      <Link
        href={taskContext ? "/today" : "/today"}
        className="mb-3 inline-flex items-center gap-1.5 text-[13px] tertiary"
      >
        <ArrowLeft size={14} /> Back to Today
      </Link>

      <div className="mb-6">
        <h1 className="t-h1 mb-2">Focus session</h1>
        <p className="t-body secondary">
          Pick a mode and start. No notifications, no tabs to switch between — just the timer.
        </p>
      </div>

      <SetupClient taskContext={taskContext} />
    </div>
  );
}
