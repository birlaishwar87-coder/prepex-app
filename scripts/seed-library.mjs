#!/usr/bin/env node
// ============================================================
// scripts/seed-library.mjs — Phase 2.5 library seeder
// ============================================================
// Walks the Content Raw/ tree and seeds Supabase Storage + library_content.
//
// Usage:
//   node scripts/seed-library.mjs --plan          (dry run — shows mapping)
//   node scripts/seed-library.mjs --pilot         (uploads only ONE pilot PDF)
//   node scripts/seed-library.mjs --category=formulas  (seed one category)
//   node scripts/seed-library.mjs --all           (seed everything)
//
// Idempotent: skips storage uploads when the object already exists at the
// same size, and skips DB inserts when (chapter_id, type, title) is already
// present. Re-running on add is safe.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

import { normalizeFilename, resolveChapter } from "./library-mapping.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..");
const CONTENT_RAW = join(REPO_ROOT, "..", "Content Raw");
const BUCKET = "library-pdfs";

// ============================================================
// CLI flags
// ============================================================
const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const MODE_PLAN = flags.plan === true;
const MODE_PILOT = flags.pilot === true;
const MODE_ALL = flags.all === true;
const ONLY_CATEGORY = typeof flags.category === "string" ? flags.category : null;

if (!MODE_PLAN && !MODE_PILOT && !MODE_ALL && !ONLY_CATEGORY) {
  console.error(
    "Pass one of: --plan | --pilot | --category=formulas|notes|concept_map | --all"
  );
  process.exit(1);
}

// ============================================================
// Env loader (no Next runtime here — read .env.local ourselves)
// ============================================================
function loadEnv() {
  const path = join(REPO_ROOT, ".env.local");
  if (!existsSync(path)) {
    throw new Error(`.env.local not found at ${path}`);
  }
  const text = readFileSync(path, "utf8");
  const env = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
    if (key && val) env[key] = val;
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ============================================================
// Chapter lookup
// ============================================================
async function loadChapterIndex() {
  const { data, error } = await supabase
    .from("chapters")
    .select("id, subject, name");
  if (error) throw error;
  const idByName = new Map();
  for (const ch of data) idByName.set(`${ch.subject}::${ch.name}`, ch.id);
  return idByName;
}

// ============================================================
// Source enumeration
// ============================================================
const SOURCES = [
  // Formula sheets — per grade × subject
  {
    label: "formula_11_physics",
    category: "formulas",
    dir: join(CONTENT_RAW, "Formula", "Formula Sheets", "11th", "Physics"),
    subject: "physics",
    grade: "11th",
    type: "formulas",
    titleFn: (norm) => `${norm} — Formula Sheet`,
    author: "JEE Formula Sheets",
  },
  {
    label: "formula_12_physics",
    category: "formulas",
    dir: join(CONTENT_RAW, "Formula", "Formula Sheets", "12th", "Physics"),
    subject: "physics",
    grade: "12th",
    type: "formulas",
    titleFn: (norm) => `${norm} — Formula Sheet`,
    author: "JEE Formula Sheets",
  },
  {
    label: "formula_11_chemistry",
    category: "formulas",
    dir: join(CONTENT_RAW, "Formula", "Formula Sheets", "11th", "Chemistry"),
    subject: "chemistry",
    grade: "11th",
    type: "formulas",
    titleFn: (norm) => `${norm} — Formula Sheet`,
    author: "JEE Formula Sheets",
  },
  {
    label: "formula_12_chemistry",
    category: "formulas",
    dir: join(CONTENT_RAW, "Formula", "Formula Sheets", "12th", "Chemistry"),
    subject: "chemistry",
    grade: "12th",
    type: "formulas",
    titleFn: (norm) => `${norm} — Formula Sheet`,
    author: "JEE Formula Sheets",
  },
  {
    label: "formula_11_maths",
    category: "formulas",
    dir: join(CONTENT_RAW, "Formula", "Formula Sheets", "11th", "Maths"),
    subject: "maths",
    grade: "11th",
    type: "formulas",
    titleFn: (norm) => `${norm} — Formula Sheet`,
    author: "JEE Formula Sheets",
  },
  {
    label: "formula_12_maths",
    category: "formulas",
    dir: join(CONTENT_RAW, "Formula", "Formula Sheets", "12th", "Maths"),
    subject: "maths",
    grade: "12th",
    type: "formulas",
    titleFn: (norm) => `${norm} — Formula Sheet`,
    author: "JEE Formula Sheets",
  },
  // Handwritten Notes — Physics and Chemistry single-folder, Maths split
  {
    label: "notes_physics",
    category: "notes",
    dir: join(
      CONTENT_RAW,
      "Notes",
      "Handwritten Notes - Prepex",
      "BEST HANDWRITTEN NOTES JEE @iitzero",
      "Physics"
    ),
    subject: "physics",
    grade: null,
    type: "notes",
    titleFn: (norm) => `${norm} — Notes`,
    author: "iitzero (handwritten)",
  },
  {
    label: "notes_chemistry",
    category: "notes",
    dir: join(
      CONTENT_RAW,
      "Notes",
      "Handwritten Notes - Prepex",
      "BEST HANDWRITTEN NOTES JEE @iitzero",
      "Chemistry"
    ),
    subject: "chemistry",
    grade: null,
    type: "notes",
    titleFn: (norm) => `${norm} — Notes`,
    author: "iitzero (handwritten)",
  },
  {
    label: "notes_maths_11",
    category: "notes",
    dir: join(
      CONTENT_RAW,
      "Notes",
      "Handwritten Notes - Prepex",
      "BEST HANDWRITTEN NOTES JEE @iitzero",
      "Maths",
      "11th"
    ),
    subject: "maths",
    grade: "11th",
    type: "notes",
    titleFn: (norm) => `${norm} — Notes`,
    author: "Handwritten (community)",
  },
  {
    label: "notes_maths_12",
    category: "notes",
    dir: join(
      CONTENT_RAW,
      "Notes",
      "Handwritten Notes - Prepex",
      "BEST HANDWRITTEN NOTES JEE @iitzero",
      "Maths",
      "12th"
    ),
    subject: "maths",
    grade: "12th",
    type: "notes",
    titleFn: (norm) => `${norm} — Notes`,
    author: "Handwritten (Lakshya JEE)",
  },
  // Concept maps — three subject-level PDFs, no chapter mapping
  {
    label: "concept_maps",
    category: "concept_map",
    dir: join(CONTENT_RAW, "Concept maps", "Concept Maps"),
    subject: null, // derived per-file
    grade: null,
    type: "concept_map",
    titleFn: (norm) => `${norm}`,
    author: "Concept Maps",
    perSubject: {
      "Physics [Concept Maps]": { subject: "physics", chapter: "All chapters" },
      "Chemistry [Concept Maps]": {
        subject: "chemistry",
        chapter: "All chapters",
      },
      "Maths [Concept Maps]": { subject: "maths", chapter: "All chapters" },
    },
  },
];

// ============================================================
// Storage path builder (deterministic so re-runs hit same key)
// ============================================================
function storagePath({ type, subject, grade, filename }) {
  const safe = filename.replace(/[^A-Za-z0-9._\- ]+/g, "_");
  if (grade) return `${type}/${subject}/${grade}/${safe}`;
  if (subject) return `${type}/${subject}/${safe}`;
  return `${type}/${safe}`;
}

// ============================================================
// Plan a single PDF (no side effects)
// ============================================================
function planEntry(source, filename, chapterIdByKey) {
  const norm = normalizeFilename(filename);
  const action = { sourcePath: join(source.dir, filename), filename, source: source.label };

  // Concept map: deterministic per-subject mapping
  if (source.type === "concept_map") {
    const key = filename.replace(/\.pdf$/i, "");
    const meta = source.perSubject?.[key];
    if (!meta) return { ...action, skipped: true, reason: "unknown concept map file" };
    return {
      ...action,
      subject: meta.subject,
      chapter: meta.chapter,
      chapter_id: null,
      type: source.type,
      title: source.titleFn(`${meta.subject[0].toUpperCase()}${meta.subject.slice(1)} Concept Map`),
      author: source.author,
      grade: null,
    };
  }

  const dbChapter = resolveChapter(source.subject, norm);
  if (dbChapter === null) {
    return { ...action, skipped: true, reason: `explicitly skipped (alias=null) — "${norm}"` };
  }
  if (dbChapter === undefined) {
    return { ...action, skipped: true, reason: `no chapter alias for "${norm}"` };
  }
  const chapter_id = chapterIdByKey.get(`${source.subject}::${dbChapter}`);
  if (!chapter_id) {
    return {
      ...action,
      skipped: true,
      reason: `aliased to "${dbChapter}" but no chapter_id found in DB`,
    };
  }
  return {
    ...action,
    subject: source.subject,
    chapter: dbChapter,
    chapter_id,
    type: source.type,
    title: source.titleFn(norm),
    author: source.author,
    grade: source.grade,
  };
}

// ============================================================
// Upload + insert one entry
// ============================================================
async function processEntry(entry) {
  if (entry.skipped) return { uploaded: false, inserted: false, skipped: true, entry };

  const stat = statSync(entry.sourcePath);
  const objectPath = storagePath({
    type: entry.type,
    subject: entry.subject,
    grade: entry.grade,
    filename: entry.filename,
  });

  // Check if object already exists at same size
  let needUpload = true;
  const folder = objectPath.split("/").slice(0, -1).join("/");
  const name = objectPath.split("/").pop();
  const { data: listing } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 1000 });
  const existing = listing?.find((o) => o.name === name);
  if (existing && existing.metadata?.size === stat.size) {
    needUpload = false;
  }

  if (needUpload) {
    const buf = readFileSync(entry.sourcePath);
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, buf, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) throw new Error(`upload failed for ${objectPath}: ${upErr.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const fileUrl = urlData.publicUrl;

  // Check if row already exists by (chapter_id, type, title) OR (subject, chapter, title)
  let exists;
  if (entry.chapter_id) {
    const { data } = await supabase
      .from("library_content")
      .select("id, file_url")
      .eq("chapter_id", entry.chapter_id)
      .eq("type", entry.type)
      .eq("title", entry.title)
      .maybeSingle();
    exists = data;
  } else {
    const { data } = await supabase
      .from("library_content")
      .select("id, file_url")
      .eq("subject", entry.subject)
      .eq("chapter", entry.chapter)
      .eq("type", entry.type)
      .eq("title", entry.title)
      .is("chapter_id", null)
      .maybeSingle();
    exists = data;
  }

  if (exists) {
    if (exists.file_url !== fileUrl) {
      await supabase
        .from("library_content")
        .update({ file_url: fileUrl, file_size_bytes: stat.size })
        .eq("id", exists.id);
      return { uploaded: needUpload, inserted: false, updated: true, entry };
    }
    return { uploaded: needUpload, inserted: false, skipped: true, entry };
  }

  const row = {
    subject: entry.subject,
    chapter_id: entry.chapter_id,
    chapter: entry.chapter,
    type: entry.type,
    title: entry.title,
    file_url: fileUrl,
    file_size_bytes: stat.size,
    author: entry.author,
  };
  const { error: insErr } = await supabase.from("library_content").insert(row);
  if (insErr) throw new Error(`insert failed for ${entry.title}: ${insErr.message}`);

  return { uploaded: needUpload, inserted: true, entry };
}

// ============================================================
// Main
// ============================================================
async function main() {
  if (!existsSync(CONTENT_RAW)) {
    throw new Error(`Content Raw not found at: ${CONTENT_RAW}`);
  }
  const chapterIdByKey = await loadChapterIndex();
  console.log(`Loaded ${chapterIdByKey.size} chapter IDs from DB.\n`);

  // Build plan for all sources
  const plan = [];
  for (const source of SOURCES) {
    if (ONLY_CATEGORY && source.category !== ONLY_CATEGORY) continue;
    if (!existsSync(source.dir)) {
      console.warn(`[skip source] dir not found: ${source.dir}`);
      continue;
    }
    const files = readdirSync(source.dir).filter((f) => f.toLowerCase().endsWith(".pdf"));
    for (const f of files) plan.push(planEntry(source, f, chapterIdByKey));
  }

  const valid = plan.filter((p) => !p.skipped);
  const skipped = plan.filter((p) => p.skipped);

  console.log(`Planned: ${valid.length} mappable PDFs, ${skipped.length} skipped.\n`);

  if (skipped.length > 0) {
    console.log("--- skipped ---");
    for (const s of skipped) console.log(`  ${s.filename}  →  ${s.reason}`);
    console.log("");
  }

  console.log("--- mappable ---");
  for (const e of valid) {
    console.log(
      `  [${e.source}]  ${e.filename}  →  ${e.subject}/${e.chapter} (${e.type})`
    );
  }

  if (MODE_PLAN) {
    console.log("\n--plan mode: no changes made. Re-run with --pilot / --all to seed.");
    return;
  }

  let targets = valid;
  if (MODE_PILOT) {
    // Pick the Newton's Laws of Motion formula sheet if present; else first entry.
    const pilot =
      valid.find(
        (e) =>
          e.subject === "physics" &&
          e.chapter === "Newton's Laws of Motion" &&
          e.type === "formulas"
      ) ?? valid[0];
    if (!pilot) {
      console.log("No mappable PDFs found for pilot.");
      return;
    }
    targets = [pilot];
    console.log(`\nPilot mode → uploading 1 PDF: ${pilot.title}\n`);
  }

  // Execute
  let uploaded = 0;
  let inserted = 0;
  let updated = 0;
  let already = 0;
  let failed = 0;
  for (const entry of targets) {
    try {
      const r = await processEntry(entry);
      if (r.inserted) inserted += 1;
      else if (r.updated) updated += 1;
      else already += 1;
      if (r.uploaded) uploaded += 1;
      const tag = r.inserted
        ? "INSERT"
        : r.updated
          ? "UPDATE"
          : "SKIP  ";
      console.log(`${tag}  ${entry.subject}/${entry.chapter} · ${entry.title}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL  ${entry.title} — ${err.message}`);
    }
  }
  console.log(
    `\nDone. inserted=${inserted} updated=${updated} skipped=${already} uploaded=${uploaded} failed=${failed}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
