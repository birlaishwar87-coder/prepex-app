"use client";

import { useState } from "react";
import {
  ArrowRight,
  Brain,
  Calendar,
  CheckCircle2,
  Flame,
  Inbox,
  MessageSquare,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Pill } from "@/components/ui/pill";
import { Field, FieldTextarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Logo } from "@/components/ui/logo";

// Internal preview page — verify every Phase 1 primitive renders correctly.
// Not linked from anywhere in the app. Remove or gate before launch.
export default function DevPreview() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("ishwar@prepex.io");
  const [notes, setNotes] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-12 md:px-10">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="t-label coral mb-3">Internal</div>
          <h1 className="t-display-lg" style={{ textWrap: "balance" }}>
            Phase 1 — primitives preview
          </h1>
          <p className="t-body secondary mt-2 max-w-[640px]">
            Visual smoke test for every base component. If any of these look wrong, the design
            tokens are wrong and downstream phases will inherit the problem.
          </p>
        </div>
        <Logo size={20} />
      </header>

      {/* COLORS */}
      <Section label="01" title="Color anchors">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            { name: "Page base", value: "#050010", role: "Canvas" },
            { name: "Indigo", value: "#1A1A4E", role: "Primary anchor" },
            { name: "Purple", value: "#4C1D95", role: "Secondary" },
            { name: "Coral", value: "#FF7A59", role: "Accent only" },
            { name: "Cream", value: "#FAF7F2", role: "Primary text" },
          ].map((c) => (
            <GlassCard key={c.name} padding={16} className="flex flex-col gap-3">
              <div
                style={{
                  height: 80,
                  borderRadius: 10,
                  background: c.value,
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3) inset",
                }}
              />
              <div>
                <div className="text-sm font-semibold text-cream">{c.name}</div>
                <div className="tabular text-xs tertiary mt-0.5">{c.value}</div>
                <div className="text-[11px] tertiary mt-1">{c.role}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* TYPE */}
      <Section label="02" title="Type scale">
        <GlassCard padding={28} className="flex flex-col gap-1">
          <div className="t-display-hero">Plan · Execute · Survive · Win.</div>
          <div className="t-display-lg">Real prep that shows up.</div>
          <div className="t-h1 mt-4">Good morning, Ishwar.</div>
          <div className="t-h2">Your week in review</div>
          <div className="t-h3">Today&apos;s plan</div>
          <div className="t-h4">Physics · Newton&apos;s Laws</div>
          <div className="t-body-lg mt-3 secondary">The execution app for JEE aspirants.</div>
          <div className="t-body secondary">Tell us how you&apos;re feeling. The plan changes.</div>
          <div className="t-body-sm tertiary">Last reviewed 7 days ago · Difficulty: Medium</div>
          <div className="t-label coral mt-4">Onboarding progress</div>
        </GlassCard>
      </Section>

      {/* BUTTONS */}
      <Section label="03" title="Buttons">
        <div className="flex flex-wrap items-center gap-3.5">
          <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
            Get started
          </Button>
          <Button variant="primary">Primary</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="text">Text link</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      {/* PILLS */}
      <Section label="04" title="Pills & badges">
        <div className="flex flex-wrap gap-2.5">
          <Pill leftIcon={<Calendar size={12} />}>Mon · 27 May</Pill>
          <Pill variant="coral" leftIcon={<Flame size={12} />}>
            14 day streak
          </Pill>
          <Pill variant="purple" leftIcon={<RefreshCw size={12} />}>
            Revision
          </Pill>
          <Pill variant="success" leftIcon={<CheckCircle2 size={12} />}>
            Caught up
          </Pill>
          <Pill variant="warning">1 backlog</Pill>
        </div>
      </Section>

      {/* CARDS */}
      <Section label="05" title="Glass cards (with 5° tilt on hover)">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { icon: Brain, color: "#FF7A59", title: "AI Study Planner", body: "Daily plan that adapts to your energy and timeline." },
            { icon: RefreshCw, color: "#A78BFA", title: "Smart Revision", body: "Spaced repetition built in. Study once, revise at the right moment." },
            { icon: Inbox, color: "#FF9E7D", title: "Backlog Management", body: "Missed tasks redistribute gently. No guilt." },
            { icon: MessageSquare, color: "#A78BFA", title: "AI Chat", body: "Tell Prepex about your week. The plan adjusts." },
          ].map((f, i) => (
            <GlassCard key={i} tilt padding={24} className="cursor-default">
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border"
                style={{
                  background: `linear-gradient(135deg, ${f.color}33, ${f.color}11)`,
                  borderColor: `${f.color}55`,
                  color: f.color,
                }}
              >
                <f.icon size={22} />
              </div>
              <h3 className="t-h4 mb-2 text-cream">{f.title}</h3>
              <p className="t-body-sm secondary">{f.body}</p>
            </GlassCard>
          ))}
        </div>
      </Section>

      {/* FIELDS */}
      <Section label="06" title="Inputs (floating label, coral focus glow)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="First name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            hint="Used in your greeting"
          />
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field label="Empty field — focus me" />
          <Field label="Error state" error="Please enter a valid value" />
        </div>
        <div className="mt-4">
          <FieldTextarea
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            hint="Multi-line input with the same floating label pattern"
          />
        </div>
      </Section>

      {/* PROGRESS RING */}
      <Section label="07" title="Progress ring">
        <div className="flex flex-wrap items-center gap-8">
          <ProgressRing value={3} total={6} label="Today" />
          <ProgressRing value={73} total={100} size={120} label="Week" />
          <ProgressRing value={6} total={6} size={56} />
        </div>
      </Section>

      {/* MODAL */}
      <Section label="08" title="Modal (ESC + click-outside to close)">
        <Button variant="primary" onClick={() => setModalOpen(true)} leftIcon={<Sparkles size={14} />}>
          Open modal
        </Button>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="p-7">
            <h2 className="t-h3 mb-2">Modal with backdrop blur</h2>
            <p className="t-body-sm secondary mb-5">
              Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-xs">Esc</kbd> or click
              outside to dismiss. Body scroll is locked while open.
            </p>
            <div className="flex justify-end gap-2.5">
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      </Section>

      {/* SKELETON */}
      <Section label="09" title="Skeleton shimmer">
        <GlassCard padding={16}>
          <div className="flex items-center gap-3.5">
            <div className="skel h-6 w-6" />
            <div className="flex-1 flex-col">
              <div className="skel mb-2 h-3.5 w-3/5" />
              <div className="skel h-3 w-2/5" />
            </div>
            <div className="skel h-8 w-24" />
          </div>
        </GlassCard>
      </Section>

      {/* TARGETED HOVER MICRO */}
      <Section label="10" title="Micro details">
        <div className="flex flex-wrap gap-4">
          <GlassCard padding={20} className="flex items-center gap-3">
            <Flame
              className="animate-flame-flicker"
              style={{ color: "var(--coral)" }}
              size={20}
              fill="currentColor"
            />
            <span className="text-sm">Flame flicker — used on streak icon</span>
          </GlassCard>
          <GlassCard padding={20} className="flex items-center gap-3">
            <Target size={20} style={{ color: "var(--coral-lighter)" }} />
            <span className="text-sm tabular">Tabular numerals: 1,234,567</span>
          </GlassCard>
        </div>
      </Section>

      <footer className="mt-16 text-center text-xs tertiary">
        Phase 1 preview · Plan · Execute · Survive · Win · 2026
      </footer>
    </div>
  );
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-14">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="t-label coral">{label}</span>
        <h2 className="t-h3">{title}</h2>
      </div>
      {children}
    </section>
  );
}
