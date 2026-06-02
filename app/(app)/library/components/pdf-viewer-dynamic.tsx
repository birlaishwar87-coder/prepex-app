"use client";

import dynamic from "next/dynamic";

// react-pdf calls into pdfjs-dist which can't render server-side.
// Dynamic-import with ssr:false gives us proper code-splitting too —
// pdfjs is only fetched when someone opens a PDF page.
export const PdfViewer = dynamic(
  () => import("./pdf-viewer").then((m) => m.PdfViewer),
  {
    ssr: false,
    loading: () => (
      <div
        className="glass flex items-center justify-center"
        style={{ minHeight: 600, padding: 24 }}
      >
        <span className="t-body-sm tertiary">Loading viewer…</span>
      </div>
    ),
  }
);
