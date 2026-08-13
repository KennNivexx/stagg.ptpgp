"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Calendar,
  FileText,
  LogOut,
  Search,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  DollarSign,
  Wallet,
  GraduationCap,
  BookOpen,
  TrendingUp,
  MessageCircle,
  HelpCircle,
  Briefcase,
  ClipboardList,
  Plane,
  AlertTriangle,
  Route,
  ChevronDown,
  Clock3,
  Wrench,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useSession } from "@/hooks/useSession";
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBell from "@/components/NotificationBell";
import SOSButton from "@/components/SOSButton";
import { GROUP_COLOR_CLASSES_LIGHT } from "@/lib/menu-colors";
import PageBackgroundDecor from "@/components/PageBackgroundDecor";

const MENU_GROUPS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "slate",
    items: [
      { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Profil & Karir",
    icon: User,
    color: "blue",
    items: [
      { href: "/employee/profile", label: "Profil Saya", icon: User },
      { href: "/employee/kpi", label: "KPI & Performa", icon: TrendingUp },
      { href: "/employee/career", label: "Pengembangan Karir", icon: TrendingUp },
      { href: "/employee/jobdesc", label: "Deskripsi Pekerjaan", icon: Briefcase },
    ],
  },
  {
    label: "Kehadiran & Perjalanan",
    icon: Calendar,
    color: "emerald",
    items: [
      { href: "/employee/attendance", label: "Absensi", icon: Calendar },
      { href: "/employee/leaves", label: "Cuti & Izin", icon: FileText },
      { href: "/employee/overtime", label: "Lembur", icon: Clock3 },
      { href: "/employee/corrections", label: "Koreksi Absensi", icon: Wrench },
      { href: "/employee/business-trip", label: "Perjalanan Dinas", icon: Plane },
      { href: "/employee/trips", label: "Trip & Insentif", icon: Route },
    ],
  },
  {
    label: "Kompensasi & Pengembangan",
    icon: DollarSign,
    color: "amber",
    items: [
      { href: "/employee/payroll", label: "Gaji & Slip", icon: DollarSign },
      { href: "/employee/kasbon", label: "Kasbon", icon: Wallet },
      { href: "/employee/training", label: "Pelatihan", icon: GraduationCap },
      { href: "/employee/documents", label: "Dokumen & SOP", icon: BookOpen },
    ],
  },
  {
    label: "Hubungan Karyawan",
    icon: MessageCircle,
    color: "rose",
    items: [
      { href: "/employee/incidents", label: "Laporan Insiden", icon: AlertTriangle },
      { href: "/employee/complaints", label: "Keluhan & Saran", icon: MessageCircle },
      { href: "/employee/warnings", label: "Surat Peringatan", icon: ShieldCheck },
      { href: "/employee/surveys", label: "Survei Karyawan", icon: ClipboardList },
      { href: "/employee/resignation", label: "Pengunduran Diri", icon: LogOut },
    ],
  },
  {
    label: "Bantuan",
    icon: HelpCircle,
    color: "sky",
    items: [
      { href: "/employee/guides", label: "Bantuan & Panduan", icon: HelpCircle },
    ],
  },
];

const GROUP_TOOLTIPS: Record<string, string> = {
  "Dashboard": "Ringkasan aktivitas Anda",
  "Profil & Karir": "Profil, KPI, pengembangan karir, dan deskripsi pekerjaan Anda",
  "Kehadiran & Perjalanan": "Absensi, cuti, perjalanan dinas, dan trip & insentif",
  "Kompensasi & Pengembangan": "Gaji, slip, pelatihan, dan dokumen/SOP",
  "Hubungan Karyawan": "Insiden, keluhan, surat peringatan, survei, dan pengunduran diri",
  "Bantuan": "Panduan penggunaan portal",
};

const ITEM_TOOLTIPS: Record<string, string> = {
  "/employee": "Ringkasan singkat aktivitas Anda",
  "/employee/profile": "Lihat dan edit profil pribadi Anda",
  "/employee/kpi": "Evaluasi KPI dan performa Anda",
  "/employee/career": "Jalur dan rencana pengembangan karir Anda",
  "/employee/jobdesc": "Deskripsi pekerjaan jabatan Anda",
  "/employee/attendance": "Riwayat absensi Anda",
  "/employee/leaves": "Ajukan dan pantau cuti & izin",
  "/employee/overtime": "Ajukan dan pantau lembur Anda",
  "/employee/corrections": "Ajukan koreksi jam masuk/pulang",
  "/employee/business-trip": "Ajukan dan lihat perjalanan dinas",
  "/employee/trips": "Rekap trip dan insentif Anda",
  "/employee/payroll": "Slip gaji Anda",
  "/employee/kasbon": "Pengajuan kasbon dan riwayat cicilan Anda",
  "/employee/training": "Pelatihan yang Anda ikuti",
  "/employee/documents": "Dokumen dan SOP perusahaan",
  "/employee/incidents": "Laporkan insiden yang Anda alami/temukan",
  "/employee/complaints": "Sampaikan keluhan atau saran",
  "/employee/warnings": "Surat peringatan yang Anda terima",
  "/employee/surveys": "Isi survei karyawan",
  "/employee/resignation": "Ajukan pengunduran diri",
  "/employee/guides": "Bantuan & panduan penggunaan portal",
};

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSession();
  const clientUserName = user?.name || "Karyawan";
  const userRoleLabel = "Karyawan";
  const { hasUnreadForHref } = useNotifications("employee");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(MENU_GROUPS.map((g) => g.label))
  );
  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold">
        Lewati ke konten utama
      </a>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-[51]">
        <button
          aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-slate-900 text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-72 lg:w-20 xl:w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen lg:pointer-events-auto
        ${isSidebarOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"}
      `}>
        {/* Brand Header */}
        <div className="p-6 lg:px-3 xl:px-6 border-b border-slate-100 flex items-center gap-2.5 lg:justify-center xl:justify-start">
          <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-red-600/10 shrink-0">
            P
          </div>
          <div className="lg:hidden xl:block">
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">PGP Portal</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Employee Workspace</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 lg:px-2 xl:px-4 space-y-1 overflow-y-auto">
          {MENU_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const hasActive = group.items.some(item => pathname === item.href || (item.href !== "/employee" && pathname.startsWith(item.href)));
            const isExpanded = expandedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  title={GROUP_TOOLTIPS[group.label]}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center gap-2 px-4 lg:px-0 lg:justify-center xl:px-4 xl:justify-start py-2 text-left ${hasActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"} transition-colors`}
                >
                  <GroupIcon size={13} className={`shrink-0 ${hasActive ? "" : GROUP_COLOR_CLASSES_LIGHT[group.color] || ""}`} />
                  <span className="text-[10px] font-bold tracking-widest uppercase lg:hidden xl:inline">{group.label}</span>
                  <ChevronDown size={11} className={`ml-auto shrink-0 transition-transform duration-300 lg:hidden xl:block ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ease-in-out space-y-1 ${isExpanded ? "max-h-[600px]" : "max-h-0 lg:max-h-[600px] xl:max-h-0"}`}
                >
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/employee" && pathname.startsWith(item.href));
                    const hasUnread = hasUnreadForHref(item.href, "/employee");
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        title={ITEM_TOOLTIPS[item.href] || item.label}
                        className={`
                          relative flex items-center gap-3 px-4 lg:px-0 xl:px-4 lg:justify-center xl:justify-start py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold group
                          ${isActive
                            ? "bg-[#0F172A] text-white shadow-lg shadow-slate-900/15"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70"
                          }
                        `}
                      >
                        <Icon size={16} className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"}`} />
                        <span className="lg:hidden xl:inline">{item.label}</span>
                        {hasUnread && !isActive && (
                          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-yellow-400 lg:block xl:hidden" aria-hidden="true" />
                        )}
                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white lg:hidden xl:block" />
                        )}
                        {hasUnread && !isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-yellow-400 lg:hidden xl:block" aria-hidden="true" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 lg:px-2 xl:px-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-xl bg-white border border-slate-100 lg:justify-center xl:justify-start">
            <ProfilePhotoUploader currentUrl={user?.photo_url} name={clientUserName} size={36} fallbackClassName="bg-slate-900" />
            <div className="flex-1 min-w-0 lg:hidden xl:block">
              <p className="text-xs font-bold text-slate-900 truncate">{clientUserName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userRoleLabel}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button title="Keluar Akun" className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 transition-all text-xs font-bold border border-red-200/50 bg-white shadow-sm">
              <LogOut size={14} className="shrink-0" /> <span className="lg:hidden xl:inline">Keluar Akun</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-64 lg:w-56 xl:w-80">
              <Search size={16} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-400 truncate">Portal Karyawan</span>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <NotificationBell role="employee" />

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Sesi Karyawan Aktif</span>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main id="main-content" className="relative flex-1 overflow-y-auto overflow-x-auto bg-gradient-to-br from-[#F8FAFC] via-white to-orange-50/40">
          <PageBackgroundDecor />
          <div className="relative">{children}</div>
        </main>
      </div>
      <SOSButton />
    </div>
  );
}
