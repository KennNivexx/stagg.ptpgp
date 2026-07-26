// Shared by TreeView.tsx and TableView.tsx (org structure pages).

// Job-title rank for sorting employees within a unit — without this, the
// employee list falls back to alphabetical-by-name, which visually puts a
// Direktur below a Supervisor whenever the supervisor's name happens to
// sort earlier. Lower number = more senior = shown first.
const RANK_KEYWORDS: [RegExp, number][] = [
  [/direktur utama|komisaris/i, 0],
  [/wakil direktur|direktur/i, 1],
  [/general manager/i, 2],
  [/manager|manajer/i, 3],
  [/supervisor|koordinator|asisten manajer/i, 4],
  [/staff|staf|officer|analyst|admin/i, 5],
];
const DEFAULT_RANK = 6; // pelaksana-level roles (sopir, kenek, buruh, checker, dll) with no keyword match

export function positionRank(position: string | undefined): number {
  if (!position) return DEFAULT_RANK;
  for (const [re, rank] of RANK_KEYWORDS) if (re.test(position)) return rank;
  return DEFAULT_RANK;
}

export function sortByPositionRank<T extends { name: string; position?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ra = positionRank(a.position), rb = positionRank(b.position);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });
}

// Groups an already rank-sorted employee list into rank tiers so the UI can
// render each tier as its own labeled cluster (Direksi / Manajemen / Staff /
// Pelaksana) instead of one flat list — employees within a unit have no
// formal parent/child rows in the DB, so this is what makes seniority
// legible in the tree without a schema change.
export const RANK_TIER_LABEL: Record<number, string> = {
  0: "Direksi",
  1: "Direksi",
  2: "Manajemen Senior",
  3: "Manajemen",
  4: "Supervisor / Koordinator",
  5: "Staff",
  6: "Pelaksana",
};

export const RANK_TIER_COLOR: Record<number, string> = {
  0: "text-red-600",
  1: "text-red-600",
  2: "text-violet-600",
  3: "text-indigo-600",
  4: "text-sky-600",
  5: "text-slate-500",
  6: "text-slate-400",
};

export function groupByRankTier<T extends { name: string; position?: string }>(
  items: T[]
): { rank: number; label: string; items: T[] }[] {
  const sorted = sortByPositionRank(items);
  const groups: { rank: number; label: string; items: T[] }[] = [];
  for (const item of sorted) {
    const rank = positionRank(item.position);
    const last = groups[groups.length - 1];
    if (last && last.rank === rank) last.items.push(item);
    else groups.push({ rank, label: RANK_TIER_LABEL[rank] ?? "Lainnya", items: [item] });
  }
  return groups;
}

// unit_organisasi.level is tree DEPTH (0 = root company, 1 = every division,
// 2 = a sub-unit like Gudang under Operasional, ...) — NOT an org rank. The
// 14 real divisions all sit at level 1 side by side, so a fixed rank-title
// table (level 1 = "Direktur Utama", etc.) mislabels every division box with
// the same title regardless of who actually leads it. These generic,
// depth-based labels describe what the box IS, not a rank nobody holds.
export function getLevelLabel(level: number): string {
  switch (level) {
    case 0: return "Perusahaan";
    case 1: return "Divisi";
    case 2: return "Sub-Unit / Dinas";
    case 3: return "Bagian";
    default: return "Unit";
  }
}

// Display-only formatting: pads/truncates a dotted org code to a fixed
// number of segments (company standard is 7, e.g. "1.1.0.0.0.0.0") so codes
// look consistent across the org chart regardless of how deep that branch
// actually goes. Deliberately NOT applied to the stored `code`/`parent_code`
// values themselves — those drive real parent-child matching throughout the
// app (formasi, jabatan, employee grouping), and normalizing them in the
// database would risk breaking those relationships across many tables.
export function formatOrgCode(code: string, segments = 7): string {
  const parts = code.split(".");
  while (parts.length < segments) parts.push("0");
  return parts.slice(0, segments).join(".");
}

export const LEVEL_COLORS: Record<number, string> = {
  0: "bg-red-100 text-red-700",
  1: "bg-slate-800 text-white",
  2: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  3: "bg-blue-50 text-blue-700 border border-blue-200",
};
export const DEFAULT_LEVEL_COLOR = "bg-gray-100 text-gray-600";
