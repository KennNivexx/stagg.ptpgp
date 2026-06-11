"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Target, BarChart3, Building2, Server,
  Briefcase, Award, GraduationCap, BookOpen, TrendingUp,
  Gift, GitBranch, Heart, RefreshCw, FileText, Shield,
  LogOut, Bell, Search, Menu, X, ChevronRight,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { getCookie } from "@/lib/cookie-client";

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
    label: "Strategi SDM",
    icon: Target,
    items: [
      { href: "/hrd/strategy/planning", label: "Perencanaan Strategis" },
      { href: "/hrd/strategy/objectives", label: "Tujuan SDM" },
      { href: "/hrd/strategy/budget", label: "Anggaran SDM" },
      { href: "/hrd/strategy/kpi", label: "KPI Strategis" },
    ],
  },
  {
    label: "Perencanaan Tenaga Kerja",
    icon: BarChart3,
    items: [
      { href: "/hrd/workforce/headcount", label: "Headcount" },
      { href: "/hrd/workforce/requests", label: "Permintaan SDM" },
      { href: "/hrd/workforce/forecast", label: "Proyeksi" },
      { href: "/hrd/workforce/vacancy", label: "Lowongan" },
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
    label: "Rekrutmen",
    icon: Briefcase,
    items: [
      { href: "/hrd/recruitment", label: "Lowongan Kerja" },
      { href: "/hrd/recruitment/applicants", label: "Data Pelamar" },
      { href: "/hrd/recruitment/pipeline", label: "Pipeline Kandidat" },
      { href: "/hrd/recruitment/interviews", label: "Interview" },
      { href: "/hrd/recruitment/decisions", label: "Keputusan Hiring" },
      { href: "/hrd/recruitment/talentpool", label: "Talent Pool" },
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
      { href: "/hrd/learning/programs", label: "Program Training" },
      { href: "/hrd/learning/schedule", label: "Jadwal Training" },
      { href: "/hrd/learning/materials", label: "Materi Kursus" },
      { href: "/hrd/learning/quizzes", label: "Kuis & Ujian" },
      { href: "/hrd/learning/certificates", label: "Sertifikat" },
    ],
  },
  {
    label: "Manajemen Pengetahuan",
    icon: BookOpen,
    items: [
      { href: "/hrd/knowledge/sop", label: "SOP Center" },
      { href: "/hrd/knowledge/instructions", label: "Instruksi Kerja" },
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
      { href: "/hrd/rewards/payslips", label: "Slip Gaji" },
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
    ],
  },
  {
    label: "Suksesi",
    icon: GitBranch,
    items: [
      { href: "/hrd/succession/positions", label: "Posisi Kritis" },
      { href: "/hrd/succession/candidates", label: "Kandidat Suksesor" },
      { href: "/hrd/succession/talentpool", label: "Talent Pool" },
      { href: "/hrd/succession/readiness", label: "Penilaian Kesiapan" },
    ],
  },
  {
    label: "Hubungan Karyawan",
    icon: Heart,
    items: [
      { href: "/hrd/relations/leaves", label: "Cuti & Izin" },
      { href: "/hrd/relations/attendance", label: "Absensi" },
      { href: "/hrd/relations/complaints", label: "Keluhan" },
      { href: "/hrd/relations/warnings", label: "Surat Peringatan" },
      { href: "/hrd/relations/resignations", label: "Pengunduran Diri" },
      { href: "/hrd/relations/surveys", label: "Survei Karyawan" },
    ],
  },
  {
    label: "Manajemen Perubahan",
    icon: RefreshCw,
    items: [
      { href: "/hrd/change/initiatives", label: "Inisiatif Perubahan" },
      { href: "/hrd/change/policies", label: "Perubahan Kebijakan" },
      { href: "/hrd/change/communications", label: "Rencana Komunikasi" },
      { href: "/hrd/change/monitoring", label: "Monitoring" },
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
    label: "Administrasi Sistem",
    icon: Shield,
    items: [
      { href: "/hrd/admin/users", label: "Manajemen User" },
      { href: "/hrd/admin/roles", label: "Role & Permission" },
      { href: "/hrd/admin/approvals", label: "Alur Persetujuan" },
      { href: "/hrd/admin/audit", label: "Audit Log" },
      { href: "/hrd/admin/notifications", label: "Notifikasi" },
      { href: "/hrd/admin/settings", label: "Pengaturan Perusahaan" },
    ],
  },
];

const GROUP_TOOLTIPS: Record<string, string> = {
  "Dashboard": "Ringkasan performa HR dalam satu tampilan",
  "Strategi SDM": "Rencana jangka panjang & tujuan HR perusahaan",
  "Perencanaan Tenaga Kerja": "Hitung dan proyeksikan kebutuhan karyawan",
  "Desain Organisasi": "Atur struktur, departemen, dan jabatan perusahaan",
  "Infrastruktur SDM": "Kelola data induk, kontrak, shift, dan lokasi kerja",
  "Rekrutmen": "Cari, seleksi, dan terima karyawan baru",
  "Kompetensi": "Kelola standar keahlian dan asesmen karyawan",
  "Pelatihan": "Program training, materi, dan sertifikasi",
  "Manajemen Pengetahuan": "SOP, kebijakan, instruksi kerja, dan video panduan",
  "Penilaian Kinerja": "Evaluasi KPI, OKR, review, dan umpan balik",
  "Reward & Penggajian": "Kelola gaji, bonus, dan slip gaji karyawan",
  "Pengembangan Karir": "Jalur karir, promosi, mutasi, dan rencana pengembangan",
  "Suksesi": "Siapkan kandidat pengganti posisi penting",
  "Hubungan Karyawan": "Cuti, absensi, keluhan, dan surat peringatan",
  "Manajemen Perubahan": "Pantau inisiatif perubahan dan kebijakan baru",
  "Laporan & Analitik": "Laporan rekrutmen, karyawan, payroll, dan lainnya",
  "Administrasi Sistem": "Atur user, role, approval, dan pengaturan sistem",
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
  "/hrd/workforce/headcount": "Jumlah total karyawan per departemen",
  "/hrd/workforce/requests": "Permintaan penambahan karyawan baru",
  "/hrd/workforce/forecast": "Proyeksi kebutuhan tenaga kerja masa depan",
  "/hrd/workforce/vacancy": "Daftar posisi yang sedang dibuka",
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
  "/hrd/recruitment/applicants": "Data seluruh pelamar yang masuk",
  "/hrd/recruitment/pipeline": "Alur proses seleksi kandidat",
  "/hrd/recruitment/interviews": "Jadwal dan hasil interview",
  "/hrd/recruitment/decisions": "Keputusan akhir penerimaan karyawan",
  "/hrd/recruitment/talentpool": "Kumpulan kandidat potensial",
  "/hrd/competency/library": "Daftar standar kompetensi jabatan",
  "/hrd/competency/skillmatrix": "Pemetaan keahlian seluruh karyawan",
  "/hrd/competency/assessment": "Penilaian kompetensi karyawan",
  "/hrd/competency/gap": "Analisis kesenjangan kompetensi vs standar",
  "/hrd/learning/programs": "Daftar program pelatihan yang tersedia",
  "/hrd/learning/schedule": "Jadwal pelatihan mendatang",
  "/hrd/learning/materials": "Materi dan modul pelatihan",
  "/hrd/learning/quizzes": "Soal ujian dan kuis pelatihan",
  "/hrd/learning/certificates": "Sertifikat kelulusan training",
  "/hrd/knowledge/sop": "Standar Operasional Prosedur",
  "/hrd/knowledge/instructions": "Panduan langkah kerja detail",
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
  "/hrd/rewards/payslips": "Lihat dan download slip gaji",
  "/hrd/career/path": "Peta jalur karir setiap posisi",
  "/hrd/career/promotions": "Riwayat dan pengajuan promosi",
  "/hrd/career/mutations": "Riwayat dan pengajuan mutasi",
  "/hrd/career/plans": "Rencana pengembangan individu",
  "/hrd/succession/positions": "Daftar posisi yang perlu suksesor",
  "/hrd/succession/candidates": "Kandidat pengganti posisi kritis",
  "/hrd/succession/talentpool": "Kumpulan talenta potensial",
  "/hrd/succession/readiness": "Tingkat kesiapan kandidat suksesor",
  "/hrd/relations/leaves": "Pengajuan dan persetujuan cuti",
  "/hrd/relations/attendance": "Rekap kehadiran harian karyawan",
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
  "/hrd/admin/users": "Kelola akun pengguna sistem",
  "/hrd/admin/roles": "Atur hak akses pengguna",
  "/hrd/admin/approvals": "Konfigurasi alur approval",
  "/hrd/admin/audit": "Catatan aktivitas pengguna",
  "/hrd/admin/notifications": "Pengaturan notifikasi sistem",
  "/hrd/admin/settings": "Informasi dan konfigurasi perusahaan",
};

export default function HRDLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clientUserName, setClientUserName] = useState("Administrator HRD");
  const [clientUserEmail, setClientUserEmail] = useState("admin@pratamagaluh.co.id");

  useEffect(() => {
    const name = getCookie("user_name");
    const email = getCookie("user_email");
    if (name) setClientUserName(name);
    if (email) setClientUserEmail(email);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-[#1E293B] text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        />
      )}

      <aside className={`w-72 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-300 border-r border-slate-800 lg:translate-x-0 lg:static lg:h-screen ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">PTPGP HRIS</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Portal Manajemen</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {MENU_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const hasActive = group.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));
            return (
              <div key={group.label} className="mb-3">
                <div title={GROUP_TOOLTIPS[group.label]} className={`flex items-center gap-2 px-5 py-1.5 ${hasActive ? "text-red-400" : "text-slate-500"}`}>
                  <GroupIcon size={13} />
                  <span className="text-[10px] font-bold tracking-widest uppercase">{group.label}</span>
                </div>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/hrd" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      title={ITEM_TOOLTIPS[item.href]}
                      className={`flex items-center gap-2 pl-9 pr-4 py-2 text-[11px] font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-red-600/20 text-white border-l-2 border-red-500"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/40 border-l-2 border-transparent"
                      }`}
                    >
                      {isActive && <ChevronRight size={10} className="text-red-400 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#0B0F19] shrink-0">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-lg bg-slate-900/40">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {clientUserName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{clientUserName}</p>
              <p className="text-[10px] text-slate-400 truncate">{clientUserEmail}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-600/10 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/20">
              <LogOut size={14} /> Keluar dari Sistem
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 w-64 lg:w-80">
              <Search size={16} className="text-slate-400" />
              <input type="text" placeholder="Cari menu..." className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-600" />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <button className="p-2 hover:bg-slate-100 rounded-xl relative transition-colors text-slate-500">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white"></span>
            </button>
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

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">{children}</main>
      </div>
    </div>
  );
}
