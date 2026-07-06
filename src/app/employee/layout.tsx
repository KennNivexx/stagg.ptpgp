"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  Calendar, 
  FileText, 
  Target, 
  LogOut,
  Search,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  DollarSign,
  GraduationCap,
  BookOpen,
  TrendingUp,
  MessageCircle,
  HelpCircle,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBell from "@/components/NotificationBell";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSession();
  const clientUserName = user?.name || "Karyawan";
  const userRoleLabel = "Karyawan";
  const { hasUnreadForHref } = useNotifications("employee");

  const menuItems = [
    { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/profile", label: "Profil Saya", icon: User },
    { href: "/employee/attendance", label: "Absensi", icon: Calendar },
    { href: "/employee/leaves", label: "Cuti & Izin", icon: FileText },
    { href: "/employee/payroll", label: "Gaji & Slip", icon: DollarSign },
    { href: "/employee/training", label: "Pelatihan", icon: GraduationCap },
    { href: "/employee/documents", label: "Dokumen & SOP", icon: BookOpen },
    { href: "/employee/kpi", label: "KPI & Performa", icon: TrendingUp },
    { href: "/employee/jobdesc", label: "Deskripsi Pekerjaan", icon: Briefcase },
    { href: "/employee/career", label: "Pengembangan Karir", icon: TrendingUp },
    { href: "/employee/complaints", label: "Keluhan & Saran", icon: MessageCircle },
    { href: "/employee/warnings", label: "Surat Peringatan", icon: ShieldCheck },
    { href: "/employee/resignation", label: "Pengunduran Diri", icon: LogOut },
    { href: "/employee/surveys", label: "Survei Karyawan", icon: ClipboardList },
    { href: "/employee/guides", label: "Bantuan & Panduan", icon: HelpCircle },
  ];

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
        lg:translate-x-0 lg:static lg:h-screen
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
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/employee" && pathname.startsWith(item.href));
            const hasUnread = hasUnreadForHref(item.href, "/employee");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                title={item.label}
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
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 lg:px-2 xl:px-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-xl bg-white border border-slate-100 lg:justify-center xl:justify-start">
            <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
              {clientUserName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
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
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
