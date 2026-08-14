/**
 * Single source of truth for jabatan (position) seniority ordering — highest
 * rank first. Reconciled from every rank-name actually used in seed data
 * (supabase/migrations/20260723001_org_hierarchy_full.sql) plus the Master
 * Jabatan form's previous hardcoded list, which only covered 7 of these 10
 * values — meaning "General Manager", "Direktur Utama", and "Komisaris" rows
 * silently fell through every level-based sort/comparison before this file
 * existed.
 *
 * Deliberately separate from `unit_organisasi.level` (tree depth, derived
 * from `code` in src/app/actions/org.ts's codeLevel()) — that's a different
 * concept (how deep in the org chart a UNIT sits) from this (how senior a
 * JABATAN/position is). Don't conflate the two.
 */
export const ORG_LEVELS = [
  "Komisaris",
  "Direktur Utama",
  "Direktur",
  "Wakil Direktur",
  "General Manager",
  "Kepala Divisi",
  "Manager",
  "Asisten Manajer",
  "Supervisor",
  "Staff",
] as const;

const RANK_BY_LEVEL = new Map<string, number>(ORG_LEVELS.map((level, i) => [level, i]));

/** Lower number = more senior. Unrecognized/empty levels sort last (a large
 * finite number, not 0) so they never masquerade as the most senior rank —
 * this was the exact bug in the old employee/career/page.tsx parseLevel(),
 * where an unparseable level fell back to 0 and broke every comparison. */
export function levelRank(level: string | null | undefined): number {
  if (!level) return ORG_LEVELS.length + 1;
  return RANK_BY_LEVEL.get(level) ?? ORG_LEVELS.length + 1;
}

/** True if `a` outranks `b` (a is more senior). Ties (equal or both
 * unrecognized) are never "outranks". */
export function isMoreSenior(a: string | null | undefined, b: string | null | undefined): boolean {
  const ra = levelRank(a);
  const rb = levelRank(b);
  return ra < rb && ra <= ORG_LEVELS.length && rb <= ORG_LEVELS.length;
}
