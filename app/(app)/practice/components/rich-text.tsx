"use client";

import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

/**
 * Renders question text / option labels / solution text containing
 * inline ($...$) and block ($$...$$) LaTeX. If KaTeX fails to parse a
 * chunk, falls back to monospace — never crashes the page.
 *
 * Same convention as library/formula-sheet RichText — kept duplicated so
 * the two surfaces can diverge later (questions add image embeds first).
 */
export function RichText({ text }: { text: string }) {
  if (!text) return null;
  const blockParts = text.split(/(\$\$[^$]+\$\$)/g);
  return (
    <>
      {blockParts.map((bp, i) => {
        if (bp.startsWith("$$") && bp.endsWith("$$")) {
          return <SafeBlockMath key={i} latex={bp.slice(2, -2)} />;
        }
        return <InlineSegments key={i} text={bp} />;
      })}
    </>
  );
}

function InlineSegments({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("$") && p.endsWith("$")) {
          return <SafeInlineMath key={i} latex={p.slice(1, -1)} />;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function SafeBlockMath({ latex }: { latex: string }) {
  try {
    return (
      <span className="my-2 inline-block w-full overflow-x-auto">
        <BlockMath math={latex} />
      </span>
    );
  } catch {
    return (
      <code className="tabular block" style={{ color: "var(--text-secondary)" }}>
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
