"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, LogOut, Menu, X, ChevronRight,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { getCookie } from "@/lib/cookie-client";

const MENU_GROUPS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { href: "/director", label: "Overview" },
    ],
  },
  {
    label: "Permintaan SDM",
    icon: FileText,
    items: [
      { href: "/director/requests", label: "Approve/Tolak" },
    ],
  },
];

export default function DirectorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clientUserName, setClientUserName] = useState("Direktur");
  const [clientUserEmail, setClientUserEmail] = useState("direktur@pratamagaluh.co.id");

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

      <aside className={`w-64 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-40 transition-transform duration-300 border-r border-slate-800 lg:translate-x-0 lg:static lg:h-screen ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="font-extrabold text-base tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">PT PGP &rarr; Director</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">Portal Direktur</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {MENU_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            const hasActive = group.items.some(item => pathname === item.href || pathname.startsWith(item.href + "/"));
            return (
              <div key={group.label} className="mb-3">
                <div className={`flex items-center gap-2 px-5 py-1.5 ${hasActive ? "text-red-400" : "text-slate-500"}`}>
                  <GroupIcon size={13} />
                  <span className="text-[10px] font-bold tracking-widest uppercase">{group.label}</span>
                </div>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/director" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
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
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">{children}</main>
      </div>
    </div>
  );
}
