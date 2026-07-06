"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Building2, User, LogOut, ChevronRight, PenLine, HelpCircle } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { href: "/applicant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applicant/status", label: "Status Lamaran", icon: ClipboardList },
  { href: "/applicant/company", label: "Info Perusahaan", icon: Building2 },
  { href: "/applicant/test", label: "Tes Online", icon: PenLine },
  { href: "/applicant/profile", label: "Profil Lamaran", icon: User },
  { href: "/applicant/guides", label: "Bantuan & Panduan", icon: HelpCircle },
];

interface Props {
  userName: string;
  userEmail: string;
}

export default function ApplicantSidebar({ userName, userEmail }: Props) {
  const pathname = usePathname();
  const { hasUnreadForHref } = useNotifications("applicant");

  return (
    <aside className="w-64 lg:w-20 xl:w-64 shrink-0 bg-pgp-navy text-white flex flex-col min-h-screen sticky top-0 transition-[width] duration-300">
      {/* Logo */}
      <div className="px-6 lg:px-3 xl:px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3 lg:justify-center xl:justify-start">
          <div className="w-9 h-9 bg-pgp-red rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0">
            PGP
          </div>
          <div className="lg:hidden xl:block">
            <p className="text-xs font-extrabold tracking-wide leading-tight">PT PRATAMA</p>
            <p className="text-[10px] text-slate-400">Portal Pelamar</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 lg:px-3 xl:px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 lg:justify-center xl:justify-start">
          <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 lg:hidden xl:block">
            <p className="text-xs font-bold truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded">
              Pelamar
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 lg:px-2 xl:px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }, i) => {
          const isActive = href === "/applicant" ? pathname === "/applicant" : pathname.startsWith(href);
          const hasUnread = hasUnreadForHref(href, "/applicant");
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25, ease: "easeOut" }}
            >
              <Link
                href={href}
                title={label}
                className="relative flex items-center gap-3 lg:justify-center xl:justify-start px-3 lg:px-0 xl:px-3 py-2.5 rounded-xl text-xs font-semibold overflow-hidden"
              >
                {/* Sliding background */}
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-pgp-red rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}

                {/* Hover background (only when not active) */}
                {!isActive && (
                  <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 bg-white/5 transition-opacity duration-150" />
                )}

                {/* Content */}
                <span className={`relative flex items-center gap-3 lg:justify-center xl:justify-start w-full transition-colors duration-150 ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`}>
                  <Icon size={15} className="shrink-0" />
                  <span className="lg:hidden xl:inline">{label}</span>
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-yellow-400 lg:block xl:hidden" aria-hidden="true" />
                  )}
                  {hasUnread && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-yellow-400 lg:hidden xl:block" aria-hidden="true" />
                  )}
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        className="ml-auto lg:hidden xl:block"
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ChevronRight size={12} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 lg:px-2 xl:px-3 pb-6">
        <form action={logoutAction}>
          <button
            type="submit"
            title="Keluar"
            className="w-full flex items-center gap-3 lg:justify-center xl:justify-start px-3 lg:px-0 xl:px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={15} className="shrink-0" />
            <span className="lg:hidden xl:inline">Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
