"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  UserCog,
  LogOut,
  LayoutDashboard,
  Search,
  Menu,
  X,
  ShieldCheck,
  Globe,
  Monitor,
  Eye,
  Image,
  Building2,
  Link2,
  Footprints,
  Palette,
  KeyRound,
  ClipboardList,
  Phone,
  Layers,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useSession } from "@/hooks/useSession";
import NotificationBell from "@/components/NotificationBell";

export default function SuperadminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSession();
  const userName = user?.name || "Super Administrator";
  const userEmail = user?.email || "superadmin@ptpgp.co.id";

  const menuItems = [
    { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard },
  ];

  const websiteItems = [
    { href: "/superadmin/website/theme", label: "Tema & Warna", icon: Palette },
    { href: "/superadmin/website/hero", label: "Hero Section", icon: Image },
    { href: "/superadmin/website/info", label: "Info Perusahaan", icon: Building2 },
    { href: "/superadmin/website/links", label: "Link & Navigasi", icon: Link2 },
    { href: "/superadmin/website/contact", label: "Kontak", icon: Phone },
    { href: "/superadmin/website/teaser", label: "Teaser (Karir/E-Pro)", icon: Layers },
    { href: "/superadmin/website/footer", label: "Footer", icon: Footprints },
  ];

  const monitoringItems = [
    { href: "/superadmin/monitoring/hrd", label: "Data HRD", icon: Eye },
    { href: "/superadmin/monitoring/employees", label: "Data Karyawan", icon: Users },
  ];

  const userItems = [
    { href: "/superadmin/employees", label: "Manajemen User", icon: UserCog },
    { href: "/hrd/admin/roles", label: "Role & Permission", icon: KeyRound },
    { href: "/hrd/admin/audit", label: "Audit Log", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold">
        Lewati ke konten utama
      </a>
      {/* Sidebar Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-[#1E293B] text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        w-72 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out border-r border-slate-800
        lg:translate-x-0 lg:static lg:h-screen
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Brand/Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
                PTPGP HRIS
              </span>
            </div>
            <p className="text-[10px] text-amber-400/70 font-medium tracking-widest uppercase mt-0.5">
              Superadmin Panel
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group
                  ${isActive
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/15"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }
                `}
              >
                <Icon size={18} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}

          {/* Website Management Section */}
          <div className="pt-3">
            <p className="px-4 py-2 text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
              <Globe size={11} /> Manajemen Website
            </p>
            {websiteItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group
                    ${isActive
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/15"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }
                  `}
                >
                  <Icon size={16} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Monitoring Section */}
          <div className="pt-3">
            <p className="px-4 py-2 text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
              <Monitor size={11} /> Monitoring
            </p>
            {monitoringItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group
                    ${isActive
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/15"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }
                  `}
                >
                  <Icon size={16} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Management Section */}
          <div className="pt-3">
            <p className="px-4 py-2 text-[10px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
              <ShieldCheck size={11} /> Manajemen User
            </p>
            {userItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group
                    ${isActive
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/15"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }
                  `}
                >
                  <Icon size={16} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-lg bg-slate-900/40">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-600/10 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/20">
              <LogOut size={14} /> Keluar dari Sistem
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 w-64 lg:w-80">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Cari data user, karyawan..."
                className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Notification Bell — superadmin sees HRD notifications */}
            <NotificationBell role="hrd" />

            {/* Quick Status / Lang */}
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800">PT PGP Utama</p>
                <p className="text-[10px] text-amber-600 font-medium">Superadmin Mode</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-amber-500"></div>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
