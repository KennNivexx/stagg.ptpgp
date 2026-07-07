"use client";

import { ReactNode, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, BarChart3, Building2, Server,
  Briefcase, Award, GraduationCap, BookOpen, TrendingUp,
  Gift, GitBranch, Heart, FileText,
  LogOut, Search, Menu, X, ChevronRight, ChevronDown, Clock,
  Users, LayoutGrid, Settings, Bell, ShieldCheck, KeyRound, ClipboardList,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBell from "@/components/NotificationBell";

const MENU_GROUPS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
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
    items: [
      { href: "/hrd/workforce/requests", label: "Permintaan SDM" },
    ],
  },
  {
    label: "Rekrutmen",
    icon: Briefcase,
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
    items: [
      { href: "/hrd/workplace/structure", label: "Struktur Organisasi" },
      { href: "/hrd/workplace/departments", label: "Departemen" },
      { href: "/hrd/workplace/positions", label: "Jabatan" },
      { href: "/hrd/workplace/jobdesc", label: "Deskripsi Kerja" },
      { href: "/hrd/workplace/jobspec", label: "Spesifikasi Kerja" },
    ],
  },
  {
    label: "Infrastruktur SDM",
    icon: Server,
    items: [
      { href: "/hrd/infrastructure/employees", label: "Data Induk Karyawan" },
      { href: "/hrd/infrastructure/contracts", label: "Kontrak Kerja" },
      { href: "/hrd/infrastructure/shifts", label: "Shift Kerja" },
      { href: "/hrd/infrastructure/locations", label: "Lokasi Kerja" },
      { href: "/hrd/infrastructure/documents", label: "Dokumen Perusahaan" },
    ],
  },
  {
    label: "Kehadiran & Cuti",
    icon: Clock,
    items: [
      { href: "/hrd/attendance", label: "Absensi" },
      { href: "/hrd/leaves", label: "Cuti & Izin" },
    ],
  },
  {
    label: "Kompetensi",
    icon: Award,
    items: [
      { href: "/hrd/competency/library", label: "Pustaka Kompetensi" },
      { href: "/hrd/competency/skillmatrix", label: "Matriks Keahlian" },
      { href: "/hrd/competency/assessment", label: "Asesmen Kompetensi" },
      { href: "/hrd/competency/gap", label: "Analisis Kesenjangan" },
    ],
  },
  {
    label: "Pelatihan",
    icon: GraduationCap,
    items: [
      { href: "/hrd/learning/trainings", label: "Training" },
      { href: "/hrd/learning/materials", label: "Materi Kursus" },
      { href: "/hrd/learning/quizzes", label: "Kuis & Ujian" },
      { href: "/hrd/learning/certificates", label: "Sertifikat" },
      { href: "/hrd/learning/roi", label: "Analisa Dampak ROTI" },
    ],
  },
  {
    label: "Manajemen Pengetahuan",
    icon: BookOpen,
    items: [
      { href: "/hrd/knowledge/sop", label: "SOP dan Instruksi Kerja" },
      { href: "/hrd/knowledge/policies", label: "Kebijakan Perusahaan" },
      { href: "/hrd/knowledge/base", label: "Basis Pengetahuan" },
      { href: "/hrd/knowledge/videos", label: "Video Tutorial" },
    ],
  },
  {
    label: "Penilaian Kinerja",
    icon: TrendingUp,
    items: [
      { href: "/hrd/performance/kpi", label: "Manajemen KPI" },
      { href: "/hrd/performance/okr", label: "Manajemen OKR" },
      { href: "/hrd/performance/reviews", label: "Review Kinerja" },
      { href: "/hrd/performance/feedback", label: "Umpan Balik" },
      { href: "/hrd/performance/reports", label: "Laporan Kinerja" },
    ],
  },
  {
    label: "Reward & Penggajian",
    icon: Gift,
    items: [
      { href: "/hrd/rewards/payroll", label: "Payroll" },
      { href: "/hrd/rewards/salary", label: "Komponen Gaji" },
      { href: "/hrd/rewards/bonuses", label: "Bonus" },
      { href: "/hrd/rewards/incentives", label: "Insentif" },
      { href: "/hrd/rewards/awards", label: "Penghargaan" },
      { href: "/hrd/rewards/tax", label: "Konfigurasi PPh 21" },
    ],
  },
  {
    label: "Pengembangan Karir",
    icon: TrendingUp,
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
    items: [
      { href: "/hrd/admin/settings", label: "Pengaturan Perusahaan" },
      { href: "/hrd/admin/audit", label: "Audit Log" },
    ],
  },
];

const GROUP_TOOLTIPS: Record<string, string> = {
  "Dashboard": "Ringkasan performa HR dalam satu tampilan",
  "Perencanaan Tenaga Kerja": "Hitung dan proyeksikan kebutuhan karyawan",
  "Desain Organisasi": "Atur struktur, departemen, dan jabatan perusahaan",
  "Infrastruktur SDM": "Kelola data induk, kontrak, shift, dan lokasi kerja",
  "Rekrutmen": "Cari, seleksi, dan terima karyawan baru",
  "Kompetensi": "Kelola standar keahlian dan asesmen karyawan",
  "Pelatihan": "Program training, materi, dan sertifikasi",
  "Manajemen Pengetahuan": "SOP & instruksi kerja, kebijakan, basis pengetahuan, dan video panduan",
  "Penilaian Kinerja": "Evaluasi KPI, OKR, review, dan umpan balik",
  "Reward & Penggajian": "Kelola gaji, bonus, pajak karyawan",
  "Pengembangan Karir": "Jalur karir, promosi, mutasi, dan rencana pengembangan",
  "Suksesi": "Siapkan kandidat pengganti posisi penting",
  "Hubungan Karyawan": "Cuti, absensi, keluhan, dan surat peringatan",
  "Laporan & Analitik": "Laporan rekrutmen, karyawan, payroll, dan lainnya",
  "Admin & Pengaturan": "Konfigurasi sistem, email, WA bot, user management",
};

const ITEM_TOOLTIPS: Record<string, string> = {
  "/hrd": "Ringkasan singkat seluruh data HR",
  "/hrd/dashboard-kpi": "Pantau pencapaian KPI perusahaan",
  "/hrd/dashboard-okr": "Pantau Objectives & Key Results perusahaan",
  "/hrd/dashboard-analytics": "Analisis data HR secara mendalam",
  "/hrd/strategy/planning": "Rencana strategis jangka panjang SDM",
  "/hrd/strategy/objectives": "Tujuan dan sasaran departemen HR",
  "/hrd/strategy/budget": "Anggaran dan alokasi biaya HR",
  "/hrd/strategy/kpi": "Indikator kinerja utama strategi SDM",
  "/hrd/workforce/requests": "Permintaan penambahan karyawan baru",
  "/hrd/workplace/structure": "Bagan struktur organisasi perusahaan",
  "/hrd/workplace/departments": "Daftar dan kelola departemen",
  "/hrd/workplace/positions": "Daftar jabatan dan posisi",
  "/hrd/workplace/jobdesc": "Deskripsi tugas setiap jabatan",
  "/hrd/workplace/jobspec": "Spesifikasi dan kualifikasi jabatan",
  "/hrd/infrastructure/employees": "Database lengkap seluruh karyawan",
  "/hrd/infrastructure/contracts": "Kelola kontrak dan perjanjian kerja",
  "/hrd/infrastructure/shifts": "Atur jadwal shift karyawan",
  "/hrd/infrastructure/locations": "Daftar lokasi dan cabang kerja",
  "/hrd/infrastructure/documents": "Dokumen penting perusahaan",
  "/hrd/recruitment": "Daftar lowongan yang sedang dibuka",
  "/hrd/recruitment/tests": "Buat dan kelola soal tes rekrutmen online",
  "/hrd/recruitment/negotiations": "Kelola proses negosiasi gaji kandidat",
  "/hrd/recruitment/pipeline": "Data pelamar dan alur proses seleksi kandidat",
  "/hrd/recruitment/interviews": "Jadwal dan hasil interview",
  "/hrd/recruitment/decisions": "Keputusan akhir penerimaan karyawan",
  "/hrd/recruitment/talentpool": "Kumpulan kandidat potensial",
  "/hrd/competency/library": "Daftar standar kompetensi jabatan",
  "/hrd/competency/skillmatrix": "Pemetaan keahlian seluruh karyawan",
  "/hrd/competency/assessment": "Penilaian kompetensi karyawan",
  "/hrd/competency/gap": "Analisis kesenjangan kompetensi vs standar",
  "/hrd/learning/trainings": "Kelola program training, peserta, dan enrollment",
  "/hrd/learning/materials": "Materi dan modul pelatihan",
  "/hrd/learning/quizzes": "Soal ujian dan kuis pelatihan",
  "/hrd/learning/certificates": "Sertifikat kelulusan training",
  "/hrd/learning/roi": "Return on Training Investment — dampak & nilai balik pelatihan",
  "/hrd/knowledge/sop": "Standar Operasional Prosedur & panduan langkah kerja detail",
  "/hrd/knowledge/policies": "Dokumen kebijakan dan aturan",
  "/hrd/knowledge/base": "Kumpulan pengetahuan perusahaan",
  "/hrd/knowledge/videos": "Video panduan dan tutorial",
  "/hrd/performance/kpi": "Atur dan pantau KPI karyawan",
  "/hrd/performance/okr": "Atur Objectives & Key Results",
  "/hrd/performance/reviews": "Hasil review kinerja periodik",
  "/hrd/performance/feedback": "Feedback dan masukan kinerja",
  "/hrd/performance/reports": "Rekap dan laporan performa",
  "/hrd/rewards/payroll": "Proses penggajian bulanan",
  "/hrd/rewards/salary": "Atur komponen gaji pokok dan tunjangan",
  "/hrd/rewards/bonuses": "Kelola bonus karyawan",
  "/hrd/rewards/incentives": "Kelola insentif dan komisi",
  "/hrd/rewards/awards": "Penghargaan dan apresiasi karyawan",
  "/hrd/rewards/tax": "Konfigurasi PTKP dan tarif PPh 21",
  "/hrd/career/path": "Peta jalur karir setiap posisi",
  "/hrd/career/promotions": "Riwayat dan pengajuan promosi",
  "/hrd/career/mutations": "Riwayat dan pengajuan mutasi",
  "/hrd/career/requests": "Lamaran posisi internal & konsultasi karir dari karyawan",
  "/hrd/career/plans": "Rencana pengembangan individu",
  "/hrd/succession/positions": "Daftar posisi yang perlu suksesor",
  "/hrd/succession/candidates": "Kandidat pengganti posisi kritis",
  "/hrd/succession/talentpool": "Kumpulan talenta potensial",
  "/hrd/succession/readiness": "Tingkat kesiapan kandidat suksesor",
  "/hrd/relations/complaints": "Keluhan dan pengaduan karyawan",
  "/hrd/relations/warnings": "Surat peringatan dan sanksi",
  "/hrd/relations/resignations": "Proses resign karyawan",
  "/hrd/relations/surveys": "Survei kepuasan dan engagement",
  "/hrd/change/initiatives": "Daftar inisiatif perubahan organisasi",
  "/hrd/change/policies": "Riwayat perubahan kebijakan",
  "/hrd/change/communications": "Rencana komunikasi perubahan",
  "/hrd/change/monitoring": "Pantau progres perubahan",
  "/hrd/reports/recruitment": "Statistik dan laporan rekrutmen",
  "/hrd/reports/employees": "Data dan statistik karyawan",
  "/hrd/reports/payroll": "Ringkasan dan laporan gaji",
  "/hrd/reports/training": "Statistik pelatihan karyawan",
  "/hrd/reports/performance": "Rekap performa karyawan",
  "/hrd/reports/turnover": "Analisis keluar-masuk karyawan",
  "/hrd/guides/hrd": "Panduan penggunaan sistem untuk tim HRD",
  "/hrd/guides/employee": "Panduan penggunaan sistem untuk karyawan",
  "/hrd/guides/applicant": "Panduan penggunaan sistem untuk pelamar",
  "/hrd/guides/department_manager": "Panduan penggunaan sistem untuk manajer departemen",
  "/hrd/guides/director": "Panduan penggunaan sistem untuk direktur",
  "/hrd/admin": "Dashboard admin & status sistem",
  "/hrd/admin/settings": "Pengaturan perusahaan, email, WA bot",
  "/hrd/admin/notifications": "Template dan pengaturan notifikasi",
  "/hrd/admin/audit": "Log aktivitas dan perubahan sistem",
};

// "/hrd" is the root — every HRD route starts with "/hrd/", so a plain prefix
// match would make the Dashboard group/link look active on every single page.
function isItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/hrd" && pathname.startsWith(href));
}

const BOTTOM_NAV = [
  { href: "/hrd", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hrd/infrastructure/employees", label: "Karyawan", icon: Users },
  { href: "/hrd/attendance", label: "Absensi", icon: Clock },
  { href: "/hrd/recruitment", label: "Rekrutmen", icon: Briefcase },
];

export default function HRDLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Dashboard"]));
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useSession();
  const clientUserName = user?.name || "HRD";
  const clientUserEmail = user?.email || "hrd@ptpgp.co.id";
  const { hasUnreadForHref } = useNotifications("hrd");

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // Auto-expand the group containing the current page when navigating — but only
  // as a one-time nudge, so a manual collapse afterward (e.g. on the Dashboard
  // group, which is otherwise always "active") actually sticks.
  useEffect(() => {
    const activeGroup = MENU_GROUPS.find((group) =>
      group.items.some((item) => isItemActive(pathname, item.href))
    );
    if (activeGroup) {
      setExpandedGroups((prev) => (prev.has(activeGroup.label) ? prev : new Set(prev).add(activeGroup.label)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const filteredGroups = useMemo(() => {
    if (!isSearching) return MENU_GROUPS;
    return MENU_GROUPS
      .map((group) => {
        const groupMatches = group.label.toLowerCase().includes(query);
        const matchingItems = groupMatches ? group.items : group.items.filter((i) => i.label.toLowerCase().includes(query));
        if (matchingItems.length === 0) return null;
        return { ...group, items: matchingItems };
      })
      .filter((g): g is typeof MENU_GROUPS[number] => g !== null);
  }, [query, isSearching]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const firstItem = filteredGroups[0]?.items[0];
    if (firstItem) {
      router.push(firstItem.href);
      setSearchQuery("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold">
        Lewati ke konten utama
      </a>
      <div className="lg:hidden fixed top-4 left-4 z-[51]">
        <button
          aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-[#1E293B] text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40"
        />
      )}

      <aside className={`w-72 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 border-r border-slate-800 lg:translate-x-0 lg:static lg:h-screen lg:pointer-events-auto ${isSidebarOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"}`}>
        <div className="p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
            <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">PTPGP HRIS</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Portal Manajemen</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {filteredGroups.length === 0 && (
            <p className="px-5 py-4 text-xs text-slate-500">Tidak ada menu yang cocok.</p>
          )}
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const hasActive = group.items.some(item => isItemActive(pathname, item.href));
            const hasGroupUnread = group.items.some(item => hasUnreadForHref(item.href, "/hrd"));
            const isExpanded = isSearching || expandedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  title={GROUP_TOOLTIPS[group.label]}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center gap-2 px-5 py-2.5 text-left ${hasActive ? "text-red-400" : "text-slate-500 hover:text-slate-300"} transition-colors`}
                >
                  <GroupIcon size={13} className="shrink-0" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">{group.label}</span>
                  {hasGroupUnread && (
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" aria-hidden="true" />
                  )}
                  <ChevronDown
                    size={11}
                    className={`ml-auto shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
                  style={{ maxHeight: isExpanded ? "600px" : "0px" }}
                >
                  {group.items.map((item) => {
                    const isActive = isItemActive(pathname, item.href);
                    const hasUnread = hasUnreadForHref(item.href, "/hrd");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        title={ITEM_TOOLTIPS[item.href] || item.label}
                        className={`flex items-center gap-2 pl-9 pr-4 py-3 text-[11px] font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-red-600/20 text-white border-l-2 border-red-500"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/40 border-l-2 border-transparent"
                        }`}
                      >
                        {isActive && <ChevronRight size={10} className="text-red-400 shrink-0" />}
                        <span className="truncate">{item.label}</span>
                        {hasUnread && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" aria-hidden="true" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#0B0F19] shrink-0">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-lg bg-slate-900/40">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              {clientUserName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{clientUserName}</p>
              <p className="text-[10px] text-slate-400 truncate">{clientUserEmail}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button title="Keluar dari Sistem" className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-600/10 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/20">
              <LogOut size={14} className="shrink-0" /> Keluar dari Sistem
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 w-64 lg:w-80">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari menu..."
                className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-600"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} aria-label="Hapus pencarian" className="text-slate-400 hover:text-slate-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <NotificationBell role="hrd" />
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800">PT PGP Utama</p>
                <p className="text-[10px] text-emerald-600 font-medium">Online</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-auto bg-[#F8FAFC] pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-[#0F172A] border-t border-slate-800 z-30 flex items-stretch">
        {BOTTOM_NAV.map((item) => {
          const isActive = isItemActive(pathname, item.href);
          const hasUnread = hasUnreadForHref(item.href, "/hrd");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
                isActive ? "text-red-500" : "text-slate-400"
              }`}
            >
              <Icon size={17} />
              {item.label}
              {hasUnread && (
                <span className="absolute top-1 right-[calc(50%-14px)] h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
              )}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Menu lengkap (buka sidebar)"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-slate-400 active:text-slate-300"
        >
          <LayoutGrid size={17} />
          Lainnya
        </button>
      </nav>
    </div>
  );
}
