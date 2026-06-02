"use client";

import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

/**
 * Renders a formula sheet stored as content_json on library_content.
 *
 * Expected JSON shape (each entry):
 *   { latex: string, description?: string, tags?: string[], example?: string }
 *
 * latex can contain $...$ for inline math inside description / example
 * (handled by parseSegments). The main `latex` field is rendered as BlockMath.
 */

export type FormulaEntry = {
  latex: string;
  description?: string;
  tags?: string[];
  example?: string;
};

export function FormulaSheet({ entries }: { entries: FormulaEntry[] }) {
  if (entries.length === 0) {
    return (
      <div
        className="rounded-card border px-4 py-6 text-center"
        style={{ background: "rgba(255,255,255,0.025)", borderColor: "var(--border-default)" }}
      >
        <p className="t-body-sm tertiary">No formulas in this sheet yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
      {entries.map((f, i) => (
        <FormulaCard key={i} entry={f} />
      ))}
    </div>
  );
}

function FormulaCard({ entry }: { entry: FormulaEntry }) {
  return (
    <div
      className="rounded-card border p-4"
      style={{
        background: "rgba(255,255,255,0.025)",
        borderColor: "var(--border-default)",
      }}
    >
      <div
        className="mb-2 overflow-x-auto rounded-input px-3 py-3"
        style={{
          background: "rgba(76, 29, 149, 0.10)",
          border: "1px solid rgba(76, 29, 149, 0.25)",
        }}
      >
        <SafeBlockMath latex={entry.latex} />
      </div>

      {entry.description && (
        <div className="mt-2 text-[13px] secondary leading-relaxed">
          <RichText text={entry.description} />
        </div>
      )}

      {entry.example && (
        <div
          className="mt-3 rounded-input px-3 py-2"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="t-label tertiary mb-1">Example</div>
          <div className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
            <RichText text={entry.example} />
          </div>
        </div>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "var(--text-tertiary)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Inline math segments: split on $...$ and render math/text alternately.
// If KaTeX can't parse a chunk, fall back to monospace so the page never crashes.
function RichText({ text }: { text: string }) {
  const segments = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.startsWith("$") && seg.endsWith("$")) {
          const latex = seg.slice(1, -1);
          return <SafeInlineMath key={i} latex={latex} />;
        }
        return <span key={i}>{seg}</span>;
      })}
    </>
  );
}

function SafeBlockMath({ latex }: { latex: string }) {
  try {
    return <BlockMath math={latex} />;
  } catch {
    return (
      <code
        className="tabular block whitespace-pre-wrap"
        style={{ color: "var(--text-secondary)", fontSize: 13 }}
      >
        {latex}
      </code>
    );
  }
}

function SafeInlineMath({ latex }: { latex: string }) {
  try {
    return <InlineMath math={latex} />;
  } catch {
    return (
      <code className="tabular" style={{ color: "var(--text-secondary)" }}>
        {latex}
      </code>
    );
  }
}
