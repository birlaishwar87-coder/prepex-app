import { Pill } from "@/components/ui/pill";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/revision/intervals";
import { RevisionQueueClient, type QueueItem } from "./queue-client";

/**
 * /revision — the queue view.
 * Lists topics where phase=in_revision AND next_revision_due <= today,
 * grouped Overdue / Due today / Coming soon (within next 7 days).
 */
export default async function RevisionPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = getSupabaseServerClient();
  const today = todayISO();
  const sevenDaysOut = (() => {
    const d = new Date(today + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const { data: stateRows } = await supabase
    .from("user_topic_state")
    .select(
      "id, chapter_id, topic, phase, last_revised_at, next_revision_due, current_interval_days, latest_difficulty_rating, revision_count, onboarding_marked, chapters(name, subject, chapter_order)"
    )
    .eq("user_id", user.id)
    .eq("phase", "in_revision")
    .lte("next_revision_due", sevenDaysOut)
    .order("next_revision_due", { ascending: true })
    .returns<
      Array<{
        id: string;
        chapter_id: string;
        topic: string | null;
        phase: "not_started" | "in_revision" | "mastered";
        last_revised_at: string | null;
        next_revision_due: string | null;
        current_interval_days: number | null;
        latest_difficulty_rating: "easy" | "medium" | "hard" | null;
        revision_count: number | null;
        onboarding_marked: boolean | null;
        chapters: {
          name: string;
          subject: "physics" | "chemistry" | "maths";
          chapter_order: number | null;
        } | null;
      }>
    >();

  const overdue: QueueItem[] = [];
  const dueToday: QueueItem[] = [];
  const comingSoon: QueueItem[] = [];

  for (const row of stateRows ?? []) {
    if (!row.chapters || !row.next_revision_due) continue;
    const item: QueueItem = {
      topicStateId: row.id,
      chapter: row.chapters.name,
      subject: row.chapters.subject,
      topic: row.topic,
      lastRevisedAt: row.last_revised_at,
      nextRevisionDue: row.next_revision_due,
      latestDifficultyRating: row.latest_difficulty_rating,
      revisionCount: row.revision_count ?? 0,
      onboardingMarked: row.onboarding_marked ?? false,
    };
    if (row.next_revision_due < today) overdue.push(item);
    else if (row.next_revision_due === today) dueToday.push(item);
    else comingSoon.push(item);
  }

  // Sort overdue: most-overdue first (oldest due date).
  overdue.sort((a, b) => (a.nextRevisionDue ?? "").localeCompare(b.nextRevisionDue ?? ""));

  // Mastered count for header context.
  const { count: masteredCount } = await supabase
    .from("user_topic_state")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("phase", "mastered");

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Revision</h1>
          <p className="t-body secondary">
            Spaced repetition on autopilot. Rate honestly — the intervals will adapt.
          </p>
        </div>
        <div className="flex gap-2">
          <Pill variant="purple">
            {overdue.length + dueToday.length} due
          </Pill>
          {masteredCount != null && masteredCount > 0 && (
            <Pill variant="success">{masteredCount} mastered</Pill>
          )}
        </div>
      </div>

      <RevisionQueueClient overdue={overdue} dueToday={dueToday} comingSoon={comingSoon} />
    </div>
  );
}
