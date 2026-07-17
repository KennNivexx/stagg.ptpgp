"use client";

import { ReactNode, useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Briefcase,
  LogOut, Search, Menu, X, ChevronRight, ChevronDown, Clock,
  Users, LayoutGrid,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBell from "@/components/NotificationBell";
import { MENU_GROUPS, isHrdItemActive } from "@/lib/hrd-menu";
import { GROUP_COLOR_CLASSES, GROUP_COLOR_CLASSES_LIGHT } from "@/lib/menu-colors";

const GROUP_TOOLTIPS: Record<string, string> = {
  "Dashboard": "Ringkasan performa HR dalam satu tampilan",
  "Perencanaan Tenaga Kerja": "Hitung dan proyeksikan kebutuhan karyawan",
  "Desain Organisasi": "Atur struktur, departemen, dan jabatan perusahaan",
  "Employee 360°": "Profil terpadu karyawan — data personal hingga kepegawaian",
  "Aset & Fasilitas": "Kendaraan, trip, pengadaan, dan dokumen perusahaan",
  "Workforce Time Management": "Jadwal kerja, absensi, lembur, cuti, timesheet, dan penugasan project/site",
  "Rekrutmen": "Cari, seleksi, dan terima karyawan baru",
  "Competency Management": "Kelola standar keahlian dan asesmen karyawan",
  "Learning & Training Management": "TNA otomatis dari gap kompetensi, training, materi, evaluasi, dan sertifikasi",
  "Knowledge Management": "SOP & instruksi kerja, kebijakan, basis pengetahuan, video panduan, dan mapping ke kompetensi",
  "Performance Management": "Framework, KPI, culture, dan skor performa akhir",
  "Reward & Recognition": "Formula reward, salary review, bonus, insentif, penghargaan, dan payroll",
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
  "/hrd/infrastructure/licenses": "Pantau masa berlaku SIM dan sertifikasi karyawan",
  "/hrd/infrastructure/vehicles": "Kelola armada kendaraan dan penugasan supir",
  "/hrd/trips": "Data trip, rekap jam mengemudi, dan insentif trip-based",
  "/hrd/vehicle-requests": "Ajukan pengadaan kendaraan baru untuk persetujuan Direktur",
  "/hrd/business-trips": "Laporan pengajuan perjalanan dinas karyawan",
  "/hrd/incidents": "Laporan insiden dan kerusakan seluruh departemen",
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
  const [openTopGroup, setOpenTopGroup] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useSession();
  const clientUserName = user?.name || "HRD";
  const clientUserEmail = user?.email || "hrd@ptpgp.co.id";
  const { hasUnreadForHref } = useNotifications("hrd");
  const topNavRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
      group.items.some((item) => isHrdItemActive(pathname, item.href))
    );
    if (activeGroup) {
      setExpandedGroups((prev) => (prev.has(activeGroup.label) ? prev : new Set(prev).add(activeGroup.label)));
    }
    setOpenTopGroup(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close the desktop dropdown / profile menu when clicking anywhere outside
  // their respective containers. The dropdown panel itself is rendered as a
  // position:fixed sibling of topNavRef (it has to escape the pills row's
  // overflow-x-auto, which otherwise clips it — see the render below), so a
  // click inside the dropdown must also be excluded here or it'd be treated
  // as "outside" and close before the Link's own onClick ever fires.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideTopNav = topNavRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTopNav && !insideDropdown) {
        setOpenTopGroup(null);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold">
        Lewati ke konten utama
      </a>

      {/* Mobile drawer overlay + panel — desktop uses the top nav below instead */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      <aside className={`lg:hidden w-72 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 border-r border-slate-800 ${isSidebarOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"}`}>
        <div className="p-5 border-b border-slate-800 shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
              <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">PTPGP HRIS</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Portal Manajemen</p>
          </div>
          <button
            aria-label="Tutup menu"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-800">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari menu..."
              className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-200 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} aria-label="Hapus pencarian" className="text-slate-400 hover:text-slate-200 shrink-0">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {filteredGroups.length === 0 && (
            <p className="px-5 py-4 text-xs text-slate-500">Tidak ada menu yang cocok.</p>
          )}
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const hasActive = group.items.some(item => isHrdItemActive(pathname, item.href));
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
                  <GroupIcon size={13} className={`shrink-0 ${hasActive ? "" : GROUP_COLOR_CLASSES[group.color] || ""}`} />
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
                    const isActive = isHrdItemActive(pathname, item.href);
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

      {/* Top bar — row 1: brand, search, notifications, profile */}
      <header className="bg-white border-b border-slate-200 z-30 shrink-0 sticky top-0">
        <div className="h-16 flex items-center gap-4 px-4 lg:px-6">
          <button
            aria-label={isSidebarOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
            <span className="font-extrabold text-sm tracking-wider text-slate-800 hidden sm:inline">PTPGP HRIS</span>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 w-64 lg:w-80 ml-2">
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

          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell role="hrd" />
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                aria-expanded={isProfileOpen}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-inner shrink-0">
                  {clientUserName.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{clientUserName}</p>
                  <p className="text-[10px] text-emerald-600 font-medium leading-tight">Online</p>
                </div>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">{clientUserName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{clientUserEmail}</p>
                  </div>
                  <form action={logoutAction} className="px-2 pt-2">
                    <button title="Keluar dari Sistem" className="flex items-center gap-2 px-2.5 py-2 w-full rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-all text-xs font-semibold">
                      <LogOut size={14} className="shrink-0" /> Keluar dari Sistem
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top bar — row 2: horizontally scrollable group nav with dropdowns (desktop only) */}
        <div className="hidden lg:block border-t border-slate-100 bg-slate-50/60">
          <div
            ref={topNavRef}
            className="flex flex-wrap items-center justify-center gap-1 px-4 py-1"
          >
            {MENU_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              const hasActive = group.items.some((item) => isHrdItemActive(pathname, item.href));
              const hasGroupUnread = group.items.some((item) => hasUnreadForHref(item.href, "/hrd"));
              const isOpen = openTopGroup === group.label;
              return (
                <div key={group.label} className="shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      if (openTopGroup === group.label) {
                        setOpenTopGroup(null);
                        return;
                      }
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDropdownPos({ top: rect.bottom, left: rect.left });
                      setOpenTopGroup(group.label);
                    }}
                    title={GROUP_TOOLTIPS[group.label]}
                    aria-expanded={isOpen}
                    className={`relative flex items-center gap-1.5 px-3 py-2.5 my-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      hasActive
                        ? "bg-red-600 text-white shadow-sm"
                        : isOpen
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-slate-800"
                    }`}
                  >
                    <GroupIcon size={14} className={`shrink-0 ${hasActive ? "text-white" : GROUP_COLOR_CLASSES_LIGHT[group.color] || ""}`} />
                    {group.label}
                    {hasGroupUnread && (
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Dropdown panel for the open top-nav group — rendered as position:fixed
          and OUTSIDE the pills row above, so it isn't clipped by any ancestor
          with non-visible overflow (the pills row used to have overflow-x-auto
          for horizontal scrolling, which forced this; it now wraps instead,
          but position:fixed here remains the simplest way to render above
          everything without being clipped by later layout changes). */}
      {openTopGroup && dropdownPos && (() => {
        const group = MENU_GROUPS.find((g) => g.label === openTopGroup);
        if (!group) return null;
        return (
          <div
            ref={dropdownRef}
            style={{ top: dropdownPos.top + 4, left: dropdownPos.left }}
            className="hidden lg:block fixed w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50"
          >
            {group.items.map((item) => {
              const isActive = isHrdItemActive(pathname, item.href);
              const hasUnread = hasUnreadForHref(item.href, "/hrd");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpenTopGroup(null)}
                  title={ITEM_TOOLTIPS[item.href] || item.label}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-colors ${
                    isActive ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {hasUnread && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0" aria-hidden="true" />
                  )}
                </Link>
              );
            })}
          </div>
        );
      })()}

      <main id="main-content" className="flex-1 overflow-y-auto overflow-x-auto bg-[#F8FAFC] pb-16 lg:pb-0">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-16 bg-[#0F172A] border-t border-slate-800 z-30 flex items-stretch">
        {BOTTOM_NAV.map((item) => {
          const isActive = isHrdItemActive(pathname, item.href);
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
