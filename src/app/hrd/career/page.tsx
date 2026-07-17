import Link from "next/link";
import {
  TrendingUp, Users, Target, Star, GitBranch,
  ArrowUp, BarChart2, Shield, BookOpen, Briefcase,
  ChevronRight, Rocket, Award, ClipboardList,
  UserCheck, RefreshCw, Settings, FileBarChart,
  Brain, Layers, Map, Zap, CheckCircle, Clock,
  ArrowRight, RotateCcw, AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

/* ─── Types ────────────────────────────────────────────────────── */
interface KpiCard {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  desc: string;
}

interface QuickGroup {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  items: { label: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }[];
}

/* ─── Color map ─────────────────────────────────────────────────── */
const COLOR: Record<string, { bg: string; text: string; border: string; pill: string }> = {
  fuchsia: { bg: "bg-fuchsia-50",  text: "text-fuchsia-600", border: "border-fuchsia-100", pill: "bg-fuchsia-100 text-fuchsia-700" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-600",  border: "border-violet-100",  pill: "bg-violet-100 text-violet-700"  },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", pill: "bg-emerald-100 text-emerald-700" },
  blue:    { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100",    pill: "bg-blue-100 text-blue-700"    },
  amber:   { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100",   pill: "bg-amber-100 text-amber-700"   },
  rose:    { bg: "bg-rose-50",    text: "text-rose-600",    border: "border-rose-100",    pill: "bg-rose-100 text-rose-700"    },
  indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600",  border: "border-indigo-100",  pill: "bg-indigo-100 text-indigo-700"  },
  teal:    { bg: "bg-teal-50",    text: "text-teal-600",    border: "border-teal-100",    pill: "bg-teal-100 text-teal-700"    },
  orange:  { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-100",  pill: "bg-orange-100 text-orange-700"  },
  slate:   { bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-200",   pill: "bg-slate-100 text-slate-700"   },
};

/* ─── Executive KPI data (static demo — replace with real queries) ─ */
const KPI_CARDS: KpiCard[] = [
  { label: "Ready for Promotion",   value: 125,    icon: ArrowUp,      color: "emerald", desc: "Karyawan siap dipromosikan" },
  { label: "High Potential",        value: 83,     icon: Star,         color: "fuchsia", desc: "9-Box high potential" },
  { label: "Critical Positions",    value: 12,     icon: AlertCircle,  color: "rose",    desc: "Posisi wajib ada suksesor" },
  { label: "Succession Readiness",  value: 91,     suffix: "%", icon: Shield,      color: "indigo", desc: "Kesiapan suksesor terisi" },
  { label: "Average Career Score",  value: "88.5", icon: Target,       color: "violet",  desc: "Rata-rata skor karier" },
  { label: "Promotion This Year",   value: 42,     icon: Rocket,       color: "blue",    desc: "Promosi terealisasi tahun ini" },
  { label: "Internal Mobility",     value: 38,     icon: RefreshCw,    color: "teal",    desc: "Perpindahan internal" },
  { label: "Avg. Time to Promotion",value: "3.8",  suffix: " Yr", icon: Clock, color: "amber", desc: "Rata-rata waktu promosi" },
];

/* ─── Career Engine Output cards ────────────────────────────────── */
const ENGINE_OUTPUTS = [
  { label: "Career Score",          color: "fuchsia", href: "/hrd/career/assessment",     icon: Target },
  { label: "Career Readiness",      color: "violet",  href: "/hrd/career/readiness",      icon: CheckCircle },
  { label: "Talent Classification", color: "rose",    href: "/hrd/career/9-box",          icon: Layers },
  { label: "Promotion Recommend",   color: "emerald", href: "/hrd/career/recommendation", icon: ArrowUp },
  { label: "Mutation Recommend",    color: "blue",    href: "/hrd/career/mutations",       icon: RefreshCw },
  { label: "IDP",                   color: "indigo",  href: "/hrd/career/plans",           icon: BookOpen },
  { label: "Salary Review",         color: "amber",   href: "/hrd/career/approval/salary", icon: Briefcase },
  { label: "Leadership Pipeline",   color: "teal",    href: "/hrd/career/talent/leadership-pipeline", icon: GitBranch },
];

/* ─── Quick access groups ───────────────────────────────────────── */
const QUICK_GROUPS: QuickGroup[] = [
  {
    title: "Master Data",
    icon: Settings,
    color: "slate",
    items: [
      { label: "Career Framework",      href: "/hrd/career/master/framework",          icon: Layers },
      { label: "Career Stream",         href: "/hrd/career/master/stream",             icon: GitBranch },
      { label: "Career Level",          href: "/hrd/career/master/level",              icon: BarChart2 },
      { label: "Career Path",           href: "/hrd/career/path",                      icon: Map },
      { label: "Promotion Policy",      href: "/hrd/career/master/promotion-policy",   icon: Shield },
      { label: "Career Score Formula",  href: "/hrd/career/master/score-formula",      icon: Target },
    ],
  },
  {
    title: "Talent Management",
    icon: Users,
    color: "fuchsia",
    items: [
      { label: "Talent Pool",           href: "/hrd/career/talent/pool",               icon: Users },
      { label: "Talent Review",         href: "/hrd/career/talent/review",             icon: UserCheck },
      { label: "9-Box Matrix",          href: "/hrd/career/9-box",                     icon: Layers },
      { label: "Critical Position",     href: "/hrd/succession/positions",             icon: AlertCircle },
      { label: "Successor Planning",    href: "/hrd/succession/candidates",            icon: GitBranch },
      { label: "Leadership Pipeline",   href: "/hrd/career/talent/leadership-pipeline", icon: TrendingUp },
    ],
  },
  {
    title: "Career Development",
    icon: TrendingUp,
    color: "violet",
    items: [
      { label: "Career Profile",        href: "/hrd/career/profile",                   icon: UserCheck },
      { label: "Career Assessment",     href: "/hrd/career/assessment",                icon: ClipboardList },
      { label: "Career Readiness",      href: "/hrd/career/readiness",                 icon: CheckCircle },
      { label: "Career Recommendation", href: "/hrd/career/recommendation",            icon: Brain },
      { label: "IDP",                   href: "/hrd/career/plans",                     icon: BookOpen },
      { label: "Career Simulation",     href: "/hrd/career/simulation",                icon: Zap },
    ],
  },
  {
    title: "Transaksi Karier",
    icon: ArrowRight,
    color: "emerald",
    items: [
      { label: "Promosi",               href: "/hrd/career/transactions/promotion",    icon: ArrowUp },
      { label: "Mutasi",                href: "/hrd/career/mutations",                 icon: RefreshCw },
      { label: "Rotasi",                href: "/hrd/career/transactions/rotation",     icon: RotateCcw },
      { label: "Demosi",                href: "/hrd/career/transactions/demotion",     icon: ArrowRight },
      { label: "Acting Assignment",     href: "/hrd/career/transactions/acting",       icon: Award },
      { label: "Succession Assignment", href: "/hrd/career/transactions/succession",   icon: GitBranch },
    ],
  },
  {
    title: "Approval",
    icon: CheckCircle,
    color: "blue",
    items: [
      { label: "Promotion Approval",    href: "/hrd/career/approval/promotion",        icon: ArrowUp },
      { label: "Mutation Approval",     href: "/hrd/career/approval/mutation",         icon: RefreshCw },
      { label: "Salary Approval",       href: "/hrd/career/approval/salary",           icon: Briefcase },
      { label: "Succession Approval",   href: "/hrd/career/approval/succession",       icon: GitBranch },
      { label: "Career Committee",      href: "/hrd/career/approval/committee",        icon: Users },
    ],
  },
  {
    title: "Report & Analytics",
    icon: FileBarChart,
    color: "indigo",
    items: [
      { label: "Executive Dashboard",   href: "/hrd/career/analytics",                 icon: BarChart2 },
      { label: "Promotion Report",      href: "/hrd/career/analytics",                 icon: ArrowUp },
      { label: "Talent Report",         href: "/hrd/career/analytics",                 icon: Star },
      { label: "Succession Report",     href: "/hrd/career/analytics",                 icon: GitBranch },
      { label: "Career KPI",            href: "/hrd/career/analytics",                 icon: Target },
      { label: "Salary Projection",     href: "/hrd/career/approval/salary",           icon: TrendingUp },
    ],
  },
];

/* ─── Business Process flow ─────────────────────────────────────── */
const FLOW_STEPS = [
  { label: "Business Process",    sub: "Enterprise foundation" },
  { label: "Job Architecture",    sub: "Family, grade, salary band" },
  { label: "Position Management", sub: "Formasi & reporting line" },
  { label: "Employee 360°",       sub: "Data terpadu karyawan" },
  { label: "Career Dev Engine",   sub: "Score · Review · Succession" },
  { label: "AI Recommendation",   sub: "Promosi · Mutasi · IDP" },
];

/* ─── Score components ──────────────────────────────────────────── */
const SCORE_COMPONENTS = [
  { label: "Performance",     pct: 25, color: "bg-fuchsia-500" },
  { label: "Competency",      pct: 20, color: "bg-violet-500" },
  { label: "Skills",          pct: 10, color: "bg-blue-500" },
  { label: "Leadership",      pct: 10, color: "bg-indigo-500" },
  { label: "Learning",        pct: 10, color: "bg-teal-500" },
  { label: "Attendance",      pct:  5, color: "bg-emerald-500" },
  { label: "Discipline",      pct:  5, color: "bg-green-500" },
  { label: "Innovation",      pct:  5, color: "bg-amber-500" },
  { label: "Experience",      pct:  5, color: "bg-orange-500" },
  { label: "Assess. Center",  pct:  5, color: "bg-rose-500" },
];

/* ─── Sub-components ────────────────────────────────────────────── */
function KpiCardUI({ card }: { card: KpiCard }) {
  const c = COLOR[card.color] || COLOR.slate;
  const Icon = card.icon;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} shadow-sm p-5 flex flex-col gap-2`}>
      <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={c.text} />
      </div>
      <p className="text-2xl font-extrabold text-slate-800 leading-tight">
        {card.value}{card.suffix && <span className="text-base font-bold text-slate-400">{card.suffix}</span>}
      </p>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{card.label}</p>
      <p className="text-[10px] text-slate-400">{card.desc}</p>
    </div>
  );
}

function QuickGroupCard({ group }: { group: QuickGroup }) {
  const c = COLOR[group.color] || COLOR.slate;
  const GroupIcon = group.icon;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 flex items-center gap-3 border-b ${c.border} ${c.bg}`}>
        <div className={`p-2 rounded-xl bg-white/70 ${c.text} shrink-0`}>
          <GroupIcon size={16} />
        </div>
        <h3 className={`text-xs font-extrabold uppercase tracking-wider ${c.text}`}>{group.title}</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {group.items.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link
              key={`${group.title}-${item.label}`}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors group"
            >
              <ItemIcon size={13} className="text-slate-400 shrink-0 group-hover:text-slate-600 transition-colors" />
              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors flex-1 truncate">
                {item.label}
              </span>
              <ChevronRight size={11} className="text-slate-300 shrink-0 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────── */
export default async function CareerDevelopmentPage() {
  return (
    <div className="space-y-8">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-fuchsia-600 via-violet-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                <Rocket size={20} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-fuchsia-200">
                Smart Productive LinkPro®
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1">
              Career Development &amp; Succession Management
            </h1>
            <p className="text-sm text-fuchsia-100 max-w-xl leading-relaxed">
              Sistem pengembangan karier objektif, transparan, dan terintegrasi berdasarkan kompetensi,
              kinerja, potensi, serta kebutuhan organisasi.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-right text-xs font-semibold text-fuchsia-100 shrink-0">
            <span className="flex items-center gap-1.5 justify-end">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Career Engine Active
            </span>
            <span className="flex items-center gap-1.5 justify-end">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              AI Recommendation Ready
            </span>
          </div>
        </div>
      </div>

      {/* ── Executive KPI ────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-extrabold text-slate-800 mb-1">Executive Dashboard</h2>
        <p className="text-xs text-slate-400 mb-4">Ringkasan indikator utama pengembangan karier &amp; suksesi</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map((card) => (
            <KpiCardUI key={card.label} card={card} />
          ))}
        </div>
      </div>

      {/* ── Business Process Flow ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-extrabold text-slate-800 mb-1">Enterprise Business Process</h2>
        <p className="text-xs text-slate-400 mb-5">Alur integrasi dari business process hingga AI recommendation</p>
        <div className="flex flex-wrap items-center gap-2">
          {FLOW_STEPS.map((step, idx) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className={`rounded-xl px-4 py-3 text-center min-w-[110px] ${
                idx === 4 ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-200" :
                idx === 5 ? "bg-violet-600 text-white shadow-md shadow-violet-200" :
                "bg-slate-50 border border-slate-100 text-slate-700"
              }`}>
                <p className="text-[11px] font-extrabold leading-tight">{step.label}</p>
                <p className={`text-[9px] mt-0.5 ${idx >= 4 ? "text-fuchsia-100" : "text-slate-400"}`}>{step.sub}</p>
              </div>
              {idx < FLOW_STEPS.length - 1 && (
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Career Score Formula ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-800 mb-0.5">Career Score Formula</h2>
            <p className="text-xs text-slate-400">Bobot penilaian terkonfigurasi — contoh hasil: <span className="font-bold text-fuchsia-600">92.45</span></p>
          </div>
          <Link
            href="/hrd/career/master/score-formula"
            className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1 transition-colors"
          >
            Konfigurasi <ChevronRight size={12} />
          </Link>
        </div>
        <div className="space-y-2.5">
          {SCORE_COMPONENTS.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="w-28 text-[11px] font-semibold text-slate-600 shrink-0">{item.label}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.pct * 4}%` }}
                />
              </div>
              <span className="w-8 text-right text-[11px] font-bold text-slate-500 shrink-0">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Career Engine Output ─────────────────────────────────── */}
      <div>
        <h2 className="text-base font-extrabold text-slate-800 mb-1">Career Engine Output</h2>
        <p className="text-xs text-slate-400 mb-4">Rekomendasi &amp; keputusan strategis yang dihasilkan sistem secara otomatis</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ENGINE_OUTPUTS.map((item) => {
            const c = COLOR[item.color] || COLOR.slate;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 p-4 rounded-xl border ${c.border} ${c.bg} hover:shadow-sm transition-all group`}
              >
                <Icon size={16} className={`${c.text} shrink-0`} />
                <span className={`text-xs font-bold ${c.text} group-hover:underline`}>{item.label}</span>
                <ChevronRight size={11} className={`${c.text} ml-auto shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Quick Access Groups ──────────────────────────────────── */}
      <div>
        <h2 className="text-base font-extrabold text-slate-800 mb-1">Navigasi Modul</h2>
        <p className="text-xs text-slate-400 mb-4">Akses cepat ke seluruh sub-modul Career Development</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {QUICK_GROUPS.map((group) => (
            <QuickGroupCard key={group.title} group={group} />
          ))}
        </div>
      </div>

      {/* ── Integration note ─────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-slate-200/60 rounded-xl shrink-0">
            <Layers size={18} className="text-slate-600" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 mb-1">Single Source of Truth</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Career Development tidak menyimpan data master yang telah dimiliki modul lain.
              Seluruh informasi ditarik dari <strong>Organization Design, Job Architecture, Position Management,
              Employee 360°, Performance, Competency, Learning, Time, Reward, Project Management,</strong> dan{" "}
              <strong>Assessment Center</strong> — sehingga setiap keputusan dapat ditelusuri kembali ke sumbernya
              dan tidak terjadi duplikasi data.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
