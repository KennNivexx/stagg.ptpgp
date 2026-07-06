import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import {
  Users,
  Briefcase,
  CalendarCheck,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  GraduationCap,
  Building2,
  Clock,
  UserCog,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";

// Force dynamic rendering — every request re-fetches fresh data from Supabase
// instead of Next.js serving a statically cached copy of this dashboard.
export const dynamic = "force-dynamic";

const iconColorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
  teal: { bg: "bg-teal-50", text: "text-teal-600" },
};

function QuickCard({
  icon: Icon, title, desc, href, color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string; desc: string; href: string; color: string;
}) {
  const c = iconColorMap[color] || iconColorMap.blue;
  return (
    <Link href={href} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-slate-200 transition-all group">
      <div className="flex items-start gap-4">
        <div className={`p-3 ${c.bg} ${c.text} rounded-xl shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">{desc}</p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#CC0000] group-hover:gap-2 transition-all">
            Buka <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatMiniCard({
  icon: Icon, label, value, color, tooltip, trend, suffix,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string; value: number; color: string; tooltip?: string; suffix?: string;
  trend?: { direction: "up" | "down"; percentage: number };
}) {
  const c = iconColorMap[color] || iconColorMap.blue;
  return (
    <div title={tooltip} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 ${c.bg} ${c.text} rounded-xl shrink-0`}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${trend.direction === "up" ? "text-emerald-600" : "text-red-600"}`}>
            {trend.direction === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.percentage}%
          </span>
        )}
      </div>
      <p className="text-xl font-extrabold text-slate-800 leading-tight">{value}{suffix}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase leading-snug mt-1">{label}</p>
    </div>
  );
}

const BAR_CHART_MAX_BARS = 12;

function BarChart({ data }: { data: { label: string; sublabel?: string; value: number }[] }) {
  const displayData = data.length > BAR_CHART_MAX_BARS ? data.slice(-BAR_CHART_MAX_BARS) : data;

  // Ceil to the nearest whole unit so a small max (e.g. 3) still gets clean,
  // non-repeating gridline labels instead of duplicate rounded fractions.
  const yMax = Math.max(Math.ceil(Math.max(...displayData.map((d) => d.value), 0)), 1);
  const BAR_H = 120;
  const BAR_W = 32;
  const GAP = 14;
  const PADDING_LEFT = 28;
  const totalW = PADDING_LEFT + displayData.length * (BAR_W + GAP) - GAP + 10;

  return (
    <div className="max-h-[180px] w-full text-[#CC0000]">
      <svg
        viewBox={`0 0 ${totalW} ${BAR_H + 52}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden
      >
        {/* y-axis gridlines — skip a label when rounding would repeat the previous one */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i, arr) => {
          const y = BAR_H - frac * BAR_H;
          const val = Math.round(frac * yMax);
          const prevVal = i > 0 ? Math.round(arr[i - 1] * yMax) : null;
          const showLabel = val !== prevVal;
          return (
            <g key={frac}>
              <line x1={PADDING_LEFT - 4} y1={y} x2={totalW - 6} y2={y} stroke="#f1f5f9" strokeWidth={1} />
              {showLabel && (
                <text x={PADDING_LEFT - 6} y={y + 4} textAnchor="end" fontSize={8} fill="#cbd5e1">{val}</text>
              )}
            </g>
          );
        })}
        {displayData.map((d, i) => {
          const barH = Math.max((d.value / yMax) * BAR_H, d.value > 0 ? 4 : 2);
          const x = PADDING_LEFT + i * (BAR_W + GAP);
          const y = BAR_H - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={BAR_W} height={barH} fill="currentColor" rx={4}
                opacity={d.value === 0 ? 0.15 : 0.85} />
              {d.value > 0 && (
                <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="currentColor" fontWeight="700">
                  {d.value}
                </text>
              )}
              <text x={x + BAR_W / 2} y={BAR_H + 14} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="600">
                {d.label}
              </text>
              {d.sublabel && (
                <text x={x + BAR_W / 2} y={BAR_H + 26} textAnchor="middle" fontSize={8} fill="#94a3b8">
                  {d.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function HorizontalBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{d.label}</span>
            <span className="text-xs font-extrabold text-slate-800 ml-2">{d.value}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const R = 52;
  const CX = 64;
  const CY = 64;
  const strokeW = 20;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = total === 0 ? 0 : seg.value / total;
    const dash = pct * circumference;
    const arc = { ...seg, dash, offset: offset * circumference };
    offset += pct;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 128 128" className="w-28 h-28 shrink-0" aria-hidden>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
        {total === 0 ? (
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} />
        ) : arcs.map((arc, i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={arc.color} strokeWidth={strokeW}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={circumference / 4 - arc.offset}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        ))}
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize={18} fontWeight="800" fill="#1e293b">{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Total</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-slate-600 flex-1">{seg.label}</span>
            <span className="text-xs font-extrabold text-slate-800">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PERIOD_OPTIONS = [
  { key: "7d", label: "7 Hari" },
  { key: "30d", label: "30 Hari" },
  { key: "month", label: "Bulan Ini" },
  { key: "quarter", label: "Kuartal Ini" },
] as const;
type PeriodKey = typeof PERIOD_OPTIONS[number]["key"];

function getPeriodRange(period: PeriodKey, now: Date) {
  const end = new Date(now);
  let start: Date;

  if (period === "30d") {
    start = new Date(now); start.setDate(start.getDate() - 29);
  } else if (period === "month") {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "quarter") {
    const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
    start = new Date(now.getFullYear(), qStartMonth, 1);
  } else {
    start = new Date(now); start.setDate(start.getDate() - 6);
  }

  // Auto-switch to weekly buckets once the range spans more than two weeks —
  // otherwise a day-by-day chart over 30+ days renders dozens of illegibly
  // thin, overlapping bars.
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  const bucket: "day" | "week" = spanDays > 14 ? "week" : "day";

  return { start, end, bucket };
}

function getDayBuckets(start: Date, end: Date) {
  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push({
      date: cursor.toISOString().split("T")[0],
      label: cursor.toLocaleDateString("id-ID", { weekday: "short" }),
      sublabel: `${cursor.getDate()}/${cursor.getMonth() + 1}`,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function getWeekBuckets(start: Date, end: Date) {
  const weeks: { startDate: string; endDate: string; label: string; sublabel?: string }[] = [];
  const cursor = new Date(start);
  let weekNum = 1;
  while (cursor <= end) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > end) weekEnd.setTime(end.getTime());
    weeks.push({
      startDate: weekStart.toISOString().split("T")[0],
      endDate: weekEnd.toISOString().split("T")[0],
      label: `M${weekNum}`,
    });
    cursor.setDate(cursor.getDate() + 7);
    weekNum++;
  }
  return weeks;
}

const DEPT_COLORS = ["#CC0000", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

import { requireRole } from "@/lib/auth-guard";

export default async function HRDDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireRole("hrd", "superadmin");
  const userName = user.name || "HRD";

  const { range } = await searchParams;
  const period: PeriodKey = PERIOD_OPTIONS.some((p) => p.key === range) ? (range as PeriodKey) : "7d";

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentDateStr = now.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const { start: periodStart, end: periodEnd, bucket } = getPeriodRange(period, now);
  const periodStartStr = periodStart.toISOString().split("T")[0];
  const periodEndStr = periodEnd.toISOString().split("T")[0];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fixed 7-day window for the "Hadir Hari Ini" trend, independent of the
  // period tab selected on the attendance chart below — otherwise switching
  // chart tabs would silently change this stat card's trend badge too.
  const trendWindowStart = new Date(now); trendWindowStart.setDate(trendWindowStart.getDate() - 6);
  const trendWindowStartStr = trendWindowStart.toISOString().split("T")[0];

  // Each query falls back to an empty/null result instead of rejecting, so one
  // bad table or network hiccup can't take down the whole dashboard render.
  const [
    { count: totalEmployees },
    { count: totalDepartments },
    { count: presentToday },
    { count: pendingRequests },
    { count: pendingLeaves },
    { count: activeJobs },
    { data: attendanceRaw },
    { data: trendAttendanceRaw },
    { data: employeesRaw },
    { data: leavesRaw },
    { data: applicantsRaw },
    { data: profileFieldsRaw },
  ] = await Promise.all([
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).neq("status", "Inactive").then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("departments").select("*", { count: "exact", head: true }).eq("level", 3).then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).not("check_in", "is", null).then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("workforce_requests").select("*", { count: "exact", head: true }).eq("status", "Pending").then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "Pending").then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("job_postings").select("*", { count: "exact", head: true }).eq("status", "Open").then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("attendance").select("date").gte("date", periodStartStr).lte("date", periodEndStr).not("check_in", "is", null).then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("attendance").select("date").gte("date", trendWindowStartStr).lte("date", today).not("check_in", "is", null).then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("employees").select("department").neq("status", "Inactive").then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("leave_requests").select("status").gte("created_at", monthStart).then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("applications").select("status").then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("employees").select("phone, address, nik, emergency_phone").neq("status", "Inactive").then((r) => r, () => ({ data: null })),
  ]);

  // Process attendance per bucket (day or week depending on selected period)
  const attendanceByDate: Record<string, number> = {};
  (attendanceRaw || []).forEach((r) => {
    if (r.date) attendanceByDate[r.date] = (attendanceByDate[r.date] || 0) + 1;
  });

  let attendanceChartData: { label: string; sublabel?: string; value: number }[];
  if (bucket === "week") {
    const weeks = getWeekBuckets(periodStart, periodEnd);
    attendanceChartData = weeks.map((w) => {
      let total = 0;
      Object.entries(attendanceByDate).forEach(([date, count]) => {
        if (date >= w.startDate && date <= w.endDate) total += count;
      });
      return { label: w.label, value: total };
    });
  } else {
    const days = getDayBuckets(periodStart, periodEnd);
    attendanceChartData = days.map((d) => ({
      label: d.label,
      sublabel: d.sublabel,
      value: attendanceByDate[d.date] || 0,
    }));
  }
  const attendanceChartTotalCount = attendanceChartData.length;
  const attendanceChartTruncated = attendanceChartTotalCount > BAR_CHART_MAX_BARS;

  // Trend for "Hadir Hari Ini": today's count vs the average of the last 7 days.
  // Uses its own fixed-window query (trendAttendanceRaw) rather than the
  // period-filtered attendanceByDate, so switching the chart's period tab
  // below doesn't silently change this stat card's trend.
  const trendByDate: Record<string, number> = {};
  (trendAttendanceRaw || []).forEach((r) => {
    if (r.date) trendByDate[r.date] = (trendByDate[r.date] || 0) + 1;
  });
  const todayCount = trendByDate[today] || 0;
  const otherDayCounts = Object.entries(trendByDate)
    .filter(([date]) => date !== today)
    .map(([, count]) => count);
  const otherAvg = otherDayCounts.length > 0 ? otherDayCounts.reduce((a, b) => a + b, 0) / otherDayCounts.length : 0;
  const attendanceTrend = otherAvg > 0
    ? { direction: (todayCount >= otherAvg ? "up" : "down") as "up" | "down", percentage: Math.round(Math.abs((todayCount - otherAvg) / otherAvg) * 100) }
    : undefined;

  // Process employees by department (top 6)
  const deptCount: Record<string, number> = {};
  (employeesRaw || []).forEach((e) => {
    if (e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1;
  });
  const deptChartData = Object.entries(deptCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({ label, value, color: DEPT_COLORS[i % DEPT_COLORS.length] }));

  // Process leave by status
  const leaveCount: Record<string, number> = { Pending: 0, Disetujui: 0, Ditolak: 0 };
  (leavesRaw || []).forEach((l) => {
    if (l.status && l.status in leaveCount) leaveCount[l.status]++;
  });
  const leaveTotal = Object.values(leaveCount).reduce((a, b) => a + b, 0);
  const leaveSegments = [
    { label: "Pending", value: leaveCount.Pending, color: "#f59e0b" },
    { label: "Disetujui", value: leaveCount.Disetujui, color: "#16a34a" },
    { label: "Ditolak", value: leaveCount.Ditolak, color: "#CC0000" },
  ];

  // Process applicants by status
  const appCount: Record<string, number> = {};
  (applicantsRaw || []).forEach((a) => {
    if (a.status) appCount[a.status] = (appCount[a.status] || 0) + 1;
  });
  const appChartData = Object.entries(appCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], i) => ({ label, value, color: DEPT_COLORS[i % DEPT_COLORS.length] }));

  // Self-service profile completeness: how many employees have filled in the
  // fields that only they can enter via /employee/profile (not HRD-entered).
  // `address` can still legitimately hold the legacy __auth__ JSON blob for
  // employees created before a users-table row existed — that's not a real
  // address, so it doesn't count as "filled in".
  const hasRealAddress = (raw: unknown) => {
    if (!raw || typeof raw !== "string") return false;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.__auth__) return !!parsed.home_address;
    } catch { /* plain text address */ }
    return true;
  };
  const profileFields = (profileFieldsRaw || []) as { phone?: string; address?: string; nik?: string; emergency_phone?: string }[];
  const completeProfiles = profileFields.filter((e) =>
    !!e.phone && hasRealAddress(e.address) && !!e.nik && !!e.emergency_phone
  ).length;
  const profileCompletionPct = profileFields.length > 0 ? Math.round((completeProfiles / profileFields.length) * 100) : 0;

  const quickAccess = [
    { icon: UserCog, title: "Profil Karyawan", desc: "Lihat data diri dan profil yang diisi oleh karyawan", href: "/hrd/employees", color: "blue" },
    { icon: Briefcase, title: "Rekrutmen", desc: "Lowongan, pelamar, dan hiring", href: "/hrd/recruitment", color: "emerald" },
    { icon: CalendarCheck, title: "Absensi & Cuti", desc: "Pantau kehadiran dan setujui cuti", href: "/hrd/attendance", color: "amber" },
    { icon: Wallet, title: "Payroll", desc: "Gaji, slip, dan komponen salary", href: "/hrd/payroll", color: "purple" },
    { icon: TrendingUp, title: "KPI & Performa", desc: "Penilaian kinerja karyawan", href: "/hrd/kpi", color: "red" },
    { icon: FileText, title: "Laporan", desc: "Rekap dan analisis data HR", href: "/hrd/reports", color: "indigo" },
    { icon: GraduationCap, title: "Pelatihan", desc: "Program training dan sertifikasi", href: "/hrd/learning", color: "teal" },
  ];

  const stats = [
    { label: "Total Karyawan", value: totalEmployees || 0, icon: Users, color: "blue", tooltip: "Jumlah seluruh karyawan aktif" },
    { label: "Total Departemen", value: totalDepartments || 0, icon: Building2, color: "indigo", tooltip: "Jumlah departemen terdaftar" },
    { label: "Hadir Hari Ini", value: presentToday || 0, icon: CalendarCheck, color: "emerald", tooltip: "Karyawan hadir hari ini", trend: attendanceTrend },
    { label: "Permintaan Pending", value: pendingRequests || 0, icon: Clock, color: "amber", tooltip: "Permintaan tenaga kerja menunggu" },
    { label: "Cuti Pending", value: pendingLeaves || 0, icon: FileText, color: "red", tooltip: "Pengajuan cuti menunggu HRD" },
    { label: "Lowongan Aktif", value: activeJobs || 0, icon: Briefcase, color: "purple", tooltip: "Lowongan kerja yang dibuka" },
    { label: "Profil Lengkap", value: profileCompletionPct, suffix: "%", icon: UserCog, color: "teal", tooltip: `${completeProfiles} dari ${profileFields.length} karyawan sudah melengkapi profil sendiri` },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Selamat Datang, {userName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{currentDateStr}</p>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-2">Akses Cepat</h2>
        <p className="text-xs text-slate-400 mb-4">Klik untuk langsung ke halaman aksi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccess.map((item) => (
            <QuickCard key={item.href} {...item} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-4">Ringkasan Hari Ini</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatMiniCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-4">Grafik & Analitik</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Attendance chart with period filter */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Kehadiran Karyawan</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Jumlah karyawan yang check-in per {bucket === "week" ? "minggu" : "hari"}</p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                {PERIOD_OPTIONS.map((opt) => (
                  <Link
                    key={opt.key}
                    href={opt.key === "7d" ? "/hrd" : `/hrd?range=${opt.key}`}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                      period === opt.key ? "bg-white shadow-sm text-[#CC0000]" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
            <BarChart data={attendanceChartData} />
            {attendanceChartTruncated && (
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Menampilkan {BAR_CHART_MAX_BARS} dari {attendanceChartTotalCount} {bucket === "week" ? "minggu" : "hari"} terbaru
              </p>
            )}
          </div>

          {/* Dept Distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Karyawan per Departemen</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Top departemen berdasarkan jumlah karyawan aktif</p>
            </div>
            {deptChartData.length === 0 ? (
              <EmptyState icon={Building2} title="Belum ada data departemen." className="border-none py-8" />
            ) : (
              <HorizontalBarChart data={deptChartData} />
            )}
          </div>

          {/* Leave Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Status Cuti Bulan Ini</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Distribusi status pengajuan cuti bulan berjalan</p>
            </div>
            {leaveTotal === 0 ? (
              <EmptyState icon={FileText} title="Belum ada pengajuan cuti bulan ini." className="border-none py-8" />
            ) : (
              <DonutChart segments={leaveSegments} total={leaveTotal} />
            )}
          </div>

          {/* Applicant Pipeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Pipeline Rekrutmen</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Jumlah pelamar berdasarkan status seleksi</p>
            </div>
            {appChartData.length === 0 ? (
              <EmptyState icon={Briefcase} title="Belum ada data pelamar." className="border-none py-8" />
            ) : (
              <HorizontalBarChart data={appChartData} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
