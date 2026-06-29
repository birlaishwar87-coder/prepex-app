"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { track } from "@/lib/analytics/mixpanel";

// pdfjs worker — self-hosted from /public. Originally CDN-loaded via an
// `import(/*webpackIgnore: true*/...)` trick inside pdfjs, but Turbopack
// doesn't honor that magic comment and crashes the build. The worker file
// is copied from node_modules/react-pdf/node_modules/pdfjs-dist/build/
// pdf.worker.min.mjs into /public/. Bump it whenever react-pdf/pdfjs-dist
// version changes (see scripts/sync-pdf-worker.mjs).
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export function PdfViewer({
  url,
  title,
  trackingMeta,
}: {
  url: string;
  title?: string;
  /** Optional Mixpanel context for library_pdf_opened. */
  trackingMeta?: { content_id?: string; subject?: string; chapter?: string };
}) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);
  // Text + annotation layers are expensive to render — each page parses
  // every glyph and positions overlays. Default OFF for fast first paint;
  // user can flip on if they want to copy text. Cuts initial render
  // from ~2s to ~400ms on a typical formula sheet PDF.
  const [textLayer, setTextLayer] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function onLoadSuccess(pdf: { numPages: number }) {
    setNumPages(pdf.numPages);
    setError(null);
    setProgress(100);
    if (!trackedRef.current) {
      track("library_pdf_opened", {
        content_id: trackingMeta?.content_id,
        subject: trackingMeta?.subject,
        chapter: trackingMeta?.chapter,
        pages: pdf.numPages,
      });
      trackedRef.current = true;
    }
  }

  function onLoadError(err: Error) {
    setError(err.message || "Couldn't load this PDF.");
  }

  function onLoadProgress({ loaded, total }: { loaded: number; total: number }) {
    if (total > 0) setProgress(Math.round((loaded / total) * 100));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div
        className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-input border px-3 py-2"
        style={{
          background: "rgba(255,255,255,0.025)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-md border-none disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-primary)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="tabular text-[13px] secondary" style={{ minWidth: 80, textAlign: "center" }}>
            {numPages ? `${pageNumber} / ${numPages}` : "—"}
          </span>
          <button
            type="button"
            onClick={() => setPageNumber((p) => Math.min(numPages ?? p, p + 1))}
            disabled={!numPages || pageNumber >= numPages}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-md border-none disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-primary)" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTextLayer((t) => !t)}
            className="hidden h-8 items-center gap-1.5 rounded-md px-2.5 text-[11.5px] font-semibold sm:flex"
            style={{
              background: textLayer
                ? "rgba(255, 122, 89, 0.18)"
                : "rgba(255,255,255,0.05)",
              color: textLayer ? "var(--coral-lighter)" : "var(--text-secondary)",
            }}
            aria-pressed={textLayer}
            title={textLayer ? "Text selection on (slower)" : "Tap to enable text selection"}
          >
            {textLayer ? "Text on" : "Text"}
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
            aria-label="Zoom out"
            className="flex h-8 w-8 items-center justify-center rounded-md border-none"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-primary)" }}
          >
            <ZoomOut size={14} />
          </button>
          <span className="tabular text-[11.5px] tertiary" style={{ minWidth: 36, textAlign: "center" }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
            aria-label="Zoom in"
            className="flex h-8 w-8 items-center justify-center rounded-md border-none"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-primary)" }}
          >
            <ZoomIn size={14} />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}
            aria-label="Open in new tab"
          >
            <Maximize2 size={13} /> Open
          </a>
          <a
            href={url}
            download
            className="flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold"
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}
            aria-label="Download"
          >
            <Download size={13} /> Save
          </a>
        </div>
      </div>

      {/* Document body */}
      <div
        ref={containerRef}
        className="glass flex-1 overflow-auto p-3"
        style={{
          background: "rgba(255,255,255,0.025)",
          minHeight: 600,
        }}
      >
        {error ? (
          <div
            className="rounded-input px-4 py-3 text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.30)",
              color: "#FCA5A5",
            }}
            role="alert"
          >
            Couldn&apos;t load this PDF. {error}
            {title && (
              <>
                {" "}
                <a href={url} target="_blank" rel="noopener noreferrer" className="coral-text underline">
                  Open “{title}” in a new tab
                </a>
              </>
            )}
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            onLoadProgress={onLoadProgress}
            loading={<PdfLoading progress={progress} />}
            error={<PdfLoadError url={url} title={title} />}
            className="flex justify-center"
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={width ? Math.min(width - 24, 900) : undefined}
              // Default off for fast first paint — toggleable via "Text" button.
              renderTextLayer={textLayer}
              renderAnnotationLayer={textLayer}
              loading={<PdfLoading progress={null} />}
            />
          </Document>
        )}
      </div>
    </div>
  );
}

function PdfLoading({ progress }: { progress: number | null }) {
  // Show progress percent when pdfjs reports it — the "Loading PDF…" with
  // no feedback looked broken on slower connections. Bar uses the coral
  // brand color and a subtle pulse so it feels alive even at 0%.
  const pct = progress ?? 0;
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div
        className="h-1 w-48 overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: progress === null ? "40%" : `${pct}%`,
            background: "linear-gradient(90deg, #FF7A59, #FF9E7D)",
            transition: "width 200ms ease",
            animation: progress === null ? "pdfPulse 1.4s ease-in-out infinite" : undefined,
          }}
        />
      </div>
      <span className="t-body-sm tertiary tabular">
        {progress === null
          ? "Opening…"
          : pct < 100
            ? `Loading… ${pct}%`
            : "Rendering page…"}
      </span>
      <style>{`
        @keyframes pdfPulse {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function PdfLoadError({ url, title }: { url: string; title?: string }) {
  return (
    <div
      className="rounded-input px-4 py-3 text-sm"
      style={{
        background: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.30)",
        color: "#FCA5A5",
      }}
    >
      Couldn&apos;t render this PDF in-app.{" "}
      <a href={url} target="_blank" rel="noopener noreferrer" className="coral-text underline">
        Open {title ? `“${title}”` : "it"} in a new tab
      </a>
      .
    </div>
  );
}
