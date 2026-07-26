import {
  LayoutDashboard, BarChart3, Building2, UserCircle2, Warehouse,
  Briefcase, Award, GraduationCap, BookOpen, TrendingUp,
  Gift, Heart, FileText, Clock, Settings,
  type LucideIcon,
} from "lucide-react";

export interface HrdMenuItem {
  href: string;
  label: string;
  /** Optional sub-heading shown inside a group's dropdown when items are
   * clustered (e.g. "Master Data", "Approval") — lets a large group like
   * Employee Relations render as scannable clusters instead of one flat
   * wall of links. Purely a display grouping; has no effect on hrefs or
   * active-state matching. */
  section?: string;
  /** When false, this item is hidden from the dropdown menu but still
   * visible in the hub page's SectionQuickLinks component. Defaults to
   * true. Use this to keep the menu compact while preserving full
   * navigation via each module's "Ringkasan" hub page. */
  showInDropdown?: boolean;
}

export interface HrdMenuGroup {
  label: string;
  icon: LucideIcon;
  color: string;
  items: HrdMenuItem[];
  /** Set only for groups with a real overview/dashboard page at their base
   * route (e.g. "/hrd/rewards") — used both to prepend a "Ringkasan" entry
   * to `items` and to mark that href for exact-match active-state checks
   * (see isHubHref in layout.tsx), the same way "/hrd" already needed. Left
   * unset for single-item groups and for "Rekrutmen", whose base route
   * ("/hrd/recruitment") is already occupied by a real sub-page (Lowongan
   * Kerja) — there's no free slot for a separate hub there. */
  hubHref?: string;
}

// Single source of truth for the HRD sidebar/top-nav structure — imported by
// both the layout (to render navigation) and each section's hub/dashboard
// page (to render its own "quick links to sub-pages" tiles), so the two
// never drift out of sync the way the pre-existing orphaned hub pages had.
export const MENU_GROUPS: HrdMenuGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "blue",
    items: [
      { href: "/hrd", label: "Overview Dashboard" },
      { href: "/hrd/dashboard-kpi", label: "KPI Dashboard" },
      { href: "/hrd/dashboard-analytics", label: "Analytics" },
    ],
  },
  {
    label: "Manpower Request Management",
    icon: BarChart3,
    color: "violet",
    items: [
      { href: "/hrd/workforce/requests", label: "Permintaan Tenaga Kerja" },
    ],
  },
  {
    label: "Recruitment Management",
    icon: Briefcase,
    color: "emerald",
    items: [
      { href: "/hrd/recruitment", label: "Lowongan Kerja" },
      { href: "/hrd/recruitment/pipeline", label: "Pipeline Kandidat" },
      { href: "/hrd/recruitment/tests", label: "Tes Rekrutmen" },
      { href: "/hrd/recruitment/interviews", label: "Interview" },
      { href: "/hrd/recruitment/decisions", label: "Keputusan Hiring" },
      { href: "/hrd/recruitment/talentpool", label: "Talent Pool" },
      { href: "/hrd/recruitment/drivers", label: "Rekrutmen Pengemudi & Operator" },
    ],
  },
  {
    label: "Desain Organisasi",
    icon: Building2,
    color: "indigo",
    hubHref: "/hrd/workplace",
    items: [
      { href: "/hrd/workplace/sk", label: "Struktur Organisasi (SK)" },
      { href: "/hrd/workplace/structure", label: "Unit Organisasi" },
      { href: "/hrd/workplace/positions", label: "Master Jabatan" },
      { href: "/hrd/workplace/jobdesc", label: "Deskripsi Kerja" },
      { href: "/hrd/workplace/jobspec", label: "Spesifikasi Kerja" },
      { href: "/hrd/workplace/grades", label: "Grade & Level" },
      { href: "/hrd/workplace/formasi", label: "Position Management (Formasi)" },
      { href: "/hrd/workplace/chart", label: "Organization Chart" },
    ],
  },
  {
    label: "Employee 360°",
    icon: UserCircle2,
    color: "cyan",
    hubHref: "/hrd/infrastructure",
    items: [
      { href: "/hrd/infrastructure/employees", label: "Data Induk Karyawan" },
      { href: "/hrd/infrastructure/contracts", label: "Kontrak Kerja" },
      { href: "/hrd/infrastructure/licenses", label: "SIM & Sertifikasi" },
    ],
  },
  {
    // Renamed from "Aset Kendaraan" and absorbed the General Affair cluster
    // (SOP-SDM-10 Pengendalian Aset, PR-PRL-01 Pengendalian Peralatan,
    // PR-SDM-07 Pemeliharaan Infrastruktur, PR-SDM-08 Housekeeping & 5R) —
    // the source SOP document groups these five together as one GA cluster
    // managed by the same Supervisor GA / Kepala Divisi SDM & Aset roles,
    // so a separate top-level menu for them would just re-fragment what the
    // company itself treats as one function.
    label: "Aset & Fasilitas",
    icon: Warehouse,
    color: "slate",
    items: [
      { href: "/hrd/infrastructure/vehicles", label: "Armada Kendaraan", section: "Kendaraan" },
      { href: "/hrd/trips", label: "Data Trip Supir", section: "Kendaraan" },
      { href: "/hrd/vehicle-requests", label: "Pengadaan Kendaraan", section: "Kendaraan" },
      { href: "/hrd/workforce/driver-monitoring", label: "Monitoring Kinerja Pengemudi", section: "Kendaraan" },
      { href: "/hrd/ga/assets", label: "Pengendalian Aset", section: "General Affair" },
      { href: "/hrd/ga/peralatan", label: "Pengendalian Peralatan", section: "General Affair" },
      { href: "/hrd/ga/infrastruktur", label: "Pemeliharaan Infrastruktur", section: "General Affair" },
      { href: "/hrd/ga/housekeeping", label: "Housekeeping & 5R", section: "General Affair" },
    ],
  },
  {
    label: "Workforce Time Management",
    icon: Clock,
    color: "amber",
    hubHref: "/hrd/workforce-time",
    items: [
      { href: "/hrd/attendance", label: "Absensi & Koreksi", section: "Waktu & Kehadiran" },
      { href: "/hrd/leaves", label: "Cuti & Saldo Cuti", section: "Waktu & Kehadiran" },
      { href: "/hrd/workforce-time/overtime", label: "Lembur & Timesheet", section: "Waktu & Kehadiran" },
      { href: "/hrd/infrastructure/locations", label: "Lokasi & Shift Kerja", section: "Infrastruktur Kerja" },
      { href: "/hrd/business-trips", label: "Perjalanan Dinas", section: "Infrastruktur Kerja" },
      { href: "/hrd/workforce-time/calendar", label: "Kalender & Penugasan", section: "Infrastruktur Kerja" },
      { href: "/hrd/incidents", label: "Laporan Insiden", section: "Infrastruktur Kerja" },
    ],
  },
  {
    label: "Competency Management",
    icon: Award,
    color: "purple",
    hubHref: "/hrd/competency",
    items: [
      { href: "/hrd/competency/library", label: "Pustaka Kompetensi" },
      { href: "/hrd/competency/skillmatrix", label: "Matriks Keahlian" },
      { href: "/hrd/competency/assessment", label: "Asesmen Kompetensi" },
      { href: "/hrd/competency/gap", label: "Analisis Kesenjangan" },
      { href: "/hrd/competency/reports", label: "Laporan Kompetensi" },
      { href: "/hrd/knowledge/mapping", label: "Mapping Kompetensi ke Pengetahuan" },
    ],
  },
  {
    label: "Learning & Training Management",
    icon: GraduationCap,
    color: "teal",
    hubHref: "/hrd/learning",
    items: [
      { href: "/hrd/learning/tna", label: "Training Need Analysis (TNA)" },
      { href: "/hrd/learning/trainings", label: "Training" },
      { href: "/hrd/learning/materials", label: "Materi Kursus" },
      { href: "/hrd/learning/quizzes", label: "Kuis & Ujian" },
      { href: "/hrd/learning/certificates", label: "Sertifikat" },
      { href: "/hrd/learning/evaluation", label: "Evaluasi Pelatihan" },
      { href: "/hrd/learning/roi", label: "Analisa Dampak ROTI" },
    ],
  },
  {
    label: "Knowledge Management",
    icon: BookOpen,
    color: "sky",
    hubHref: "/hrd/knowledge",
    items: [
      { href: "/hrd/knowledge/sop", label: "SOP dan Instruksi Kerja" },
      { href: "/hrd/knowledge/policies", label: "Kebijakan Perusahaan" },
      { href: "/hrd/knowledge/base", label: "Basis Pengetahuan" },
      { href: "/hrd/knowledge/videos", label: "Video Tutorial" },
    ],
  },
  {
    label: "Performance Management",
    icon: TrendingUp,
    color: "orange",
    hubHref: "/hrd/performance",
    items: [
      { href: "/hrd/performance/framework", label: "Framework Kinerja" },
      { href: "/hrd/performance/kpi", label: "Manajemen KPI" },
      { href: "/hrd/performance/reviews", label: "Review Kinerja" },
      { href: "/hrd/performance/feedback", label: "Umpan Balik" },
      { href: "/hrd/performance/reports", label: "Laporan Kinerja" },
    ],
  },
  {
    label: "Reward & Recognition",
    icon: Gift,
    color: "green",
    hubHref: "/hrd/rewards",
    items: [
      { href: "/hrd/rewards/payroll", label: "Payroll, Gaji & Tunjangan", section: "Kompensasi Rutin" },
      { href: "/hrd/rewards/bonuses", label: "Bonus, Insentif & Penghargaan", section: "Reward Non-Rutin" },
      { href: "/hrd/rewards/salary-review", label: "Salary Review", section: "Kompensasi Rutin" },
      { href: "/hrd/rewards/statement", label: "Total Rewards & PPh 21", section: "Reward Non-Rutin" },
      // "Formula Reward" (/hrd/rewards/formula) intentionally has no entry here —
      // it's already a tab inside the Payroll hub above, not a separate page.
    ],
  },
  {
    // Absorbed the former standalone "Succession & Talent" group — its 4
    // pages (posisi kritis, kandidat suksesor, pool suksesi, penilaian
    // kesiapan) were already thematically identical to this group's own
    // Talent Management section, down to sharing 2 literal duplicate hrefs
    // (succession/positions, succession/candidates) that used to appear
    // under two different top-level menus with two different labels.
    label: "Career Development",
    icon: TrendingUp,
    color: "fuchsia",
    hubHref: "/hrd/career",
    items: [
      { href: "/hrd/career/talent", label: "Talent Pool & Suksesi" },
      { href: "/hrd/career/transactions", label: "Transaksi Karier (Promosi, Mutasi, dll)" },
      { href: "/hrd/career/development", label: "Pengembangan & Riwayat Karier" },
      // ── MASTER & APPROVAL (via hub) ──
      { href: "/hrd/career/master", label: "Master Kebijakan Karier", section: "Master & Approval" },
      { href: "/hrd/career/approval", label: "Approval Karier", section: "Master & Approval" },
    ],
  },
  {
    label: "Employee Relations",
    icon: Heart,
    color: "pink",
    hubHref: "/hrd/relations",
    items: [
      // ── MANAJEMEN KASUS (combined hub) ──
      { href: "/hrd/relations/cases", label: "Manajemen Kasus & Hubungan Industrial", section: "Operasional" },
      { href: "/hrd/relations/warnings", label: "Surat Peringatan", section: "Operasional" },
      // ── KOMUNIKASI & SURVEI (combined hub) ──
      { href: "/hrd/relations/communication", label: "Komunikasi, Partisipasi & Survei", section: "Engagement" },
      // ── SEPARATION (combined hub) ──
      { href: "/hrd/relations/separation", label: "Resignation & Separation", section: "Operasional" },
      // ── ANALITIK ──
      { href: "/hrd/relations/analytics", label: "Dashboard & Analitik ER", section: "Engagement" },
      // ── MASTER / APPROVAL (via hub) ──
      { href: "/hrd/relations/master", label: "Master Data Employee Relations", section: "Master & Approval" },
      { href: "/hrd/relations/approval", label: "Approval Employee Relations", section: "Master & Approval" },
    ],
  },
  {
    label: "Laporan & Analitik",
    icon: FileText,
    color: "lime",
    hubHref: "/hrd/reports",
    items: [
      { href: "/hrd/reports/recruitment", label: "Laporan Rekrutmen" },
      { href: "/hrd/reports/employees", label: "Laporan Karyawan" },
      { href: "/hrd/reports/payroll", label: "Laporan Payroll" },
      { href: "/hrd/reports/training", label: "Laporan Training" },
      { href: "/hrd/reports/performance", label: "Laporan Kinerja" },
      { href: "/hrd/reports/turnover", label: "Laporan Turnover" },
    ],
  },
  {
    label: "Admin & Pengaturan",
    icon: Settings,
    color: "slate",
    hubHref: "/hrd/admin",
    items: [
      { href: "/hrd/admin/settings", label: "Pengaturan Perusahaan" },
      { href: "/hrd/admin/audit", label: "Audit Log" },
      // Tata Kelola Rapat bundles 3 SOPs (Ruang Meeting, Daftar Hadir,
      // Notulen Rapat) as tabs on one hub page — see /hrd/meetings — since
      // they're cross-cutting forms used by many other procedures rather
      // than belonging to any single module.
      { href: "/hrd/meetings", label: "Tata Kelola Rapat" },
    ],
  },
].map((group) => ({
  ...group,
  items: group.hubHref
    ? [{ href: group.hubHref, label: `Ringkasan ${group.label}` }, ...group.items]
    : group.items,
})) as HrdMenuGroup[];

// Hrefs that must match the current pathname exactly rather than by prefix —
// every hub route (plus the root "/hrd" dashboard) is itself a directory
// prefix of its own sub-items, so a plain `pathname.startsWith(href)` check
// would make the hub link look "active" on every one of its own sub-pages.
export const EXACT_MATCH_HREFS = new Set<string>(
  ["/hrd", ...MENU_GROUPS.map((g) => g.hubHref).filter((h): h is string => !!h)]
);

export function isHrdItemActive(pathname: string, href: string): boolean {
  if (EXACT_MATCH_HREFS.has(href)) return pathname === href;
  return pathname.startsWith(href);
}
