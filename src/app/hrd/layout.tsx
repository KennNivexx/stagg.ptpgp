"use client";

import { ReactNode, useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut, Search, Menu, X, ChevronRight, ChevronDown, Sparkles,
} from "lucide-react";
import PageBackgroundDecor from "@/components/PageBackgroundDecor";
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader";
import { logoutAction } from "@/app/actions/auth";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationBell from "@/components/NotificationBell";
import { MENU_GROUPS, isHrdItemActive } from "@/lib/hrd-menu";
import { GROUP_COLOR_CLASSES } from "@/lib/menu-colors";

/* ════════════════════════════════════════════════════════════════════
   HRD LAYOUT — persistent sidebar (same pattern as director/superadmin):
   icon-only at lg, full labels at xl, overlay drawer below lg. The old
   3-row horizontal top navbar (brand/search/profile + module pills +
   sub-tabs) is gone; all navigation now lives in the sidebar.
   ════════════════════════════════════════════════════════════════════ */

function groupBySection<T extends { section?: string }>(items: T[]) {
  const order: string[] = [];
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = item.section || "";
    if (!buckets.has(key)) { buckets.set(key, []); order.push(key); }
    buckets.get(key)!.push(item);
  }
  return order.map((key) => ({ section: key, items: buckets.get(key)! }));
}

export default function HRDLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  /* ── State ── */
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["Dashboard"]));
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);

  const { user } = useSession();
  const clientUserName  = user?.name  || "HRD";
  const clientUserEmail = user?.email || "hrd@ptpgp.co.id";
  const { hasUnreadForHref } = useNotifications("hrd");

  /* ── Active group (for auto-expanding it in the sidebar) ── */
  const activeGroup = useMemo(
    () => MENU_GROUPS.find((g) => g.items.some((item) => isHrdItemActive(pathname, item.href))) || null,
    [pathname]
  );

  /* ── Auto-expand active group, close mobile drawer on nav ── */
  useEffect(() => {
    if (activeGroup) {
      setExpandedGroups((prev) =>
        prev.has(activeGroup.label) ? prev : new Set(prev).add(activeGroup.label)
      );
    }
    setIsSidebarOpen(false);
  }, [pathname, activeGroup]);

  /* ── Close profile popover on outside click ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Search filter for the sidebar menu ── */
  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  // Not searching: collapse each group down to its most-used items (anything
  // flagged showInDropdown:false) to cut sidebar scrolling — those items
  // aren't gone, they're one click away as tiles on the group's own
  // "Ringkasan" hub page (SectionQuickLinks reads the full, unfiltered list).
  // Searching: search across every item regardless of that flag, so nothing
  // is ever truly hidden from a user who knows what they're looking for.
  const filteredGroups = useMemo(() => {
    if (!isSearching) {
      return MENU_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.showInDropdown !== false),
      }));
    }
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

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBFA] flex font-sans text-slate-800">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-slate-900 focus:text-white focus:rounded-lg focus:text-sm focus:font-bold"
      >
        Lewati ke konten utama
      </a>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-[51]">
        <button
          aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-[#0F172A] text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="lg:hidden fixed inset-0 bg-black/40 z-40" />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SIDEBAR — overlay drawer below lg, icon-only at lg, full at xl
      ═══════════════════════════════════════════════════════════════ */}
      <aside
        className={`w-72 lg:w-20 xl:w-72 bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0 lg:static lg:h-screen lg:pointer-events-auto ${
          isSidebarOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
        }`}
      >
        {/* Brand */}
        <div className="p-5 lg:px-3 xl:px-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 lg:justify-center xl:justify-start">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 shrink-0" />
            <span className="font-extrabold text-base tracking-wider text-white lg:hidden xl:inline">PTPGP HRIS</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5 lg:hidden xl:block">Portal Manajemen</p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800 shrink-0 lg:hidden xl:block">
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {filteredGroups.length === 0 && <p className="px-5 py-4 text-xs text-slate-500 lg:hidden xl:block">Tidak ada menu yang cocok.</p>}
          {filteredGroups.map((group) => {
            const GroupIcon = group.icon;
            // Checked against the group's FULL item list (not the filtered
            // one rendered below) so the header still highlights correctly
            // when the active/unread page is one that's collapsed into the
            // hub's quick-links rather than shown directly in this list.
            const fullGroup = MENU_GROUPS.find((g) => g.label === group.label) || group;
            const hasActive = fullGroup.items.some((item) => isHrdItemActive(pathname, item.href));
            const hasGroupUnread = fullGroup.items.some((item) => hasUnreadForHref(item.href, "/hrd"));
            const isExpanded = isSearching || expandedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  title={group.label}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center gap-2 px-5 lg:px-0 lg:justify-center xl:px-5 xl:justify-start py-2.5 text-left transition-colors ${hasActive ? "text-red-400" : "text-slate-400 hover:text-slate-300"}`}
                >
                  <GroupIcon size={13} className={`shrink-0 ${hasActive ? "" : GROUP_COLOR_CLASSES[group.color] || ""}`} />
                  <span className="text-[10px] font-bold tracking-widest uppercase lg:hidden xl:inline">{group.label}</span>
                  {hasGroupUnread && <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shrink-0 lg:hidden xl:block" aria-hidden="true" />}
                  <ChevronDown size={11} className={`ml-auto shrink-0 transition-transform duration-300 lg:hidden xl:block ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isExpanded ? "max-h-[1200px]" : "max-h-0 lg:max-h-[1200px] xl:max-h-0"}`}
                >
                  {groupBySection(group.items).map(({ section, items }) => (
                    <div key={section || "_"}>
                      {section && <p className="pl-9 lg:hidden xl:block pr-4 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-600">{section}</p>}
                      {items.map((item) => {
                        const isActive = isHrdItemActive(pathname, item.href);
                        const hasUnread = hasUnreadForHref(item.href, "/hrd");
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`relative flex items-center gap-2 pl-9 lg:pl-0 lg:justify-center xl:pl-9 xl:justify-start pr-4 py-2.5 text-[11px] font-medium transition-all duration-150 ${
                              isActive ? "bg-red-600/20 text-white border-l-2 border-red-500 lg:border-l-0" : "text-slate-400 hover:text-white hover:bg-slate-800/40 border-l-2 border-transparent lg:border-l-0"
                            }`}
                          >
                            {isActive && <ChevronRight size={10} className="text-red-400 shrink-0 lg:hidden xl:block" />}
                            <span className="truncate lg:hidden xl:inline">{item.label}</span>
                            {hasUnread && (
                              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-yellow-400 lg:block xl:hidden" aria-hidden="true" />
                            )}
                            {hasUnread && (
                              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-yellow-400 lg:hidden xl:block" aria-hidden="true" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer — profile & logout */}
        <div className="p-4 lg:px-2 xl:px-4 border-t border-slate-800 bg-[#0B0F19] shrink-0">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-lg bg-slate-900/40 lg:justify-center xl:justify-start">
            <ProfilePhotoUploader currentUrl={user?.photo_url} name={clientUserName} size={36} />
            <div className="flex-1 min-w-0 lg:hidden xl:block">
              <p className="text-xs font-semibold text-white truncate">{clientUserName}</p>
              <p className="text-[10px] text-slate-400 truncate">{clientUserEmail}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button title="Keluar dari Sistem" className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-600/10 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/20">
              <LogOut size={14} className="shrink-0" /> <span className="lg:hidden xl:inline">Keluar dari Sistem</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════
          MAIN COLUMN — slim top bar (AI, notifications, profile) + content
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end gap-3 px-6 lg:px-8 z-30 shrink-0">
          {/* Persistent AI entry point */}
          <Link
            href="/hrd/assistant"
            title="HRD Copilot — tanya soal data HR"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              pathname === "/hrd/assistant"
                ? "bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-sm"
                : "bg-gradient-to-r from-red-50 to-orange-50 text-pgp-red border border-red-100 hover:shadow-sm"
            }`}
          >
            <Sparkles size={14} />
            <span className="hidden sm:inline">AI</span>
          </Link>
          <NotificationBell role="hrd" />
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((v) => !v)}
              aria-expanded={isProfileOpen}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ProfilePhotoUploader currentUrl={user?.photo_url} name={clientUserName} size={32} editable={false} />
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
        </header>

        <main
          id="main-content"
          className="relative flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-[#FDFBFA] via-white to-orange-50/50"
        >
          <PageBackgroundDecor />
          <div className="relative mx-auto w-full max-w-screen-2xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
