"use client";

import { ReactNode, useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { MENU_GROUPS, isHrdItemActive, type HrdMenuGroup } from "@/lib/hrd-menu";
import { GROUP_COLOR_CLASSES, GROUP_COLOR_CLASSES_LIGHT } from "@/lib/menu-colors";

/* ─── Tooltip text per group (for title attribute) ─────────────── */
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
  "Career Development": "Jalur karier, promosi, mutasi, rotasi, suksesi, dan rencana pengembangan individu berbasis data",
  "Succession & Talent": "Siapkan kandidat pengganti posisi strategis berbasis talent review",
  "Hubungan Karyawan": "Cuti, absensi, keluhan, dan surat peringatan",
  "Laporan & Analitik": "Laporan rekrutmen, karyawan, payroll, dan lainnya",
  "Admin & Pengaturan": "Konfigurasi sistem, email, WA bot, user management",
};

/* ─── Mobile bottom nav shortcuts ──────────────────────────────── */
const BOTTOM_NAV = [
  { href: "/hrd",                        label: "Dashboard", icon: LayoutDashboard },
  { href: "/hrd/infrastructure/employees", label: "Karyawan",  icon: Users },
  { href: "/hrd/attendance",             label: "Absensi",   icon: Clock },
  { href: "/hrd/recruitment",            label: "Rekrutmen", icon: Briefcase },
];

/* ─── Single top-row group pill — short label + icon so all 17 groups stay
   readable in one tidy, fixed-height row without wrapping, side-scrolling,
   or an overflow bucket. Full name + description shown on hover via the
   title tooltip; the dropdown panel header shows the full name too. ── */
function GroupPill({
  group, isActive, isOpen, hasUnread, tooltip, onClick, compact = false,
}: {
  group: HrdMenuGroup; isActive: boolean; isOpen: boolean; hasUnread: boolean;
  tooltip?: string; onClick: () => void;
  /** Icon-only fallback for viewports too narrow to fit all 17 labels
      legibly (below xl) — still fully reachable via tooltip + click. */
  compact?: boolean;
}) {
  const GroupIcon = group.icon;
  const showLabel = !compact;
  return (
    <button
      type="button"
      title={`${group.label}${tooltip ? ` — ${tooltip}` : ""}`}
      aria-label={group.label}
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 ${
        showLabel ? "px-2 py-1.5" : "p-1.5"
      } ${
        isActive
          ? "bg-red-50 text-pgp-red"
          : isOpen
          ? "bg-slate-100 text-slate-800"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      }`}
    >
      <GroupIcon
        size={14}
        className={`shrink-0 ${
          isActive ? "text-pgp-red" : GROUP_COLOR_CLASSES_LIGHT[group.color] || "text-slate-400"
        }`}
      />
      {/* Full menu name, never abbreviated — group.label is the real name
          from hrd-menu.ts, not a shortened stand-in. */}
      {showLabel && group.label}
      {hasUnread && (
        <span className={`h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0 ${showLabel ? "" : "absolute top-0.5 right-0.5"}`} aria-hidden="true" />
      )}
      {(isActive || isOpen) && (
        <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${isActive ? "bg-pgp-red" : "bg-slate-300"}`} />
      )}
    </button>
  );
}

/* ─── Dropdown column count helper — more columns for bigger groups keeps
   panel height in check without ever hiding/removing an item. ─────── */
function dropdownCols(count: number) {
  if (count >= 24) return "grid-cols-4";
  if (count >= 12) return "grid-cols-3";
  if (count >= 6) return "grid-cols-2";
  return "grid-cols-1";
}

/* ══════════════════════════════════════════════════════════════════
   LAYOUT
══════════════════════════════════════════════════════════════════ */
export default function HRDLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  /* ── State ── */
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileExpandedGroups, setMobileExpandedGroups] = useState<Set<string>>(new Set(["Dashboard"]));
  const [activeDesktopGroup,   setActiveDesktopGroup]   = useState<string | null>(null);
  const [isProfileOpen,        setIsProfileOpen]         = useState(false);
  const [searchQuery,          setSearchQuery]           = useState("");

  /* ── Refs ── */
  const navbarRef   = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef  = useRef<HTMLDivElement>(null);

  /* ── Session / Notifications ── */
  const { user } = useSession();
  const clientUserName  = user?.name  || "HRD";
  const clientUserEmail = user?.email || "hrd@ptpgp.co.id";
  const { hasUnreadForHref } = useNotifications("hrd");

  /* ── Mobile sidebar: toggle + auto-expand active group ── */
  const toggleMobileGroup = (label: string) => {
    setMobileExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  useEffect(() => {
    const activeGroup = MENU_GROUPS.find((g) =>
      g.items.some((item) => isHrdItemActive(pathname, item.href))
    );
    if (activeGroup) {
      setMobileExpandedGroups((prev) =>
        prev.has(activeGroup.label) ? prev : new Set(prev).add(activeGroup.label)
      );
    }
    // Close desktop dropdown on navigation
    setActiveDesktopGroup(null);
    setIsMobileDrawerOpen(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* ── Close desktop dropdown + profile when clicking outside ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideNav      = navbarRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideNav && !insideDropdown) setActiveDesktopGroup(null);
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Search filter (mobile drawer) ── */
  const query      = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const filteredGroups = useMemo(() => {
    if (!isSearching) return MENU_GROUPS;
    return MENU_GROUPS
      .map((group) => {
        const groupMatches = group.label.toLowerCase().includes(query);
        const matchingItems = groupMatches
          ? group.items
          : group.items.filter((i) => i.label.toLowerCase().includes(query));
        if (matchingItems.length === 0) return null;
        return { ...group, items: matchingItems };
      })
      .filter((g): g is typeof MENU_GROUPS[number] => g !== null);
  }, [query, isSearching]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const firstItem = filteredGroups[0]?.items[0];
    if (firstItem) { router.push(firstItem.href); setSearchQuery(""); }
  };

  /* ── Toggle desktop dropdown pill ── */
  const toggleDesktopGroup = useCallback((label: string) => {
    setActiveDesktopGroup((prev) => (prev === label ? null : label));
  }, []);

  /* ── Active desktop group items ── */
  const activeGroupData = useMemo(
    () => MENU_GROUPS.find((g) => g.label === activeDesktopGroup) ?? null,
    [activeDesktopGroup]
  );


  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Lewati ke konten utama
      </a>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE DRAWER — visible only on small screens
      ═══════════════════════════════════════════════════════════ */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      <aside
        className={`lg:hidden w-72 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 border-r border-slate-800 ${
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="p-5 border-b border-slate-800 shrink-0 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
              <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                PTPGP HRIS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">
              Portal Manajemen
            </p>
          </div>
          <button
            aria-label="Tutup menu"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer search */}
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

        {/* Drawer nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {filteredGroups.length === 0 && (
            <p className="px-5 py-4 text-xs text-slate-500">Tidak ada menu yang cocok.</p>
          )}
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            const hasActive    = group.items.some((item) => isHrdItemActive(pathname, item.href));
            const hasGroupUnread = group.items.some((item) => hasUnreadForHref(item.href, "/hrd"));
            const isExpanded   = isSearching || mobileExpandedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleMobileGroup(group.label)}
                  title={GROUP_TOOLTIPS[group.label]}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center gap-2 px-5 py-2.5 text-left transition-colors ${
                    hasActive ? "text-red-400" : "text-slate-500 hover:text-slate-300"
                  }`}
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
                  style={{ maxHeight: isExpanded ? "1000px" : "0px" }}
                >
                  {group.items.map((item) => {
                    const isActive = isHrdItemActive(pathname, item.href);
                    const hasUnread = hasUnreadForHref(item.href, "/hrd");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileDrawerOpen(false)}
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

        {/* Drawer footer */}
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
            <button className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-600/10 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/20">
              <LogOut size={14} className="shrink-0" /> Keluar dari Sistem
            </button>
          </form>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════
          DESKTOP + MOBILE HEADER — top navbar
      ═══════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-slate-200 z-30 shrink-0 sticky top-0">

        {/* ── Row 1: brand · search · notifications · profile ── */}
        <div className="h-14 flex items-center gap-3 px-4 lg:px-6 border-b border-slate-100">
          {/* Mobile hamburger */}
          <button
            aria-label={isMobileDrawerOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            {isMobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Brand */}
          <Link href="/hrd" className="flex items-center gap-2 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse shrink-0" />
            <span className="font-extrabold text-sm tracking-wider text-slate-800">PTPGP HRIS</span>
          </Link>

          {/* Search bar — desktop */}
          <div className="hidden md:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200 w-64 lg:w-80 ml-2">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari menu..."
              className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-600 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} aria-label="Hapus pencarian" className="text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Right: notifications + divider + profile */}
          <div className="flex items-center gap-3 ml-auto">
            <NotificationBell role="hrd" />
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

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
                    <button className="flex items-center gap-2 px-2.5 py-2 w-full rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-all text-xs font-semibold">
                      <LogOut size={14} className="shrink-0" /> Keluar dari Sistem
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 2: Desktop nav pills (hidden on mobile) ── */}
        <div
          ref={navbarRef}
          className="hidden lg:block relative"
        >
          <div>
            {/* Always full, un-abbreviated menu names. Centered and wrapped
                (rather than a single scrolling line) so the row reads as a
                deliberate, balanced block instead of a cramped strip. */}
            <div className="flex flex-wrap items-center justify-center gap-1 px-4 py-2">
              {MENU_GROUPS.map((group) => {
                const isActive     = group.items.some((item) => isHrdItemActive(pathname, item.href));
                const isOpen       = activeDesktopGroup === group.label;
                const hasGroupUnread = group.items.some((item) => hasUnreadForHref(item.href, "/hrd"));
                return (
                  <GroupPill
                    key={group.label}
                    group={group}
                    isActive={isActive}
                    isOpen={isOpen}
                    hasUnread={hasGroupUnread}
                    tooltip={GROUP_TOOLTIPS[group.label]}
                    onClick={() => toggleDesktopGroup(group.label)}
                  />
                );
              })}
            </div>
          </div>

          {/* ── Dropdown panel ── */}
          {activeGroupData && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-40"
            >
              <div className="max-w-screen-2xl mx-auto px-6 py-4">
                {/* Panel header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const GroupIcon = activeGroupData.icon;
                      return (
                        <GroupIcon
                          size={16}
                          className={GROUP_COLOR_CLASSES_LIGHT[activeGroupData.color] || "text-slate-500"}
                        />
                      );
                    })()}
                    <span className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">
                      {activeGroupData.label}
                    </span>
                    {activeGroupData.hubHref && (
                      <Link
                        href={activeGroupData.hubHref}
                        onClick={() => setActiveDesktopGroup(null)}
                        className="ml-2 text-[10px] font-bold text-pgp-red hover:underline flex items-center gap-0.5"
                      >
                        Ringkasan <ChevronRight size={10} />
                      </Link>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveDesktopGroup(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Tutup dropdown"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Items grid — internal scroll caps panel height for large
                    groups instead of pushing the dropdown off-screen; every
                    item stays reachable, none are hidden or removed. */}
                <div className={`grid ${dropdownCols(activeGroupData.items.length)} gap-px max-h-[60vh] overflow-y-auto pr-1`}>
                  {activeGroupData.items.map((item) => {
                    const isActive = isHrdItemActive(pathname, item.href);
                    const hasUnread = hasUnreadForHref(item.href, "/hrd");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setActiveDesktopGroup(null)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all group ${
                          isActive
                            ? "bg-red-50 text-pgp-red"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-pgp-red shrink-0" />
                        )}
                        <span className="truncate flex-1">{item.label}</span>
                        {hasUnread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0 ml-auto" aria-hidden="true" />
                        )}
                        <ChevronRight
                          size={10}
                          className="shrink-0 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════ */}
      <main
        id="main-content"
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] pb-16 lg:pb-0"
      >
        <div className="mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          MOBILE BOTTOM NAV
      ═══════════════════════════════════════════════════════════ */}
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
          onClick={() => setIsMobileDrawerOpen(true)}
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
