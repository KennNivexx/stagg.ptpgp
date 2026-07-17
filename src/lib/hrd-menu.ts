import {
  LayoutDashboard, BarChart3, Building2, UserCircle2, Warehouse,
  Briefcase, Award, GraduationCap, BookOpen, TrendingUp,
  Gift, GitBranch, Heart, FileText, Clock, Settings,
  type LucideIcon,
} from "lucide-react";

export interface HrdMenuItem {
  href: string;
  label: string;
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
      { href: "/hrd/dashboard-okr", label: "OKR Dashboard" },
      { href: "/hrd/dashboard-analytics", label: "Analytics" },
    ],
  },
  {
    label: "Perencanaan Tenaga Kerja",
    icon: BarChart3,
    color: "violet",
    items: [
      { href: "/hrd/workforce/requests", label: "Permintaan SDM" },
    ],
  },
  {
    label: "Rekrutmen",
    icon: Briefcase,
    color: "emerald",
    items: [
      { href: "/hrd/recruitment", label: "Lowongan Kerja" },
      { href: "/hrd/recruitment/pipeline", label: "Pipeline Kandidat" },
      { href: "/hrd/recruitment/tests", label: "Tes Rekrutmen" },
      { href: "/hrd/recruitment/interviews", label: "Interview" },
      { href: "/hrd/recruitment/decisions", label: "Keputusan Hiring" },
      { href: "/hrd/recruitment/talentpool", label: "Talent Pool" },
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
      { href: "/hrd/workplace/departments", label: "Departemen" },
      { href: "/hrd/workplace/positions", label: "Master Jabatan" },
      { href: "/hrd/workplace/jobdesc", label: "Deskripsi Kerja" },
      { href: "/hrd/workplace/jobspec", label: "Spesifikasi Kerja" },
      { href: "/hrd/workplace/grades", label: "Grade & Level" },
      { href: "/hrd/workplace/formasi", label: "Position Management (Formasi)" },
      { href: "/hrd/workplace/careerpath", label: "Career Path" },
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
    label: "Aset & Fasilitas",
    icon: Warehouse,
    color: "slate",
    items: [
      { href: "/hrd/infrastructure/vehicles", label: "Armada Kendaraan" },
      { href: "/hrd/trips", label: "Data Trip Supir" },
      { href: "/hrd/vehicle-requests", label: "Pengadaan Kendaraan" },
      { href: "/hrd/infrastructure/documents", label: "Dokumen Perusahaan" },
    ],
  },
  {
    label: "Workforce Time Management",
    icon: Clock,
    color: "amber",
    hubHref: "/hrd/workforce-time",
    items: [
      { href: "/hrd/infrastructure/locations", label: "Lokasi Kerja" },
      { href: "/hrd/infrastructure/shifts", label: "Shift Kerja" },
      { href: "/hrd/workforce-time/calendar", label: "Kalender Kerja" },
      { href: "/hrd/workforce-time/assignments", label: "Penugasan Kerja" },
      { href: "/hrd/attendance", label: "Absensi" },
      { href: "/hrd/workforce-time/corrections", label: "Koreksi Absensi" },
      { href: "/hrd/workforce-time/overtime", label: "Lembur" },
      { href: "/hrd/workforce-time/timesheet", label: "Timesheet" },
      { href: "/hrd/leaves", label: "Cuti & Izin" },
      { href: "/hrd/workforce-time/leave-balance", label: "Saldo Cuti" },
      { href: "/hrd/business-trips", label: "Perjalanan Dinas" },
      { href: "/hrd/incidents", label: "Laporan Insiden" },
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
      { href: "/hrd/knowledge/mapping", label: "Mapping Kompetensi" },
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
      { href: "/hrd/performance/okr", label: "Manajemen OKR" },
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
      { href: "/hrd/rewards/payroll", label: "Payroll" },
      { href: "/hrd/rewards/salary", label: "Komponen Gaji" },
      { href: "/hrd/rewards/formula", label: "Formula Reward" },
      { href: "/hrd/rewards/bonuses", label: "Bonus" },
      { href: "/hrd/rewards/incentives", label: "Insentif" },
      { href: "/hrd/rewards/awards", label: "Penghargaan" },
      { href: "/hrd/rewards/salary-review", label: "Salary Review" },
      { href: "/hrd/rewards/statement", label: "Total Rewards Statement" },
      { href: "/hrd/rewards/tax", label: "Konfigurasi PPh 21" },
    ],
  },
  {
    label: "Pengembangan Karir",
    icon: TrendingUp,
    color: "fuchsia",
    hubHref: "/hrd/career",
    items: [
      { href: "/hrd/career/path", label: "Jalur Karir" },
      { href: "/hrd/career/promotions", label: "Promosi" },
      { href: "/hrd/career/mutations", label: "Mutasi" },
      { href: "/hrd/career/plans", label: "Rencana Pengembangan" },
      { href: "/hrd/career/requests", label: "Permintaan Karir" },
    ],
  },
  {
    label: "Suksesi",
    icon: GitBranch,
    color: "rose",
    hubHref: "/hrd/succession",
    items: [
      { href: "/hrd/succession/positions", label: "Posisi Kritis" },
      { href: "/hrd/succession/candidates", label: "Kandidat Suksesor" },
      { href: "/hrd/succession/talentpool", label: "Pool Suksesi" },
      { href: "/hrd/succession/readiness", label: "Penilaian Kesiapan" },
    ],
  },
  {
    label: "Hubungan Karyawan",
    icon: Heart,
    color: "pink",
    hubHref: "/hrd/relations",
    items: [
      { href: "/hrd/relations/complaints", label: "Keluhan" },
      { href: "/hrd/relations/warnings", label: "Surat Peringatan" },
      { href: "/hrd/relations/resignations", label: "Pengunduran Diri" },
      { href: "/hrd/relations/surveys", label: "Survei Karyawan" },
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
