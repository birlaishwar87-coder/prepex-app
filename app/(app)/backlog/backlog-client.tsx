"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { BacklogRow, type BacklogRowItem } from "./components/backlog-row";
import { AddBacklogModal } from "./components/add-backlog-modal";
import {
  HealthIndicator,
  type HealthTier,
} from "./components/health-indicator";
import { RecoveryModePrompt } from "./components/recovery-mode-prompt";
import { RecoveryModeBanner } from "./components/recovery-mode-banner";

export type BacklogClientProps = {
  active: BacklogRowItem[];
  held: BacklogRowItem[];
  userAdded: BacklogRowItem[];
  healthTier: HealthTier;
  totalCount: number;
  recoveryActive: boolean;
  recoveryDayOf7: number;
  /** Master chapter list for the add modal. */
  chapters: Array<{
    id: string;
    name: string;
    subject: "physics" | "chemistry" | "maths";
  }>;
  alreadyInBacklogChapterIds: string[];
};

export function BacklogClient({
  active,
  held,
  userAdded,
  healthTier,
  totalCount,
  recoveryActive,
  recoveryDayOf7,
  chapters,
  alreadyInBacklogChapterIds,
}: BacklogClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const alreadySet = new Set(alreadyInBacklogChapterIds);

  // Split active items into "Priority" (weight ≥ 0.5) and "Other".
  const priority = active.filter((i) => i.priorityWeight >= 0.5);
  const other = active.filter((i) => i.priorityWeight < 0.5);

  const showRecoveryPrompt = !recoveryActive && totalCount >= 25;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="t-h1 mb-2">Backlog</h1>
          <p className="t-body secondary">
            Missed tasks redistribute gently. No guilt.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Pill variant="warning">
            {totalCount} {totalCount === 1 ? "item" : "items"}
          </Pill>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="btn btn-ghost btn-sm"
          >
            <Plus size={13} /> Add chapters
          </button>
        </div>
      </div>

      {recoveryActive && <RecoveryModeBanner dayOf7={recoveryDayOf7} />}

      <div className="mb-6">
        <HealthIndicator tier={healthTier} />
      </div>

      {showRecoveryPrompt && (
        <div className="mb-7">
          <RecoveryModePrompt backlogCount={totalCount} />
        </div>
      )}

      <Group title="Priority" subtitle="High-impact first" items={priority} accent="coral" />
      <Group
        title="User added"
        subtitle="Chapters you marked as pending"
        items={userAdded}
        accent="coral"
      />
      <Group title="Other backlog" subtitle="Lower-weight items" items={other} accent="muted" />
      <Group title="Held" subtitle="Paused — revisit when ready" items={held} accent="purple" />

      {totalCount === 0 && (
        <div className="glass" style={{ padding: 28 }}>
          <h3 className="t-h4 mb-2">All caught up.</h3>
          <p className="t-body-sm secondary">
            Nothing in your backlog. Items show up here automatically if you miss a planned task,
            or you can add chapters you know are pending.
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="btn btn-primary mt-4"
          >
            <Plus size={14} /> Add chapters
          </button>
        </div>
      )}

      <AddBacklogModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        chapters={chapters}
        alreadyInBacklog={alreadySet}
      />
    </>
  );
}

function Group({
  title,
  subtitle,
  items,
  accent,
}: {
  title: string;
  subtitle: string;
  items: BacklogRowItem[];
  accent: "coral" | "purple" | "muted";
}) {
  if (items.length === 0) return null;
  const color =
    accent === "coral"
      ? "var(--coral)"
      : accent === "purple"
      ? "#C4B5FD"
      : "var(--text-tertiary)";
  return (
    <section className="mb-7">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="t-label" style={{ color }}>
            {title}
          </div>
          <p className="mt-0.5 text-[12.5px] tertiary">{subtitle}</p>
        </div>
        <span className="tabular text-[13px] secondary">{items.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <BacklogRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
