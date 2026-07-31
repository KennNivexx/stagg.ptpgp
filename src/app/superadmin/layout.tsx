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
  Info,
  Sparkles,
  Grid3x3,
  MapPin,
  BarChart3,
  Factory,
  GalleryHorizontal,
  MessageSquareQuote,
  BadgeCheck,
  HelpCircle,
  Megaphone,
  ChevronDown,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useSession } from "@/hooks/useSession";
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBell from "@/components/NotificationBell";
import { GROUP_COLOR_CLASSES } from "@/lib/menu-colors";
import PageBackgroundDecor from "@/components/PageBackgroundDecor";
import type { LucideIcon } from "lucide-react";

type MenuItem = { href: string; label: string; icon?: LucideIcon };
type MenuGroup = { label: string; icon: LucideIcon; color: string; items: MenuItem[] };

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "amber",
    items: [
      { href: "/superadmin", label: "Dashboard" },
    ],
  },
  {
    label: "Manajemen Website",
    icon: Globe,
    color: "sky",
    items: [
      { href: "/superadmin/website/theme", label: "Tema & Warna", icon: Palette },
      { href: "/superadmin/website/hero", label: "Hero Section", icon: Image },
      { href: "/superadmin/website/about", label: "Tentang Kami", icon: Info },
      { href: "/superadmin/website/features", label: "Keunggulan", icon: Sparkles },
      { href: "/superadmin/website/services", label: "Layanan", icon: Grid3x3 },
      { href: "/superadmin/website/coverage", label: "Cakupan Wilayah", icon: MapPin },
      { href: "/superadmin/website/stats", label: "Statistik", icon: BarChart3 },
      { href: "/superadmin/website/industries", label: "Industri", icon: Factory },
      { href: "/superadmin/website/gallery", label: "Galeri", icon: GalleryHorizontal },
      { href: "/superadmin/website/testimonial", label: "Testimoni", icon: MessageSquareQuote },
      { href: "/superadmin/website/certification", label: "Sertifikasi", icon: BadgeCheck },
      { href: "/superadmin/website/faq", label: "FAQ", icon: HelpCircle },
      { href: "/superadmin/website/cta", label: "Call to Action", icon: Megaphone },
      { href: "/superadmin/website/info", label: "Info Perusahaan", icon: Building2 },
      { href: "/superadmin/website/links", label: "Link & Navigasi", icon: Link2 },
      { href: "/superadmin/website/contact", label: "Kontak", icon: Phone },
      { href: "/superadmin/website/teaser", label: "Teaser (Karir/E-Pro)", icon: Layers },
      { href: "/superadmin/website/footer", label: "Footer", icon: Footprints },
    ],
  },
  {
    label: "Monitoring",
    icon: Monitor,
    color: "violet",
    items: [
      { href: "/superadmin/monitoring/hrd", label: "Data HRD", icon: Eye },
      { href: "/superadmin/monitoring/employees", label: "Data Karyawan", icon: Users },
    ],
  },
  {
    label: "Manajemen User",
    icon: ShieldCheck,
    color: "emerald",
    items: [
      { href: "/superadmin/employees", label: "Manajemen User", icon: UserCog },
      { href: "/hrd/admin/roles", label: "Role & Permission", icon: KeyRound },
      { href: "/hrd/admin/audit", label: "Audit Log", icon: ClipboardList },
    ],
  },
];

const GROUP_TOOLTIPS: Record<string, string> = {
  "Dashboard": "Ringkasan sistem secara keseluruhan",
  "Manajemen Website": "Kelola konten dan tampilan website perusahaan",
  "Monitoring": "Pantau data HRD dan karyawan",
  "Manajemen User": "Kelola akun, role, permission, dan audit log",
};

const ITEM_TOOLTIPS: Record<string, string> = {
  "/superadmin": "Ringkasan sistem secara keseluruhan",
  "/superadmin/website/theme": "Atur tema dan warna website",
  "/superadmin/website/hero": "Kelola bagian hero halaman utama",
  "/superadmin/website/about": "Kelola konten Tentang Kami",
  "/superadmin/website/features": "Kelola daftar keunggulan perusahaan",
  "/superadmin/website/services": "Kelola daftar layanan",
  "/superadmin/website/coverage": "Kelola cakupan wilayah operasi",
  "/superadmin/website/stats": "Kelola statistik perusahaan",
  "/superadmin/website/industries": "Kelola daftar industri yang dilayani",
  "/superadmin/website/gallery": "Kelola galeri foto",
  "/superadmin/website/testimonial": "Kelola testimoni klien",
  "/superadmin/website/certification": "Kelola sertifikasi perusahaan",
  "/superadmin/website/faq": "Kelola pertanyaan yang sering diajukan",
  "/superadmin/website/cta": "Kelola Call to Action",
  "/superadmin/website/info": "Kelola info perusahaan",
  "/superadmin/website/links": "Kelola link & navigasi website",
  "/superadmin/website/contact": "Kelola info kontak",
  "/superadmin/website/teaser": "Kelola teaser Karir/E-Procurement",
  "/superadmin/website/footer": "Kelola footer website",
  "/superadmin/monitoring/hrd": "Pantau data yang dikelola HRD",
  "/superadmin/monitoring/employees": "Pantau data karyawan",
  "/superadmin/employees": "Kelola akun pengguna sistem",
  "/hrd/admin/roles": "Kelola role dan permission",
  "/hrd/admin/audit": "Lihat audit log aktivitas sistem",
};

export default function SuperadminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSession();
  const userName = user?.name || "Super Administrator";
  const userEmail = user?.email || "superadmin@ptpgp.co.id";
  // Superadmin's sidebar (website mgmt / monitoring / users) doesn't mirror the
  // HRD route tree its notification feed links into, so per-item href matching
  // wouldn't ever light up — flag the Dashboard entry instead as a general signal.
  const { unreadCount } = useNotifications("hrd");
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
      {/* Sidebar Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[51]">
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
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        w-72 lg:w-20 xl:w-72 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-800
        lg:translate-x-0 lg:static lg:h-screen lg:pointer-events-auto
        ${isSidebarOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"}
      `}
      >
        {/* Brand/Header */}
        <div className="p-6 lg:px-3 xl:px-6 border-b border-slate-800 flex items-center justify-between lg:justify-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2 lg:justify-center xl:justify-start">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span className="font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200 lg:hidden xl:inline">
                PTPGP HRIS
              </span>
            </div>
            <p className="text-[10px] text-amber-400/70 font-medium tracking-widest uppercase mt-0.5 lg:hidden xl:block">
              Superadmin Panel
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 lg:px-2 xl:px-4 space-y-1 overflow-y-auto">
          {MENU_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const hasActive = group.items.some(item => item.href === "/superadmin" ? pathname === item.href : pathname.startsWith(item.href));
            const isExpanded = expandedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  title={GROUP_TOOLTIPS[group.label]}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center gap-2 px-4 lg:px-0 lg:justify-center xl:px-4 xl:justify-start py-2 text-left ${hasActive ? "text-amber-400" : "text-slate-500 hover:text-slate-300"} transition-colors`}
                >
                  <GroupIcon size={13} className={`shrink-0 ${hasActive ? "" : GROUP_COLOR_CLASSES[group.color] || ""}`} />
                  <span className="text-[10px] font-bold tracking-widest uppercase lg:hidden xl:inline">{group.label}</span>
                  <ChevronDown size={11} className={`ml-auto shrink-0 transition-transform duration-300 lg:hidden xl:block ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ease-in-out space-y-1 ${isExpanded ? "max-h-[1200px]" : "max-h-0 lg:max-h-[1200px] xl:max-h-0"}`}
                >
                  {group.items.map((item) => {
                    const isActive = item.href === "/superadmin" ? pathname === item.href : pathname.startsWith(item.href);
                    const hasUnread = unreadCount > 0 && item.href === "/superadmin";
                    const Icon = item.icon || group.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        title={ITEM_TOOLTIPS[item.href] || item.label}
                        className={`
                          relative flex items-center gap-3 px-4 lg:px-0 lg:justify-center xl:px-4 xl:justify-start py-2.5 rounded-xl transition-all duration-200 text-sm font-medium group
                          ${isActive
                            ? "bg-amber-600 text-white shadow-lg shadow-amber-600/15"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                          }
                        `}
                      >
                        <Icon size={16} className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                        <span className="lg:hidden xl:inline">{item.label}</span>
                        {hasUnread && !isActive && (
                          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-yellow-400 lg:block xl:hidden" aria-hidden="true" />
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

        {/* User Profile Card & Logout */}
        <div className="p-4 lg:px-2 xl:px-4 border-t border-slate-800 bg-[#0B0F19]">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-lg bg-slate-900/40 lg:justify-center xl:justify-start">
            <ProfilePhotoUploader currentUrl={user?.photo_url} name={userName} size={40} fallbackClassName="bg-gradient-to-br from-amber-500 to-amber-700" />
            <div className="flex-1 min-w-0 lg:hidden xl:block">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button title="Keluar dari Sistem" className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-600/10 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/20">
              <LogOut size={14} className="shrink-0" /> <span className="lg:hidden xl:inline">Keluar dari Sistem</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 w-64 lg:w-56 xl:w-80">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Cari data user, karyawan..."
                className="bg-transparent border-none text-xs focus:outline-none w-full min-w-0 text-slate-600"
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
        <main id="main-content" className="relative flex-1 overflow-y-auto overflow-x-auto bg-gradient-to-br from-[#F8FAFC] via-white to-orange-50/40">
          <PageBackgroundDecor />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
