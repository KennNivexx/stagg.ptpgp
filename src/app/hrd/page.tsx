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
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  Timer,
  Award,
  UserMinus,
  Trophy,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import TrendArea from "@/components/charts/TrendArea";
import RankedBar from "@/components/charts/RankedBar";
import RadialGauge from "@/components/charts/RadialGauge";
import LiveClock from "@/components/hrd/LiveClock";
import Sparkline from "@/components/hrd/Sparkline";

// Force dynamic rendering — every request re-fetches fresh data from Supabase
// instead of Next.js serving a statically cached copy of this dashboard.
export const dynamic = "force-dynamic";

// Brand palette is red + neutral black/white only — icon badges no longer
// carry a per-item color key, they all render in the single pgp-red accent
// (the Proxy keeps every existing `color="..."` call site working
// unchanged regardless of which key it passes).
const iconColorMap: Record<string, { bg: string; text: string }> = new Proxy({}, {
  get: () => ({ bg: "bg-red-50", text: "text-pgp-red" }),
});

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
          <span className="inline-flex items-center gap-1 text-xs font-bold text-pgp-red group-hover:gap-2 transition-all">
            Buka <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatMiniCard({
  icon: Icon, label, value, color, tooltip, trend, suffix, sparklineValues,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string; value: number; color: string; tooltip?: string; suffix?: string;
  trend?: { direction: "up" | "down"; percentage: number };
  /** Real short time-series for the mini trend line — omitted (not
      fabricated) when no such series exists for this metric. */
  sparklineValues?: number[];
}) {
  const c = iconColorMap[color] || iconColorMap.blue;
  return (
    <div title={tooltip} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 ${c.bg} ${c.text} rounded-xl shrink-0`}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold shrink-0 ${trend.direction === "up" ? "text-[#1A2530]" : "text-pgp-red"}`}>
            {trend.direction === "up" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend.percentage}%
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xl font-extrabold text-slate-800 leading-tight">{value}{suffix}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase leading-snug mt-1">{label}</p>
        </div>
        {sparklineValues && sparklineValues.length >= 2 && (
          <Sparkline values={sparklineValues} positive={trend?.direction !== "down"} />
        )}
      </div>
    </div>
  );
}

const BAR_CHART_MAX_BARS = 12;

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

  const { start: periodStart, end: periodEnd, bucket } = getPeriodRange(period, now);
  const periodStartStr = periodStart.toISOString().split("T")[0];
  const periodEndStr = periodEnd.toISOString().split("T")[0];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fixed 7-day window for the "Hadir Hari Ini" trend, independent of the
  // period tab selected on the attendance chart below — otherwise switching
  // chart tabs would silently change this stat card's trend badge too.
  const trendWindowStart = new Date(now); trendWindowStart.setDate(trendWindowStart.getDate() - 6);
  const trendWindowStartStr = trendWindowStart.toISOString().split("T")[0];

  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Each query falls back to an empty/null result instead of rejecting, so one
  // bad table or network hiccup can't take down the whole dashboard render.
  const [
    { count: totalEmployees },
    { count: totalDepartments },
    { count: presentToday },
    { count: pendingRequests },
    { count: pendingLeaves },
    { count: activeJobs },
    { count: overtimeToday },
    { data: attendanceRaw },
    { data: trendAttendanceRaw },
    { data: employeesRaw },
    { data: leavesRaw },
    { data: applicantsRaw },
    { data: profileFieldsRaw },
    { data: kpiScoresRaw },
    { data: employeeDeptRaw },
    { data: headcountDatesRaw },
    { data: resignationsRaw },
  ] = await Promise.all([
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }).neq("status", "Inactive").then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("departemen").select("*", { count: "exact", head: true }).eq("level", 3).then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("absensi").select("*", { count: "exact", head: true }).eq("date", today).not("check_in", "is", null).then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("permintaan_sdm").select("*", { count: "exact", head: true }).eq("status", "Pending").then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("pengajuan_cuti").select("*", { count: "exact", head: true }).eq("status", "Pending").then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("lowongan_kerja").select("*", { count: "exact", head: true }).eq("status", "Open").then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("lembur").select("*", { count: "exact", head: true }).eq("tanggal", today).then((r) => r, () => ({ count: null })),
    supabaseAdmin.from("absensi").select("date").gte("date", periodStartStr).lte("date", periodEndStr).not("check_in", "is", null).then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("absensi").select("date").gte("date", trendWindowStartStr).lte("date", today).not("check_in", "is", null).then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("karyawan").select("department").neq("status", "Inactive").then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("pengajuan_cuti").select("status").gte("created_at", monthStart).then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("pelamar").select("status").then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("karyawan").select("phone, address, nik, emergency_phone").neq("status", "Inactive").then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("evaluasi_kpi").select("employee_id, final_score").like("period", `%/${now.getFullYear()}`).not("final_score", "is", null).then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("karyawan").select("id, department").neq("status", "Inactive").then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("karyawan").select("created_at").gte("created_at", sixMonthsAgo.toISOString()).then((r) => r, () => ({ data: null })),
    supabaseAdmin.from("pengunduran_diri").select("created_at, status").gte("created_at", yearStart).then((r) => r, () => ({ data: null })),
  ]);

  const { data: activityLogRaw } = await supabaseAdmin
    .from("audit_logs")
    .select("action, detail, performed_by_name, target_name, created_at")
    .order("created_at", { ascending: false })
    .limit(8)
    .then((r) => r, () => ({ data: null as { action: string; detail: string | null; performed_by_name: string | null; target_name: string | null; created_at: string }[] | null }));

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
  // Real 7-day series for the "Hadir Hari Ini" KPI card sparkline.
  const attendanceSparkline: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    attendanceSparkline.push(trendByDate[d.toISOString().split("T")[0]] || 0);
  }

  // Process employees by department (top 6)
  const deptCount: Record<string, number> = {};
  (employeesRaw || []).forEach((e) => {
    if (e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1;
  });
  const deptChartData = Object.entries(deptCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  // Process leave by status
  const leaveCount: Record<string, number> = { Pending: 0, Disetujui: 0, Ditolak: 0 };
  (leavesRaw || []).forEach((l) => {
    if (l.status && l.status in leaveCount) leaveCount[l.status]++;
  });
  const leaveTotal = Object.values(leaveCount).reduce((a, b) => a + b, 0);
  const leaveChartData = [
    { label: "Pending", value: leaveCount.Pending, color: "var(--chart-status-warning)" },
    { label: "Disetujui", value: leaveCount.Disetujui, color: "var(--chart-status-good)" },
    { label: "Ditolak", value: leaveCount.Ditolak, color: "var(--chart-status-critical)" },
  ];

  // Process applicants by status
  const appCount: Record<string, number> = {};
  (applicantsRaw || []).forEach((a) => {
    if (a.status) appCount[a.status] = (appCount[a.status] || 0) + 1;
  });
  const appChartData = Object.entries(appCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

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

  // Performance Score: average of this year's Final Score across all
  // evaluated employees (real data from evaluasi_kpi, not a placeholder).
  const kpiScores = (kpiScoresRaw || []) as { employee_id: string; final_score: number }[];
  const performanceScorePct = kpiScores.length > 0
    ? Math.round(kpiScores.reduce((sum, k) => sum + k.final_score, 0) / kpiScores.length)
    : 0;

  // Department Performance: average Final Score per department, joined
  // client-side since evaluasi_kpi.employee_id and karyawan.id share the
  // same ID space (karyawan!employee_id embed used elsewhere confirms this).
  const employeeDeptMap: Record<string, string> = {};
  (employeeDeptRaw || []).forEach((e) => {
    if (e.id && e.department) employeeDeptMap[e.id as string] = e.department as string;
  });
  const deptScoreAgg: Record<string, { sum: number; count: number }> = {};
  kpiScores.forEach((k) => {
    const dept = employeeDeptMap[k.employee_id];
    if (!dept) return;
    if (!deptScoreAgg[dept]) deptScoreAgg[dept] = { sum: 0, count: 0 };
    deptScoreAgg[dept].sum += k.final_score;
    deptScoreAgg[dept].count += 1;
  });
  const deptPerformance = Object.entries(deptScoreAgg)
    .map(([department, { sum, count }]) => ({ department, score: Math.round(sum / count) }))
    .sort((a, b) => b.score - a.score);
  const topDepartments = deptPerformance.slice(0, 5);
  const needAttentionDepartments = deptPerformance.filter((d) => d.score < 75).sort((a, b) => a.score - b.score).slice(0, 5);

  // Headcount Trend: active employees added per month, last 6 months —
  // a simple real cumulative-growth proxy from karyawan.created_at.
  const headcountMonths: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    headcountMonths.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("id-ID", { month: "short" }) });
  }
  const headcountByMonth: Record<string, number> = {};
  (headcountDatesRaw || []).forEach((r) => {
    if (!r.created_at) return;
    const d = new Date(r.created_at as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    headcountByMonth[key] = (headcountByMonth[key] || 0) + 1;
  });
  const headcountTrendData = headcountMonths.map((m) => ({ label: m.label, value: headcountByMonth[m.key] || 0 }));

  // Turnover Trend: approved resignations per month this year.
  const resignations = (resignationsRaw || []) as { created_at: string; status: string }[];
  const approvedResignations = resignations.filter((r) => ["Disetujui", "Approved"].includes(r.status));
  const turnoverMonths: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    turnoverMonths.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("id-ID", { month: "short" }) });
  }
  const turnoverByMonth: Record<string, number> = {};
  approvedResignations.forEach((r) => {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    turnoverByMonth[key] = (turnoverByMonth[key] || 0) + 1;
  });
  const turnoverTrendData = turnoverMonths.map((m) => ({ label: m.label, value: turnoverByMonth[m.key] || 0 }));
  const turnoverRatePct = (totalEmployees || 0) > 0
    ? Math.round((approvedResignations.length / (totalEmployees || 1)) * 1000) / 10
    : 0;

  // HR Health Score: honest composite of 3 real, already-computed metrics —
  // not a fabricated/AI-generated number, just a weighted average presented
  // as a single at-a-glance indicator.
  const attendanceRatePct = (totalEmployees || 0) > 0 ? Math.round(((presentToday || 0) / (totalEmployees || 1)) * 100) : 0;
  const pendingLoad = (pendingLeaves || 0) + (pendingRequests || 0);
  const pendingLoadScore = Math.max(0, 100 - pendingLoad * 5);
  const hrHealthScore = Math.round((attendanceRatePct + profileCompletionPct + pendingLoadScore) / 3);

  const greeting = now.getHours() < 11 ? "Selamat Pagi" : now.getHours() < 15 ? "Selamat Siang" : now.getHours() < 18 ? "Selamat Sore" : "Selamat Malam";

  // Smart Insights: rule-based, computed from real data already fetched above
  // (not AI/ML — this app has no such infrastructure, so insights are honest
  // threshold checks rather than fabricated predictions).
  type Insight = { icon: React.ComponentType<{ size?: number }>; tone: "warning" | "critical" | "good"; text: string; href?: string };
  const insights: Insight[] = [];
  if ((pendingLeaves || 0) > 0) {
    insights.push({ icon: AlertTriangle, tone: "warning", text: `${pendingLeaves} pengajuan cuti menunggu persetujuan Anda`, href: "/hrd/leaves" });
  }
  if ((pendingRequests || 0) > 0) {
    insights.push({ icon: AlertTriangle, tone: "warning", text: `${pendingRequests} permintaan tenaga kerja menunggu review`, href: "/hrd/workforce/requests" });
  }
  if (attendanceTrend?.direction === "down" && attendanceTrend.percentage >= 10) {
    insights.push({ icon: TrendingDown, tone: "critical", text: `Kehadiran hari ini turun ${attendanceTrend.percentage}% dibanding rata-rata 7 hari terakhir`, href: "/hrd/attendance" });
  }
  if (profileCompletionPct < 80 && profileFields.length > 0) {
    insights.push({ icon: UserCog, tone: "warning", text: `Baru ${profileCompletionPct}% karyawan melengkapi profil pribadi mereka`, href: "/hrd/infrastructure/employees" });
  }
  if ((activeJobs || 0) > 0 && appChartData.length === 0) {
    insights.push({ icon: Briefcase, tone: "warning", text: `${activeJobs} lowongan aktif belum menerima pelamar`, href: "/hrd/recruitment" });
  }
  if (insights.length === 0) {
    insights.push({ icon: CheckCircle2, tone: "good", text: "Semua metrik utama dalam kondisi normal — tidak ada yang perlu ditindaklanjuti segera." });
  }

  const activityTimeline = (activityLogRaw || []).map((a) => ({
    text: a.detail || `${a.action}${a.target_name ? ` — ${a.target_name}` : ""}`,
    actor: a.performed_by_name || "Sistem",
    time: new Date(a.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  }));

  const quickAccess = [
    { icon: UserCog, title: "Profil Karyawan", desc: "Lihat data diri dan profil yang diisi oleh karyawan", href: "/hrd/infrastructure/employees", color: "blue" },
    { icon: Briefcase, title: "Rekrutmen", desc: "Lowongan, pelamar, dan hiring", href: "/hrd/recruitment", color: "emerald" },
    { icon: CalendarCheck, title: "Absensi & Cuti", desc: "Pantau kehadiran dan setujui cuti", href: "/hrd/leaves", color: "amber" },
    { icon: Wallet, title: "Payroll", desc: "Gaji, slip, dan komponen salary", href: "/hrd/payroll", color: "purple" },
    { icon: TrendingUp, title: "KPI & Performa", desc: "Penilaian kinerja karyawan", href: "/hrd/performance/kpi", color: "red" },
    { icon: FileText, title: "Laporan", desc: "Rekap dan analisis data HR", href: "/hrd/reports", color: "indigo" },
    { icon: GraduationCap, title: "Pelatihan", desc: "Ringkasan seluruh program training", href: "/hrd/learning/trainings", color: "teal" },
  ];

  const stats = [
    { label: "Total Karyawan", value: totalEmployees || 0, icon: Users, color: "blue", tooltip: "Jumlah seluruh karyawan aktif" },
    { label: "Total Departemen", value: totalDepartments || 0, icon: Building2, color: "indigo", tooltip: "Jumlah departemen terdaftar" },
    { label: "Hadir Hari Ini", value: presentToday || 0, icon: CalendarCheck, color: "emerald", tooltip: "Karyawan hadir hari ini", trend: attendanceTrend, sparklineValues: attendanceSparkline },
    { label: "Skor Performa", value: performanceScorePct, suffix: performanceScorePct > 0 ? "%" : "", icon: Award, color: "red", tooltip: `Rata-rata Final Score ${kpiScores.length} evaluasi KPI tahun ini` },
    { label: "Turnover Rate", value: turnoverRatePct, suffix: "%", icon: UserMinus, color: "red", tooltip: `${approvedResignations.length} resign disetujui tahun ini dari ${totalEmployees || 0} karyawan aktif` },
    { label: "Permintaan Pending", value: pendingRequests || 0, icon: Clock, color: "amber", tooltip: "Permintaan tenaga kerja menunggu" },
    { label: "Cuti Pending", value: pendingLeaves || 0, icon: FileText, color: "red", tooltip: "Pengajuan cuti menunggu HRD" },
    { label: "Lowongan Aktif", value: activeJobs || 0, icon: Briefcase, color: "purple", tooltip: "Lowongan kerja yang dibuka" },
    { label: "Profil Lengkap", value: profileCompletionPct, suffix: "%", icon: UserCog, color: "teal", tooltip: `${completeProfiles} dari ${profileFields.length} karyawan sudah melengkapi profil sendiri` },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      {/* Executive Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PT Pratama Galuh Perkasa &middot; {now.getFullYear()}</p>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, {userName}
            </h1>
            <div className="mt-1.5">
              <LiveClock initialIso={now.toISOString()} />
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <RadialGauge value={hrHealthScore} label="HR Health Score" size={92} />
          </div>
        </div>

        {/* Summary Hari Ini */}
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-slate-100 border-t border-slate-100">
          {[
            { label: "Total Karyawan", value: totalEmployees || 0 },
            { label: "Hadir Hari Ini", value: presentToday || 0 },
            { label: "Cuti", value: pendingLeaves || 0 },
            { label: "Lembur Hari Ini", value: overtimeToday || 0 },
            { label: "Lowongan Aktif", value: activeJobs || 0 },
            { label: "Pending Approval", value: (pendingRequests || 0) + (pendingLeaves || 0) },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3 text-center">
              <p className="text-lg font-extrabold text-slate-800 leading-tight">{s.value}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase leading-snug mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Insights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-pgp-red" />
          <h2 className="text-lg font-extrabold text-slate-800">Smart Insights</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Berbasis aturan &amp; data real-time</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, i) => {
            const toneStyle = insight.tone === "critical"
              ? "bg-red-50 border-red-100 text-pgp-red"
              : insight.tone === "warning"
                ? "bg-slate-50 border-slate-200 text-slate-700"
                : "bg-[#1A2530] border-[#1A2530] text-white";
            const Icon = insight.icon;
            const content = (
              <div className={`flex items-start gap-3 rounded-xl border p-4 ${toneStyle} ${insight.href ? "hover:shadow-sm transition-shadow" : ""}`}>
                <Icon size={18} />
                <p className="text-xs font-semibold leading-relaxed flex-1">{insight.text}</p>
                {insight.href && <ArrowUpRight size={14} className="shrink-0 mt-0.5" />}
              </div>
            );
            return insight.href
              ? <Link key={i} href={insight.href}>{content}</Link>
              : <div key={i}>{content}</div>;
          })}
        </div>
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
                      period === opt.key ? "bg-white shadow-sm text-pgp-red" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
            <TrendArea data={attendanceChartData} xKey="label" series={[{ key: "value", label: "Kehadiran" }]} height={220} />
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
              <RankedBar data={deptChartData} height={deptChartData.length * 44} />
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
              <RankedBar data={leaveChartData} height={leaveChartData.length * 44} />
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
              <RankedBar data={appChartData} height={appChartData.length * 44} />
            )}
          </div>

          {/* Headcount Trend */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Headcount Trend</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Karyawan baru bergabung per bulan, 6 bulan terakhir</p>
            </div>
            <TrendArea data={headcountTrendData} xKey="label" series={[{ key: "value", label: "Karyawan Baru" }]} height={200} />
          </div>

          {/* Turnover Trend */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Turnover Trend</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Resign disetujui per bulan, 6 bulan terakhir</p>
            </div>
            <TrendArea data={turnoverTrendData} xKey="label" series={[{ key: "value", label: "Resign" }]} height={200} />
          </div>

        </div>
      </div>

      {/* Department Performance */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-pgp-red" />
          <h2 className="text-lg font-extrabold text-slate-800">Performa Departemen</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Final Score KPI tahun ini</span>
        </div>
        {deptPerformance.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <EmptyState icon={Trophy} title="Belum ada data evaluasi KPI untuk dianalisis." className="border-none py-10" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4">Top Performing Department</h3>
              <ul className="space-y-3">
                {topDepartments.map((d, i) => (
                  <li key={d.department} className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-[#1A2530] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{d.department}</span>
                    <span className="text-xs font-extrabold text-slate-800">{d.score}%</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4">Need Attention</h3>
              {needAttentionDepartments.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Tidak ada departemen di bawah ambang batas." className="border-none py-8" />
              ) : (
                <ul className="space-y-3">
                  {needAttentionDepartments.map((d) => (
                    <li key={d.department} className="flex items-center gap-3">
                      <span className="h-2 w-2 rounded-full bg-pgp-red shrink-0" />
                      <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{d.department}</span>
                      <span className="text-xs font-extrabold text-pgp-red">{d.score}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-pgp-red" />
          <h2 className="text-lg font-extrabold text-slate-800">Aktivitas Terbaru</h2>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          {activityTimeline.length === 0 ? (
            <EmptyState icon={Activity} title="Belum ada aktivitas tercatat." className="border-none py-8" />
          ) : (
            <ul className="space-y-4">
              {activityTimeline.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-pgp-red shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{item.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.actor} &middot; {item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
