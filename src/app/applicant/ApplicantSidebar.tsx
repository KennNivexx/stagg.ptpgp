"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Building2, User, LogOut, ChevronRight } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/applicant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applicant/status", label: "Status Lamaran", icon: ClipboardList },
  { href: "/applicant/company", label: "Info Perusahaan", icon: Building2 },
  { href: "/applicant/profile", label: "Profil Lamaran", icon: User },
];

interface Props {
  userName: string;
  userEmail: string;
}

export default function ApplicantSidebar({ userName, userEmail }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-[#1A2530] text-white flex flex-col min-h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#CC0000] rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0">
            PGP
          </div>
          <div>
            <p className="text-xs font-extrabold tracking-wide leading-tight">PT PRATAMA</p>
            <p className="text-[10px] text-slate-400">Portal Pelamar</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded">
              Pelamar
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/applicant" ? pathname === "/applicant" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#CC0000] text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={15} className="shrink-0" />
              {label}
              {isActive && <ChevronRight size={12} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
