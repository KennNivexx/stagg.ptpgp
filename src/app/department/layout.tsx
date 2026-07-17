"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, LogOut, Menu, X, ChevronRight, ChevronDown, HelpCircle,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useSession } from "@/hooks/useSession";
import { useNotifications } from "@/hooks/useNotifications";
import { GROUP_COLOR_CLASSES } from "@/lib/menu-colors";

const MENU_GROUPS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    color: "emerald",
    items: [
      { href: "/department", label: "Overview" },
    ],
  },
  {
    label: "Departemen Saya",
    icon: Users,
    color: "teal",
    items: [
      { href: "/department/requests", label: "Riwayat Permintaan" },
      { href: "/department/competency", label: "Kompetensi" },
      { href: "/department/kpi", label: "KPI Karyawan" },
      { href: "/department/warnings", label: "Surat Peringatan" },
      { href: "/department/leaves", label: "Cuti & Izin" },
      { href: "/department/business-trips", label: "Perjalanan Dinas" },
      { href: "/department/incidents", label: "Laporan Insiden" },
      { href: "/department/fleet", label: "Armada & SIM Tim" },
      { href: "/department/trips", label: "Lembur & Biaya Trip" },
      { href: "/department/shifts", label: "Shift Kerja" },
      { href: "/department/locations", label: "Lokasi Kerja" },
      { href: "/department/attendance", label: "Absensi" },
      { href: "/department/documents", label: "Dokumen Perusahaan" },
      { href: "/department/jobdesc", label: "Deskripsi & Spesifikasi Kerja" },
    ],
  },
  {
    label: "Bantuan",
    icon: HelpCircle,
    color: "sky",
    items: [
      { href: "/department/guides", label: "Bantuan & Panduan" },
    ],
  },
];

const GROUP_TOOLTIPS: Record<string, string> = {
  "Dashboard": "Ringkasan aktivitas departemen Anda",
  "Departemen Saya": "Kelola tim, kompetensi, kinerja, kehadiran, dan aset departemen",
  "Bantuan": "Panduan penggunaan portal",
};

const ITEM_TOOLTIPS: Record<string, string> = {
  "/department": "Ringkasan singkat departemen Anda",
  "/department/requests": "Riwayat permintaan penambahan karyawan",
  "/department/competency": "Penilaian kompetensi tim Anda",
  "/department/kpi": "Evaluasi KPI karyawan di departemen",
  "/department/warnings": "Surat peringatan yang diterbitkan",
  "/department/leaves": "Persetujuan cuti & izin karyawan",
  "/department/business-trips": "Laporan perjalanan dinas tim",
  "/department/incidents": "Laporan insiden di departemen",
  "/department/fleet": "Armada kendaraan dan SIM tim",
  "/department/trips": "Rekap lembur dan biaya trip",
  "/department/shifts": "Jadwal shift kerja tim",
  "/department/locations": "Lokasi kerja tim (tampilan baca saja)",
  "/department/attendance": "Rekap absensi tim",
  "/department/documents": "Dokumen perusahaan yang relevan",
  "/department/jobdesc": "Deskripsi & spesifikasi kerja jabatan",
  "/department/guides": "Bantuan & panduan penggunaan portal",
};

export default function DepartmentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSession();
  const clientUserName = user?.name || "Manajer Departemen";
  const clientUserEmail = user?.email || "dept@ptpgp.co.id";
  const { hasUnreadForHref } = useNotifications("department");
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
      <div className="lg:hidden fixed top-4 left-4 z-[51]">
        <button
          aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-emerald-900 text-white rounded-lg shadow-md hover:bg-emerald-800 transition-colors"
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

      <aside className={`w-64 lg:w-20 xl:w-64 bg-emerald-900 text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 border-r border-emerald-950 lg:translate-x-0 lg:static lg:h-screen lg:pointer-events-auto ${isSidebarOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"}`}>
        <div className="p-5 lg:px-3 xl:px-5 border-b border-emerald-950 shrink-0">
          <div className="flex items-center gap-2 lg:justify-center xl:justify-start">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-emerald-300 lg:hidden xl:inline">PT PGP &rarr; Dept Manager</span>
          </div>
          <p className="text-[10px] text-emerald-300 font-medium tracking-widest uppercase mt-0.5 lg:hidden xl:block">Portal Departemen</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {MENU_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const hasActive = group.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));
            const isExpanded = expandedGroups.has(group.label);
            return (
              <div key={group.label} className="mb-3">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  title={GROUP_TOOLTIPS[group.label]}
                  aria-expanded={isExpanded}
                  className={`w-full flex items-center gap-2 px-5 lg:px-0 lg:justify-center xl:px-5 xl:justify-start py-1.5 ${hasActive ? "text-emerald-300" : "text-emerald-700 hover:text-emerald-400"} transition-colors`}
                >
                  <GroupIcon size={13} className={`shrink-0 ${hasActive ? "" : GROUP_COLOR_CLASSES[group.color] || ""}`} />
                  <span className="text-[10px] font-bold tracking-widest uppercase lg:hidden xl:inline">{group.label}</span>
                  <ChevronDown size={11} className={`ml-auto shrink-0 transition-transform duration-300 lg:hidden xl:block ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                <div
                  className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${isExpanded ? "max-h-[600px]" : "max-h-0 lg:max-h-[600px] xl:max-h-0"}`}
                >
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/department" && pathname.startsWith(item.href));
                    const hasUnread = hasUnreadForHref(item.href, "/department");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        title={ITEM_TOOLTIPS[item.href] || item.label}
                        className={`relative flex items-center gap-2 pl-9 lg:pl-0 lg:justify-center xl:pl-9 xl:justify-start pr-4 py-2 text-[11px] font-medium transition-all duration-150 ${
                          isActive
                            ? "bg-emerald-500/20 text-white border-l-2 border-emerald-400"
                            : "text-emerald-200/70 hover:text-white hover:bg-emerald-800/40 border-l-2 border-transparent"
                        }`}
                      >
                        {isActive && <ChevronRight size={10} className="text-emerald-400 shrink-0 lg:hidden xl:block" />}
                        <span className="truncate lg:hidden xl:inline">{item.label}</span>
                        {hasUnread && (
                          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-yellow-400 lg:block xl:hidden" aria-hidden="true" />
                        )}
                        {hasUnread && (
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

        <div className="p-4 lg:px-2 xl:px-4 border-t border-emerald-950 bg-[#022C22] shrink-0">
          <div className="flex items-center gap-3 p-2 mb-3 rounded-lg bg-emerald-900/40 lg:justify-center xl:justify-start">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0">
              {clientUserName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 lg:hidden xl:block">
              <p className="text-xs font-semibold text-white truncate">{clientUserName}</p>
              <p className="text-[10px] text-emerald-300 truncate">{clientUserEmail}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button title="Keluar dari Sistem" className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-xl hover:bg-red-600/10 text-red-400 hover:text-red-300 transition-all text-xs font-semibold border border-red-500/20">
              <LogOut size={14} className="shrink-0" /> <span className="lg:hidden xl:inline">Keluar dari Sistem</span>
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:h-screen lg:overflow-hidden">
        <main id="main-content" className="flex-1 overflow-y-auto overflow-x-auto bg-[#F8FAFC]">
          <div className="h-14 lg:hidden" aria-hidden="true" />
          {children}
        </main>
      </div>
    </div>
  );
}
