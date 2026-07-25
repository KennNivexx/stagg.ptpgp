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

export const LEVEL_COLORS: Record<number, string> = {
  0: "bg-red-100 text-red-700",
  1: "bg-slate-800 text-white",
  2: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  3: "bg-blue-50 text-blue-700 border border-blue-200",
};
export const DEFAULT_LEVEL_COLOR = "bg-gray-100 text-gray-600";
