"use client";

import { ReactNode, useState, useEffect } from "react";
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
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { getCookie } from "@/lib/cookie-client";
import NotificationBell from "@/components/NotificationBell";

export default function EmployeeLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clientUserName, setClientUserName] = useState("Karyawan");
  const userRoleLabel = "Karyawan";

  useEffect(() => {
    const name = getCookie("user_name");
    if (name) setClientUserName(name);
  }, []);

  const menuItems = [
    { href: "/employee", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employee/profile", label: "Profil Saya", icon: User },
    { href: "/employee/attendance", label: "Absensi", icon: Calendar },
    { href: "/employee/leaves", label: "Cuti & Izin", icon: FileText },
    { href: "/employee/payroll", label: "Gaji & Slip", icon: DollarSign },
    { href: "/employee/training", label: "Pelatihan", icon: GraduationCap },
    { href: "/employee/documents", label: "Dokumen & SOP", icon: BookOpen },
    { href: "/employee/kpi", label: "KPI & Performa", icon: TrendingUp },
    { href: "/employee/career", label: "Pengembangan Karir", icon: TrendingUp },
    { href: "/employee/complaints", label: "Keluhan & Saran", icon: MessageCircle },
    { href: "/employee/warnings", label: "Surat Peringatan", icon: ShieldCheck },
    { href: "/employee/resignation", label: "Pengunduran Diri", icon: LogOut },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
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
          className="lg:hidden fixed inset-0 bg-black/40 z-45 transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-red-600/10">
            P
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">PGP Portal</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Employee Workspace</p>
          </div>
        </div>
        
        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/employee" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-xs font-semibold group
                  ${isActive 
                    ? "bg-[#0F172A] text-white shadow-lg shadow-slate-900/15" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/70"
                  }
                `}
              >
                <Icon size={16} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-xl bg-white border border-slate-100">
            <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {clientUserName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{clientUserName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userRoleLabel}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700 transition-all text-xs font-bold border border-red-200/50 bg-white shadow-sm">
              <LogOut size={14} /> Keluar Akun
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-64 lg:w-80">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari info internal, slip..." 
                className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <NotificationBell role="employee" />

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Sesi Karyawan Aktif</span>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
