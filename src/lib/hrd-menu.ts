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
      { href: "/hrd/rewards/komponen-gaji", label: "Jenis Tunjangan & Potongan" },
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
    label: "Career Development",
    icon: TrendingUp,
    color: "fuchsia",
    hubHref: "/hrd/career",
    items: [
      // MASTER
      { href: "/hrd/career/master/framework", label: "Career Framework" },
      { href: "/hrd/career/master/stream", label: "Career Stream" },
      { href: "/hrd/career/master/level", label: "Career Level" },
      { href: "/hrd/career/path", label: "Career Path" },
      { href: "/hrd/career/master/promotion-policy", label: "Promotion Policy" },
      { href: "/hrd/career/master/mutation-policy", label: "Mutation Policy" },
      { href: "/hrd/career/master/rotation-policy", label: "Rotation Policy" },
      { href: "/hrd/career/master/succession-policy", label: "Succession Policy" },
      { href: "/hrd/career/master/leadership-framework", label: "Leadership Framework" },
      { href: "/hrd/career/master/talent-classification", label: "Talent Classification" },
      { href: "/hrd/career/master/score-formula", label: "Career Score Formula" },
      { href: "/hrd/career/master/readiness-rules", label: "Career Readiness Rules" },
      // TALENT MANAGEMENT
      { href: "/hrd/career/talent/pool", label: "Talent Pool" },
      { href: "/hrd/career/talent/review", label: "Talent Review" },
      { href: "/hrd/career/9-box", label: "9-Box Matrix" },
      { href: "/hrd/succession/positions", label: "Critical Position" },
      { href: "/hrd/succession/candidates", label: "Successor Planning" },
      { href: "/hrd/career/talent/leadership-pipeline", label: "Leadership Pipeline" },
      // CAREER DEVELOPMENT
      { href: "/hrd/career/profile", label: "Career Profile" },
      { href: "/hrd/career/assessment", label: "Career Assessment" },
      { href: "/hrd/career/readiness", label: "Career Readiness" },
      { href: "/hrd/career/recommendation", label: "Career Recommendation" },
      { href: "/hrd/career/plans", label: "Individual Development Plan (IDP)" },
      { href: "/hrd/career/simulation", label: "Career Simulation" },
      { href: "/hrd/career/history", label: "Career History" },
      { href: "/hrd/career/analytics", label: "Career Analytics" },
      // TRANSACTION
      { href: "/hrd/career/transactions/promotion", label: "Promosi" },
      { href: "/hrd/career/mutations", label: "Mutasi" },
      { href: "/hrd/career/transactions/rotation", label: "Rotasi" },
      { href: "/hrd/career/transactions/demotion", label: "Demosi" },
      { href: "/hrd/career/transactions/acting", label: "Acting Assignment" },
      { href: "/hrd/career/transactions/temporary", label: "Temporary Assignment" },
      { href: "/hrd/career/transactions/succession", label: "Succession Assignment" },
      // APPROVAL
      { href: "/hrd/career/approval/promotion", label: "Promotion Approval" },
      { href: "/hrd/career/approval/mutation", label: "Mutation Approval" },
      { href: "/hrd/career/approval/salary", label: "Salary Approval" },
      { href: "/hrd/career/approval/succession", label: "Succession Approval" },
      { href: "/hrd/career/approval/committee", label: "Career Committee" },
    ],
  },
  {
    label: "Succession & Talent",
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
    label: "Employee Relations",
    icon: Heart,
    color: "pink",
    hubHref: "/hrd/relations",
    items: [
      // ── MASTER DATA ──────────────────────────────────────────
      { href: "/hrd/relations/master/policy",                label: "Employee Relation Policy" },
      { href: "/hrd/relations/master/company-regulation",    label: "Company Regulation (PP)" },
      { href: "/hrd/relations/master/pkb",                   label: "Perjanjian Kerja Bersama (PKB)" },
      { href: "/hrd/relations/master/code-of-conduct",       label: "Code of Conduct" },
      { href: "/hrd/relations/master/comm-category",         label: "Communication Category" },
      { href: "/hrd/relations/master/case-category",         label: "Complaint & Case Category" },
      { href: "/hrd/relations/master/investigation-type",    label: "Investigation Type" },
      { href: "/hrd/relations/master/disciplinary-category", label: "Disciplinary Category" },
      { href: "/hrd/relations/master/engagement-program",    label: "Engagement Program" },
      { href: "/hrd/relations/master/survey-template",       label: "Survey Template" },
      { href: "/hrd/relations/master/exit-reason",           label: "Exit Reason" },
      { href: "/hrd/relations/master/ai-rule",               label: "AI Recommendation Rule" },
      // ── EMPLOYEE COMMUNICATION ───────────────────────────────
      { href: "/hrd/relations/communication/announcements",  label: "Company Announcement" },
      { href: "/hrd/relations/communication/memos",          label: "Internal Memo" },
      { href: "/hrd/relations/communication/news",           label: "Company News" },
      { href: "/hrd/relations/communication/policy-dist",    label: "Policy Distribution" },
      { href: "/hrd/relations/communication/circulars",      label: "Circular Letter" },
      { href: "/hrd/relations/communication/emergency",      label: "Emergency Notification" },
      { href: "/hrd/relations/communication/analytics",      label: "Communication Analytics" },
      // ── EMPLOYEE PARTICIPATION ───────────────────────────────
      { href: "/hrd/relations/participation/suggestions",    label: "Suggestion System" },
      { href: "/hrd/relations/participation/innovations",    label: "Innovation Proposal" },
      { href: "/hrd/relations/participation/voice",          label: "Voice of Employee" },
      { href: "/hrd/relations/surveys",                      label: "Employee Survey" },
      { href: "/hrd/relations/participation/polling",        label: "Polling" },
      { href: "/hrd/relations/participation/feedback",       label: "Employee Feedback" },
      { href: "/hrd/relations/participation/satisfaction",   label: "Employee Satisfaction Survey" },
      // ── EMPLOYEE CASE MANAGEMENT ─────────────────────────────
      { href: "/hrd/relations/cases",                        label: "Semua Kasus" },
      { href: "/hrd/relations/complaints",                   label: "Complaint" },
      { href: "/hrd/relations/cases/grievance",              label: "Grievance" },
      { href: "/hrd/relations/cases/ethics",                 label: "Ethics Violation" },
      { href: "/hrd/relations/cases/fraud",                  label: "Fraud" },
      { href: "/hrd/relations/cases/harassment",             label: "Harassment & Bullying" },
      { href: "/hrd/relations/cases/whistleblowing",         label: "Whistleblowing" },
      { href: "/hrd/relations/cases/investigation",          label: "Investigation" },
      { href: "/hrd/relations/cases/corrective-action",      label: "Corrective Action" },
      // ── INDUSTRIAL RELATIONS ─────────────────────────────────
      { href: "/hrd/relations/industrial/union",             label: "Labour Union" },
      { href: "/hrd/relations/industrial/bipartite",         label: "Bipartite Meeting" },
      { href: "/hrd/relations/industrial/tripartite",        label: "Tripartite Meeting" },
      { href: "/hrd/relations/industrial/mediation",         label: "Negotiation & Mediation" },
      { href: "/hrd/relations/industrial/dispute",           label: "Industrial Dispute" },
      { href: "/hrd/relations/industrial/phi",               label: "PHI Documentation" },
      { href: "/hrd/relations/industrial/compliance",        label: "Industrial Compliance" },
      // ── EMPLOYEE SEPARATION ──────────────────────────────────
      { href: "/hrd/relations/resignations",                 label: "Resignation" },
      { href: "/hrd/relations/separation/retirement",        label: "Retirement" },
      { href: "/hrd/relations/separation/end-of-contract",   label: "End of Contract" },
      { href: "/hrd/relations/separation/termination",       label: "Termination (PHK)" },
      { href: "/hrd/relations/separation/exit-interview",    label: "Exit Interview" },
      { href: "/hrd/relations/separation/analytics",         label: "Separation Analytics" },
      // ── SURAT PERINGATAN (existing) ──────────────────────────
      { href: "/hrd/relations/warnings",                     label: "Surat Peringatan" },
      // ── APPROVAL ─────────────────────────────────────────────
      { href: "/hrd/relations/approval/complaint",           label: "Complaint Approval" },
      { href: "/hrd/relations/approval/investigation",       label: "Investigation Approval" },
      { href: "/hrd/relations/approval/corrective-action",   label: "Corrective Action Approval" },
      { href: "/hrd/relations/approval/industrial",          label: "Industrial Relations Approval" },
      { href: "/hrd/relations/approval/separation",          label: "Separation Approval" },
      { href: "/hrd/relations/approval/case-closure",        label: "Case Closure Approval" },
      // ── ANALYTICS & REPORTS ──────────────────────────────────
      { href: "/hrd/relations/analytics/executive",          label: "Executive Dashboard" },
      { href: "/hrd/relations/analytics/engagement",         label: "Employee Engagement Dashboard" },
      { href: "/hrd/relations/analytics/satisfaction",       label: "Employee Satisfaction Dashboard" },
      { href: "/hrd/relations/analytics/complaints",         label: "Complaint Analytics" },
      { href: "/hrd/relations/analytics/industrial",         label: "Industrial Relations Report" },
      { href: "/hrd/relations/analytics/retention",          label: "Retention & Turnover Analysis" },
      { href: "/hrd/relations/analytics/risk",               label: "Employee Risk Dashboard" },
      // ── AI ENGINE ────────────────────────────────────────────
      { href: "/hrd/relations/ai",                           label: "AI ER Engine" },
      { href: "/hrd/relations/ai/risk-score",                label: "Employee Risk Score" },
      { href: "/hrd/relations/ai/sentiment",                 label: "Sentiment Analysis" },
      { href: "/hrd/relations/ai/engagement-trend",          label: "Engagement Trend" },
      { href: "/hrd/relations/ai/conflict",                  label: "Conflict Prediction" },
      { href: "/hrd/relations/ai/recommendations",           label: "AI Recommendations" },
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
