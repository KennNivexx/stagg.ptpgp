"use client";

import Link from "next/link";
import {
  ChevronRight, Wrench, ArrowLeft,
  Megaphone, FileText, Newspaper, ScrollText, Bot, FolderOpen, Shield,
  Tags, BookMarked, AlertOctagon, Smile, DoorOpen, Search, Handshake,
  LayoutTemplate,
} from "lucide-react";

// Icons are resolved from a name here (inside this "use client" module)
// rather than accepting a component reference as a prop — passing a raw
// component type from a Server Component page into a Client Component
// prop relies on undefined RSC serialization behavior and breaks
// unpredictably per-route under Turbopack (fails for icons not already
// present in that route's client chunk, e.g. Megaphone on /announcements).
const ICONS = {
  Megaphone, FileText, Newspaper, ScrollText, Bot, FolderOpen, Shield,
  Tags, BookMarked, AlertOctagon, Smile, DoorOpen, Search, Handshake,
  LayoutTemplate,
} as const;

export type ModuleComingSoonIconName = keyof typeof ICONS;

interface Feature {
  label: string;
  description?: string;
}

interface ModuleComingSoonProps {
  /** Halaman title */
  title: string;
  /** Deskripsi singkat modul */
  description: string;
  /** Nama lucide icon untuk modul ini */
  icon: ModuleComingSoonIconName;
  /** Warna tema — mapped ke Tailwind class set */
  color?: "blue" | "emerald" | "amber" | "purple" | "rose" | "indigo" | "teal" | "orange" | "cyan" | "pink";
  /** Domain / section label (misal: "Employee Communication") */
  domain?: string;
  /** Fitur-fitur yang akan hadir */
  features?: Feature[];
  /** Breadcrumb back link */
  backHref?: string;
  backLabel?: string;
}

// Brand palette is red + neutral black/white only — every module shares the
// same pgp-red theme regardless of which color key a page passes in.
const RED_THEME = {
  iconBg: "bg-red-50", iconText: "text-pgp-red", badge: "bg-red-50", badgeText: "text-pgp-red",
  dotBg: "bg-pgp-red", featureIcon: "text-pgp-red", btnBg: "bg-pgp-red", btnHover: "hover:bg-pgp-red-hover",
};
const COLOR_THEMES: Record<string, typeof RED_THEME> = new Proxy({}, { get: () => RED_THEME });

export default function ModuleComingSoon({
  title,
  description,
  icon,
  color = "blue",
  domain,
  features = [],
  backHref = "/hrd/relations",
  backLabel = "Employee Relations",
}: ModuleComingSoonProps) {
  const c = COLOR_THEMES[color] ?? COLOR_THEMES.blue;
  const Icon = ICONS[icon];

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/hrd/relations" className="hover:text-slate-700 transition-colors">
          Employee Relations
        </Link>
        {backHref !== "/hrd/relations" && (
          <>
            <ChevronRight size={12} />
            <Link href={backHref} className="hover:text-slate-700 transition-colors">
              {backLabel}
            </Link>
          </>
        )}
        <ChevronRight size={12} />
        <span className="text-slate-600 font-medium">{title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className={`p-3 rounded-2xl shrink-0 ${c.iconBg}`}>
          <Icon size={28} className={c.iconText} />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#1A2530]">{title}</h1>
            {domain && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${c.badge} ${c.badgeText}`}>
                {domain}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Decorative header strip */}
        <div className="h-1.5 w-full bg-pgp-red" />

        <div className="p-8 md:p-12 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className={`w-24 h-24 rounded-3xl flex items-center justify-center ${c.iconBg}`}>
              <Icon size={44} className={`${c.iconText} opacity-80`} />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Wrench size={14} className="text-slate-400" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed mb-6">
            Modul ini sedang dalam tahap pengembangan aktif dan akan segera tersedia.
            Fungsionalitas penuh akan diluncurkan dalam pembaruan berikutnya.
          </p>

          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${c.badge} ${c.badgeText} mb-8`}>
            <span className={`h-1.5 w-1.5 rounded-full ${c.dotBg} animate-pulse`} />
            Dalam Pengembangan — Smart Productive LinkPro®
          </div>

          <Link
            href="/hrd/relations"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={13} /> Kembali ke Employee Relations
          </Link>
        </div>

        {/* Features list */}
        {features.length > 0 && (
          <div className="border-t border-slate-100 px-8 py-6 md:px-12">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
              Fitur yang akan hadir
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f) => (
                <div key={f.label} className="flex items-start gap-2.5 group">
                  <div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${c.dotBg}`} />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{f.label}</p>
                    {f.description && (
                      <p className="text-[10px] text-slate-400 leading-relaxed">{f.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SPLP module note */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-start gap-3">
        <div className="p-2 bg-white border border-slate-200 rounded-xl shrink-0">
          <Wrench size={14} className="text-slate-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700 mb-0.5">Catatan Arsitektur SPLP</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Modul ini adalah bagian dari <strong>Employee Relations &amp; Employee Experience Management Engine</strong>{" "}
            dalam arsitektur Smart Productive LinkPro®. Data pada modul ini tidak mengubah master data
            dari modul lain — prinsip <em>Single Source of Truth (SSOT)</em> tetap terjaga.
          </p>
        </div>
      </div>
    </div>
  );
}
