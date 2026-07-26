import Link from "next/link";
import {
  Heart, MessageSquare, Users, Briefcase, Scale, LogOut,
  AlertCircle, TrendingUp, CheckCircle2, Clock, Sparkles,
  ChevronRight, Shield, Megaphone, ClipboardList, BarChart3,
  Brain, FileWarning, Handshake, ArrowRightLeft, Plus,
} from "lucide-react";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";
import { supabaseAdmin } from "@/lib/supabase";
import { HrdPageHeader, HrdActionButton } from "@/components/hrd/HrdUi";

export const dynamic = "force-dynamic";

// ─── Domain cards config ──────────────────────────────────────────────────────
const DOMAINS = [
  {
    id: "communication",
    icon: Megaphone,
    label: "Employee Communication",
    desc: "Pengumuman, memo, berita, distribusi kebijakan, dan surat edaran perusahaan.",
    color: "blue",
    href: "/hrd/relations/communication/announcements",
    badge: null,
  },
  {
    id: "participation",
    icon: Users,
    label: "Employee Participation",
    desc: "Suggestion system, inovasi, Voice of Employee, survei, polling, dan feedback.",
    color: "emerald",
    href: "/hrd/relations/participation/suggestions",
    badge: null,
  },
  {
    id: "cases",
    icon: ClipboardList,
    label: "Employee Case Management",
    desc: "Complaint, grievance, ethics violation, fraud, harassment, investigation, corrective action.",
    color: "amber",
    href: "/hrd/relations/cases",
    badge: "Inti",
  },
  {
    id: "industrial",
    icon: Scale,
    label: "Industrial Relations",
    desc: "Labour union, bipartite/tripartite meeting, negosiasi, mediasi, PHI, dan kepatuhan industrial.",
    color: "purple",
    href: "/hrd/relations/industrial/union",
    badge: null,
  },
  {
    id: "separation",
    icon: ArrowRightLeft,
    label: "Employee Separation",
    desc: "Resignation, retirement, end of contract, termination, exit interview, dan analisis pemisahan.",
    color: "rose",
    href: "/hrd/relations/resignations",
    badge: null,
  },
];

const COLOR_MAP: Record<string, { bg: string; iconBg: string; text: string; border: string; badgeBg: string }> = {
  blue:    { bg: "bg-blue-50/60",    iconBg: "bg-blue-100",    text: "text-blue-600",    border: "border-blue-100",    badgeBg: "bg-blue-100 text-blue-700" },
  emerald: { bg: "bg-emerald-50/60", iconBg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-100", badgeBg: "bg-emerald-100 text-emerald-700" },
  amber:   { bg: "bg-amber-50/60",   iconBg: "bg-amber-100",   text: "text-amber-600",   border: "border-amber-100",   badgeBg: "bg-amber-100 text-amber-700" },
  purple:  { bg: "bg-purple-50/60",  iconBg: "bg-purple-100",  text: "text-purple-600",  border: "border-purple-100",  badgeBg: "bg-purple-100 text-purple-700" },
  rose:    { bg: "bg-rose-50/60",    iconBg: "bg-rose-100",    text: "text-rose-600",    border: "border-rose-100",    badgeBg: "bg-rose-100 text-rose-700" },
};

// ─── Quick Access shortcuts ───────────────────────────────────────────────────
const SHORTCUTS = [
  { href: "/hrd/relations/cases",               label: "Semua Kasus",             icon: ClipboardList,  color: "amber" },
  { href: "/hrd/relations/approval/complaint",  label: "Complaint Approval",       icon: CheckCircle2,   color: "emerald" },
  { href: "/hrd/relations/analytics/executive", label: "Executive Dashboard",      icon: BarChart3,      color: "blue" },
  { href: "/hrd/relations/ai",                  label: "AI ER Engine",             icon: Brain,          color: "purple" },
  { href: "/hrd/relations/warnings",            label: "Surat Peringatan",         icon: FileWarning,    color: "rose" },
  { href: "/hrd/relations/industrial/bipartite",label: "Bipartite Meeting",        icon: Handshake,      color: "indigo" },
];

const SHORTCUT_COLORS: Record<string, { bg: string; text: string }> = {
  amber:   { bg: "bg-amber-50",   text: "text-amber-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  blue:    { bg: "bg-blue-50",    text: "text-blue-600" },
  purple:  { bg: "bg-purple-50",  text: "text-purple-600" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-600" },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600" },
};

export default async function EmployeeRelationsHub() {
  // ── Fetch stats from existing tables ────────────────────────────────────────
  const [
    { count: totalEmployees },
    { data: complaints, count: totalComplaints },
    { data: warnings },
    { data: resignations },
  ] = await Promise.all([
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }).neq("status", "Resigned"),
    Promise.resolve(
      // keluhan/pengunduran_diri.employee_id has no real FK to karyawan (it's
      // pengguna.id, per this app's dual-id-space pattern) — a PostgREST
      // embed like "karyawan(full_name)" can't resolve without a declared FK
      // and would fail silently under the .catch() below. Both tables already
      // store employee_name/department as plain columns, so no join needed.
      supabaseAdmin.from("keluhan").select("*", { count: "exact" })
        .order("created_at", { ascending: false }).limit(5)
    ).catch(() => ({ data: [], count: 0 })),
    Promise.resolve(
      supabaseAdmin.from("surat_peringatan").select("*").eq("status", "Aktif")
        .order("created_at", { ascending: false }).limit(5)
    ).catch(() => ({ data: [] })),
    Promise.resolve(
      supabaseAdmin.from("pengunduran_diri").select("*")
        .order("created_at", { ascending: false }).limit(5)
    ).catch(() => ({ data: [] })),
  ]);

  const openCases = (complaints ?? []).filter(
    (c: Record<string, unknown>) => c.status !== "Closed" && c.status !== "Resolved"
  ).length;

  const activeWarnings = (warnings ?? []).length;

  const pendingResignations = (resignations ?? []).filter(
    (r: Record<string, unknown>) => r.status === "Pending" || r.status === "Menunggu"
  ).length;

  // ── Recent activity feed (merged from available data) ───────────────────────
  const recentActivity = [
    ...((complaints ?? []).slice(0, 3).map((c: Record<string, unknown>) => ({
      type: "complaint" as const,
      label: (c.employee_name as string) || "Karyawan",
      sub: c.category as string ?? "Complaint baru",
      status: c.status as string ?? "Open",
      date: c.created_at as string,
    }))),
    ...((warnings ?? []).slice(0, 2).map((w: Record<string, unknown>) => ({
      type: "warning" as const,
      label: w.employee_name as string ?? "Karyawan",
      sub: `Surat Peringatan ${w.sp_level as string}`,
      status: w.status as string ?? "Aktif",
      date: w.created_at as string,
    }))),
  ]
    .filter((a) => a.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const fmt = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <HrdPageHeader
        title="Employee Relations"
        subtitle="Business Engine — Employee Relations & Employee Experience Management · Smart Productive LinkPro®"
      >
        <HrdActionButton href="/hrd/relations/cases/new" icon={<Plus size={14} />} variant="primary">Catat Kasus</HrdActionButton>
      </HrdPageHeader>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Complaint",    value: totalComplaints ?? 0, icon: MessageSquare, color: "bg-blue-50 text-blue-600",    sub: "kasus terdaftar" },
          { label: "Kasus Terbuka",      value: openCases,             icon: AlertCircle,   color: "bg-amber-50 text-amber-600",  sub: "menunggu penyelesaian" },
          { label: "SP Aktif",           value: activeWarnings,        icon: FileWarning,   color: "bg-rose-50 text-rose-600",    sub: "surat peringatan" },
          { label: "Pending Resign",     value: pendingResignations,   icon: LogOut,        color: "bg-orange-50 text-orange-600",sub: "permohonan aktif" },
          { label: "Engagement Index",   value: "—",                   icon: TrendingUp,    color: "bg-emerald-50 text-emerald-600", sub: "belum disurvei" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${kpi.color}`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-extrabold text-slate-800">{kpi.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── 5 Domain Cards ── */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Lima Domain Utama
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {DOMAINS.map((domain) => {
            const Icon = domain.icon;
            const c = COLOR_MAP[domain.color] ?? COLOR_MAP.blue;
            return (
              <Link
                key={domain.id}
                href={domain.href}
                className={`relative flex flex-col gap-3 p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all group ${c.bg} ${c.border}`}
              >
                {domain.badge && (
                  <span className={`absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full ${c.badgeBg}`}>
                    {domain.badge}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg} ${c.text}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">{domain.label}</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-1">{domain.desc}</p>
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-semibold mt-auto ${c.text}`}>
                  Kelola <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Quick Access ── */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Akses Cepat
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon;
            const c = SHORTCUT_COLORS[s.color] ?? SHORTCUT_COLORS.blue;
            return (
              <Link
                key={s.href}
                href={s.href}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-center group"
              >
                <div className={`p-2.5 rounded-xl ${c.bg} ${c.text}`}>
                  <Icon size={16} />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 leading-tight">{s.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom 2-col: Recent Activity + AI Insight ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Aktivitas Terbaru</h3>
              <p className="text-xs text-slate-400 mt-0.5">Complaint &amp; surat peringatan terkini</p>
            </div>
            <Link href="/hrd/relations/cases" className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1">
              Lihat semua <ChevronRight size={12} />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-slate-50 rounded-2xl mb-3">
                <Heart size={28} className="text-slate-300" />
              </div>
              <p className="text-xs font-semibold text-slate-500">Belum ada aktivitas</p>
              <p className="text-[11px] text-slate-400 mt-1">Kasus dan peringatan akan muncul di sini.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    a.type === "complaint" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {a.label.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{a.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{a.sub}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mb-0.5 ${
                      a.status === "Open" || a.status === "Aktif"
                        ? "bg-amber-50 text-amber-700"
                        : a.status === "Closed" || a.status === "Resolved"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {a.status}
                    </span>
                    <p className="text-[10px] text-slate-400">{fmt(a.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Insight Preview */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Brain size={16} className="text-purple-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">AI ER Engine</p>
                <p className="text-[10px] text-slate-400">Smart Productive LinkPro®</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              {[
                { label: "Employee Risk Score", value: "Rendah", color: "text-emerald-400", bar: "bg-emerald-400", pct: 25 },
                { label: "Retention Risk",      value: "Sedang", color: "text-amber-400",   bar: "bg-amber-400",   pct: 48 },
                { label: "Engagement Index",    value: "—",      color: "text-slate-500",   bar: "bg-slate-600",   pct: 0 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] text-slate-400">{item.label}</p>
                    <p className={`text-[10px] font-bold ${item.color}`}>{item.value}</p>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.bar} transition-all`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-700/50 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-2">
                <Sparkles size={12} className="text-purple-300 mt-0.5 shrink-0" />
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  AI Engine membutuhkan data engagement survey untuk menghasilkan insight yang akurat.
                  Mulai dengan Employee Survey perdana.
                </p>
              </div>
            </div>

            <Link
              href="/hrd/relations/ai"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors"
            >
              <Brain size={13} /> Buka AI Engine
            </Link>
          </div>
        </div>
      </div>

      {/* ── All sub-menu quick links ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Semua Sub-Modul Employee Relations
        </h2>
        <SectionQuickLinks groupLabel="Employee Relations" excludeHref="/hrd/relations" />
      </div>

    </div>
  );
}
