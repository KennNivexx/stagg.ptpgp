import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import {
  Users, Briefcase, CalendarCheck, Wallet, TrendingUp, TrendingDown, FileText,
  GraduationCap, Building2, Clock, UserCog, Sparkles, AlertTriangle, CheckCircle2,
  Activity, ArrowUpRight, Timer, Award, UserMinus, Trophy, Plus, Download, Upload,
  LayoutGrid,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import TrendArea from "@/components/charts/TrendArea";
import RankedBar from "@/components/charts/RankedBar";
import RadialGauge from "@/components/charts/RadialGauge";
import LiveClock from "@/components/hrd/LiveClock";
import Sparkline from "@/components/hrd/Sparkline";
import { HrdPageHeader, HrdStatsCard, HrdCard, HrdActionButton } from "@/components/hrd/HrdUi";

export const dynamic = "force-dynamic";

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
  if (period === "30d") { start = new Date(now); start.setDate(start.getDate() - 29); }
  else if (period === "month") { start = new Date(now.getFullYear(), now.getMonth(), 1); }
  else if (period === "quarter") { const qStartMonth = Math.floor(now.getMonth() / 3) * 3; start = new Date(now.getFullYear(), qStartMonth, 1); }
  else { start = new Date(now); start.setDate(start.getDate() - 6); }
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
    weeks.push({ startDate: weekStart.toISOString().split("T")[0], endDate: weekEnd.toISOString().split("T")[0], label: `M${weekNum}` });
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
  const trendWindowStart = new Date(now); trendWindowStart.setDate(trendWindowStart.getDate() - 6);
  const trendWindowStartStr = trendWindowStart.toISOString().split("T")[0];
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

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

  const attendanceByDate: Record<string, number> = {};
  (attendanceRaw || []).forEach((r) => { if (r.date) attendanceByDate[r.date] = (attendanceByDate[r.date] || 0) + 1; });

  let attendanceChartData: { label: string; sublabel?: string; value: number }[];
  if (bucket === "week") {
    const weeks = getWeekBuckets(periodStart, periodEnd);
    attendanceChartData = weeks.map((w) => {
      let total = 0;
      Object.entries(attendanceByDate).forEach(([date, count]) => { if (date >= w.startDate && date <= w.endDate) total += count; });
      return { label: w.label, value: total };
    });
  } else {
    const days = getDayBuckets(periodStart, periodEnd);
    attendanceChartData = days.map((d) => ({ label: d.label, sublabel: d.sublabel, value: attendanceByDate[d.date] || 0 }));
  }
  const attendanceChartTotalCount = attendanceChartData.length;
  const attendanceChartTruncated = attendanceChartTotalCount > BAR_CHART_MAX_BARS;

  const trendByDate: Record<string, number> = {};
  (trendAttendanceRaw || []).forEach((r) => { if (r.date) trendByDate[r.date] = (trendByDate[r.date] || 0) + 1; });
  const todayCount = trendByDate[today] || 0;
  const otherDayCounts = Object.entries(trendByDate).filter(([date]) => date !== today).map(([, count]) => count);
  const otherAvg = otherDayCounts.length > 0 ? otherDayCounts.reduce((a, b) => a + b, 0) / otherDayCounts.length : 0;
  const attendanceTrend = otherAvg > 0
    ? { direction: (todayCount >= otherAvg ? "up" : "down") as "up" | "down", percentage: Math.round(Math.abs((todayCount - otherAvg) / otherAvg) * 100) }
    : undefined;
  const attendanceSparkline: number[] = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); attendanceSparkline.push(trendByDate[d.toISOString().split("T")[0]] || 0); }

  const deptCount: Record<string, number> = {};
  (employeesRaw || []).forEach((e) => { if (e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1; });
  const deptChartData = Object.entries(deptCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }));

  const leaveCount: Record<string, number> = { Pending: 0, Disetujui: 0, Ditolak: 0 };
  (leavesRaw || []).forEach((l) => { if (l.status && l.status in leaveCount) leaveCount[l.status]++; });
  const leaveTotal = Object.values(leaveCount).reduce((a, b) => a + b, 0);
  const leaveChartData = [
    { label: "Pending", value: leaveCount.Pending, color: "var(--chart-status-warning)" },
    { label: "Disetujui", value: leaveCount.Disetujui, color: "var(--chart-status-good)" },
    { label: "Ditolak", value: leaveCount.Ditolak, color: "var(--chart-status-critical)" },
  ];

  const appCount: Record<string, number> = {};
  (applicantsRaw || []).forEach((a) => { if (a.status) appCount[a.status] = (appCount[a.status] || 0) + 1; });
  const appChartData = Object.entries(appCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));

  const hasRealAddress = (raw: unknown) => {
    if (!raw || typeof raw !== "string") return false;
    try { const parsed = JSON.parse(raw); if (parsed && typeof parsed === "object" && parsed.__auth__) return !!parsed.home_address; } catch { }
    return true;
  };
  const profileFields = (profileFieldsRaw || []) as { phone?: string; address?: string; nik?: string; emergency_phone?: string }[];
  const completeProfiles = profileFields.filter((e) => !!e.phone && hasRealAddress(e.address) && !!e.nik && !!e.emergency_phone).length;
  const profileCompletionPct = profileFields.length > 0 ? Math.round((completeProfiles / profileFields.length) * 100) : 0;

  const kpiScores = (kpiScoresRaw || []) as { employee_id: string; final_score: number }[];
  const performanceScorePct = kpiScores.length > 0 ? Math.round(kpiScores.reduce((sum, k) => sum + k.final_score, 0) / kpiScores.length) : 0;

  const employeeDeptMap: Record<string, string> = {};
  (employeeDeptRaw || []).forEach((e) => { if (e.id && e.department) employeeDeptMap[e.id as string] = e.department as string; });
  const deptScoreAgg: Record<string, { sum: number; count: number }> = {};
  kpiScores.forEach((k) => {
    const dept = employeeDeptMap[k.employee_id];
    if (!dept) return;
    if (!deptScoreAgg[dept]) deptScoreAgg[dept] = { sum: 0, count: 0 };
    deptScoreAgg[dept].sum += k.final_score;
    deptScoreAgg[dept].count += 1;
  });
  const deptPerformance = Object.entries(deptScoreAgg).map(([department, { sum, count }]) => ({ department, score: Math.round(sum / count) })).sort((a, b) => b.score - a.score);
  const topDepartments = deptPerformance.slice(0, 5);
  const needAttentionDepartments = deptPerformance.filter((d) => d.score < 75).sort((a, b) => a.score - b.score).slice(0, 5);

  const headcountMonths: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); headcountMonths.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("id-ID", { month: "short" }) }); }
  const headcountByMonth: Record<string, number> = {};
  (headcountDatesRaw || []).forEach((r) => {
    if (!r.created_at) return;
    const d = new Date(r.created_at as string);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    headcountByMonth[key] = (headcountByMonth[key] || 0) + 1;
  });
  const headcountTrendData = headcountMonths.map((m) => ({ label: m.label, value: headcountByMonth[m.key] || 0 }));

  const resignations = (resignationsRaw || []) as { created_at: string; status: string }[];
  const approvedResignations = resignations.filter((r) => ["Disetujui", "Approved"].includes(r.status));
  const turnoverMonths: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); turnoverMonths.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("id-ID", { month: "short" }) }); }
  const turnoverByMonth: Record<string, number> = {};
  approvedResignations.forEach((r) => { const d = new Date(r.created_at); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; turnoverByMonth[key] = (turnoverByMonth[key] || 0) + 1; });
  const turnoverTrendData = turnoverMonths.map((m) => ({ label: m.label, value: turnoverByMonth[m.key] || 0 }));
  const turnoverRatePct = (totalEmployees || 0) > 0 ? Math.round((approvedResignations.length / (totalEmployees || 1)) * 1000) / 10 : 0;

  const attendanceRatePct = (totalEmployees || 0) > 0 ? Math.round(((presentToday || 0) / (totalEmployees || 1)) * 100) : 0;
  const pendingLoad = (pendingLeaves || 0) + (pendingRequests || 0);
  const pendingLoadScore = Math.max(0, 100 - pendingLoad * 5);
  const hrHealthScore = Math.round((attendanceRatePct + profileCompletionPct + pendingLoadScore) / 3);

  const greeting = now.getHours() < 11 ? "Selamat Pagi" : now.getHours() < 15 ? "Selamat Siang" : now.getHours() < 18 ? "Selamat Sore" : "Selamat Malam";

  type Insight = { icon: React.ComponentType<{ size?: number }>; tone: "warning" | "critical" | "good"; text: string; href?: string };
  const insights: Insight[] = [];
  if ((pendingLeaves || 0) > 0) insights.push({ icon: AlertTriangle, tone: "warning", text: `${pendingLeaves} pengajuan cuti menunggu persetujuan Anda`, href: "/hrd/leaves" });
  if ((pendingRequests || 0) > 0) insights.push({ icon: AlertTriangle, tone: "warning", text: `${pendingRequests} permintaan tenaga kerja menunggu review`, href: "/hrd/workforce/requests" });
  if (attendanceTrend?.direction === "down" && attendanceTrend.percentage >= 10) insights.push({ icon: TrendingDown, tone: "critical", text: `Kehadiran hari ini turun ${attendanceTrend.percentage}% dibanding rata-rata 7 hari terakhir`, href: "/hrd/attendance" });
  if (profileCompletionPct < 80 && profileFields.length > 0) insights.push({ icon: UserCog, tone: "warning", text: `Baru ${profileCompletionPct}% karyawan melengkapi profil pribadi mereka`, href: "/hrd/infrastructure/employees" });
  if ((activeJobs || 0) > 0 && appChartData.length === 0) insights.push({ icon: Briefcase, tone: "warning", text: `${activeJobs} lowongan aktif belum menerima pelamar`, href: "/hrd/recruitment" });
  if (insights.length === 0) insights.push({ icon: CheckCircle2, tone: "good", text: "Semua metrik utama dalam kondisi normal — tidak ada yang perlu ditindaklanjuti segera." });

  const activityTimeline = (activityLogRaw || []).map((a) => ({
    text: a.detail || `${a.action}${a.target_name ? ` — ${a.target_name}` : ""}`,
    actor: a.performed_by_name || "Sistem",
    time: new Date(a.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  }));

  const quickAccess = [
    { icon: UserCog, title: "Profil Karyawan", desc: "Lihat data diri dan profil karyawan", href: "/hrd/infrastructure/employees", color: "blue" as const },
    { icon: Briefcase, title: "Rekrutmen", desc: "Lowongan, pelamar, dan hiring", href: "/hrd/recruitment", color: "emerald" as const },
    { icon: CalendarCheck, title: "Absensi & Cuti", desc: "Pantau kehadiran dan setujui cuti", href: "/hrd/leaves", color: "amber" as const },
    { icon: Wallet, title: "Payroll", desc: "Gaji, slip, dan komponen salary", href: "/hrd/rewards/payroll", color: "purple" as const },
  ];

  return (
    <div className="space-y-8">
      {/* Executive header */}
      <HrdPageHeader
        title={`${greeting}, ${userName}`}
        subtitle={`Ringkasan HRD PT Pratama Galuh Perkasa · ${now.getFullYear()} · ${new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(now)}`}
      >
        <HrdActionButton href="/hrd/infrastructure/employees/new" icon={<Plus size={14} />} variant="primary">Tambah Karyawan</HrdActionButton>
        <HrdActionButton href="/hrd/reports" icon={<Download size={14} />} variant="outline">Ekspor Laporan</HrdActionButton>
      </HrdPageHeader>

      {/* Summary health score */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">HR Health Score</p>
          <p className="text-sm text-slate-600 max-w-xl">
            Kombinasi kehadiran, kelengkapan profil, dan beban approval hari ini.
            {pendingLoad > 0 && (
              <span className="block mt-1 text-red-600 font-semibold text-xs">
                {pendingLoad} item menunggu persetujuan — perlu ditindaklanjuti.
              </span>
            )}
          </p>
          <div className="mt-4 flex items-center gap-4 text-[11px] font-bold text-slate-500">
            <LiveClock initialIso={now.toISOString()} />
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Online</span>
          </div>
        </div>
        <div className="shrink-0">
          <RadialGauge value={hrHealthScore} label="Skor" size={100} />
        </div>
      </div>

      {/* Today's stats */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-[#1A2530]">Ringkasan Hari Ini</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data real-time</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <HrdStatsCard label="Total Karyawan" value={totalEmployees || 0} icon={<Users size={18} />} color="blue" />
          <HrdStatsCard label="Hadir Hari Ini" value={presentToday || 0} icon={<CalendarCheck size={18} />} color="emerald" trend={attendanceTrend} />
          <HrdStatsCard label="Cuti Pending" value={pendingLeaves || 0} icon={<FileText size={18} />} color="amber" />
          <HrdStatsCard label="Permintaan Pending" value={pendingRequests || 0} icon={<Clock size={18} />} color="rose" />
        </div>
      </section>

      {/* Quick access */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-[#1A2530]">Akses Cepat</h2>
          <Link href="/hrd/infrastructure/employees" className="text-[11px] font-bold text-pgp-red hover:underline">Lihat semua menu</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccess.map((item) => (
            <Link key={item.href} href={item.href} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-slate-200 transition-all group">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform bg-${item.color}-50 text-${item.color}-600`}>
                  <item.icon size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-pgp-red group-hover:gap-2 transition-all">Buka <ArrowUpRight size={12} /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Insights */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-pgp-red" />
          <h2 className="text-lg font-extrabold text-[#1A2530]">Smart Insights</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berbasis aturan & data real-time</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, i) => {
            const toneStyle = insight.tone === "critical" ? "bg-red-50 border-red-100 text-pgp-red" : insight.tone === "warning" ? "bg-white border-slate-100 text-slate-700" : "bg-[#1A2530] border-[#1A2530] text-white";
            const Icon = insight.icon;
            const content = (
              <div className={`flex items-start gap-3 rounded-xl border p-4 ${toneStyle} ${insight.href ? "hover:shadow-sm transition-shadow" : ""}`}>
                <Icon size={18} />
                <p className="text-xs font-semibold leading-relaxed flex-1">{insight.text}</p>
                {insight.href && <ArrowUpRight size={14} className="shrink-0 mt-0.5" />}
              </div>
            );
            return insight.href ? <Link key={i} href={insight.href}>{content}</Link> : <div key={i}>{content}</div>;
          })}
        </div>
      </section>

      {/* Charts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-[#1A2530]">Grafik & Analitik</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visualisasi data</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HrdCard title="Kehadiran Karyawan" subtitle="Jumlah karyawan yang check-in per periode" icon={<CalendarCheck size={16} />} iconColor="emerald" action={{ label: "Detail", href: "/hrd/attendance" }}>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit mb-4">
              {PERIOD_OPTIONS.map((opt) => (
                <Link key={opt.key} href={opt.key === "7d" ? "/hrd" : `/hrd?range=${opt.key}`} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${period === opt.key ? "bg-white shadow-sm text-pgp-red" : "text-slate-500 hover:text-slate-700"}`}>{opt.label}</Link>
              ))}
            </div>
            <TrendArea data={attendanceChartData} xKey="label" series={[{ key: "value", label: "Kehadiran" }]} height={220} />
            {attendanceChartTruncated && (
              <p className="text-[10px] text-slate-400 mt-2 text-center">Menampilkan {BAR_CHART_MAX_BARS} dari {attendanceChartTotalCount} {bucket === "week" ? "minggu" : "hari"} terbaru</p>
            )}
          </HrdCard>

          <HrdCard title="Distribusi Karyawan per Departemen" subtitle="Top departemen berdasarkan jumlah karyawan aktif" icon={<Building2 size={16} />} iconColor="blue">
            {deptChartData.length === 0 ? <EmptyState icon={Building2} title="Belum ada data departemen." className="border-none py-8" /> : <RankedBar data={deptChartData} height={deptChartData.length * 44} />}
          </HrdCard>

          <HrdCard title="Status Cuti Bulan Ini" subtitle="Distribusi status pengajuan cuti bulan berjalan" icon={<FileText size={16} />} iconColor="amber">
            {leaveTotal === 0 ? <EmptyState icon={FileText} title="Belum ada pengajuan cuti bulan ini." className="border-none py-8" /> : <RankedBar data={leaveChartData} height={leaveChartData.length * 44} />}
          </HrdCard>

          <HrdCard title="Pipeline Rekrutmen" subtitle="Jumlah pelamar berdasarkan status seleksi" icon={<Briefcase size={16} />} iconColor="purple">
            {appChartData.length === 0 ? <EmptyState icon={Briefcase} title="Belum ada data pelamar." className="border-none py-8" /> : <RankedBar data={appChartData} height={appChartData.length * 44} />}
          </HrdCard>

          <HrdCard title="Headcount Trend" subtitle="Karyawan baru bergabung per bulan, 6 bulan terakhir" icon={<Users size={16} />} iconColor="blue">
            <TrendArea data={headcountTrendData} xKey="label" series={[{ key: "value", label: "Karyawan Baru" }]} height={200} />
          </HrdCard>

          <HrdCard title="Turnover Trend" subtitle="Resign disetujui per bulan, 6 bulan terakhir" icon={<UserMinus size={16} />} iconColor="red">
            <TrendArea data={turnoverTrendData} xKey="label" series={[{ key: "value", label: "Resign" }]} height={200} />
          </HrdCard>
        </div>
      </section>

      {/* Department performance */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-pgp-red" />
          <h2 className="text-lg font-extrabold text-[#1A2530]">Performa Departemen</h2>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rata-rata Final Score KPI tahun ini</span>
        </div>
        {deptPerformance.length === 0 ? (
          <HrdCard><EmptyState icon={Trophy} title="Belum ada data evaluasi KPI untuk dianalisis." className="border-none py-10" /></HrdCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HrdCard title="Top Performing Department" icon={<Trophy size={16} />} iconColor="amber">
              <ul className="space-y-3">
                {topDepartments.map((d, i) => (
                  <li key={d.department} className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-[#1A2530] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                    <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{d.department}</span>
                    <span className="text-xs font-extrabold text-slate-800">{d.score}%</span>
                  </li>
                ))}
              </ul>
            </HrdCard>
            <HrdCard title="Need Attention" icon={<AlertTriangle size={16} />} iconColor="red">
              {needAttentionDepartments.length === 0 ? <EmptyState icon={CheckCircle2} title="Tidak ada departemen di bawah ambang batas." className="border-none py-8" /> : (
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
            </HrdCard>
          </div>
        )}
      </section>

      {/* Activity timeline */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-pgp-red" />
          <h2 className="text-lg font-extrabold text-[#1A2530]">Aktivitas Terbaru</h2>
        </div>
        <HrdCard>
          {activityTimeline.length === 0 ? <EmptyState icon={Activity} title="Belum ada aktivitas tercatat." className="border-none py-8" /> : (
            <ul className="space-y-4">
              {activityTimeline.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-pgp-red shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-700 leading-relaxed">{item.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.actor} · {item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </HrdCard>
      </section>
    </div>
  );
}
