// Deterministic slug for chapter names. Used in /library/[chapter] URLs.
//
//   "Newton's Laws of Motion"   →  "newtons-laws-of-motion"
//   "p-Block"                   →  "p-block"
//   "Thermodynamics (Chem)"     →  "thermodynamics-chem"
//
// Slug is computed on the fly — we don't store it on chapters. With 54
// rows the in-memory lookup is trivial. If we ever scale, add a generated
// `slug` column.

export function chapterSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Find a chapter by its URL slug. Linear scan of the list. */
export function findChapterBySlug<T extends { name: string }>(
  chapters: readonly T[],
  slug: string
): T | undefined {
  return chapters.find((c) => chapterSlug(c.name) === slug);
}
