#!/usr/bin/env node
// Copies the pdf.worker.min.mjs file from react-pdf's bundled pdfjs-dist
// into public/, where the PdfViewer component loads it from at runtime.
//
// Why: Turbopack doesn't support the dynamic `import(/*webpackIgnore*/...)`
// trick pdfjs uses to lazy-load its worker. Self-hosting from /public
// sidesteps the issue and removes the unpkg CDN dependency.
//
// Run on first setup or after upgrading react-pdf / pdfjs-dist:
//   node scripts/sync-pdf-worker.mjs

import { copyFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const SRC = join(
  REPO_ROOT,
  "node_modules",
  "react-pdf",
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.mjs"
);
const DEST = join(REPO_ROOT, "public", "pdf.worker.min.mjs");

if (!existsSync(SRC)) {
  console.error(`pdfjs worker not found at ${SRC} — run npm install first.`);
  process.exit(1);
}

copyFileSync(SRC, DEST);
console.log(`Copied pdf.worker.min.mjs → public/`);
