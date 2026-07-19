import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import {
  Target, TrendingUp, Users, DollarSign, Calendar,
  Briefcase, Award, Star, Activity, BarChart3,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import RadialGauge from "@/components/charts/RadialGauge";

export default async function HRDDashboardKPI() {
  await requireRole("hrd", "superadmin", "director");
  const [
    { count: totalEmployees },
    { count: totalJobs },
    { count: openJobs },
    { data: evaluations },
    { data: attendance },
    { data: payrolls },
    { count: totalDepartments },
    { count: totalPositions },
    { data: recentEvals },
  ] = await Promise.all([
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("lowongan_kerja").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("lowongan_kerja").select("*", { count: "exact", head: true }).eq("status", "Open"),
    supabaseAdmin.from("evaluasi_kpi").select("score, status, employee_id"),
    supabaseAdmin.from("absensi").select("status, date"),
    supabaseAdmin.from("penggajian").select("net_salary, allowances, deductions, status"),
    supabaseAdmin.from("departemen").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("jabatan").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("evaluasi_kpi").select("score, status, created_at, karyawan!inner(full_name, department)").order("created_at", { ascending: false }).limit(5),
  ]);

  const avgScore = evaluations && evaluations.length > 0
    ? (evaluations.filter((e: Record<string, unknown>) => e.score != null)
        .reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.score) || 0), 0) /
       evaluations.filter((e: Record<string, unknown>) => e.score != null).length)
    : 0;

  const presentCount = (attendance || []).filter((a: Record<string, unknown>) => a.status === "Hadir").length;
  const paidPayroll = (payrolls || []).filter((p: Record<string, unknown>) => p.status === "Paid").length;
  const totalNetSalary = (payrolls || []).reduce((sum: number, p: Record<string, unknown>) => sum + (Number(p.net_salary) || 0), 0);

  const evaluatedCount = new Set((evaluations || []).map((e: Record<string, unknown>) => e.employee_id)).size;
  const evaluationRate = totalEmployees && totalEmployees > 0
    ? Math.round((evaluatedCount / totalEmployees) * 100) : 0;

  const completionTargets = totalEmployees && totalEmployees > 0
    ? Math.round((presentCount / (totalEmployees * 22)) * 100) : 0;

  const overallHealthScore = Math.round((avgScore + evaluationRate + Math.min(completionTargets, 100)) / 3);
  const overallHealthLabel = overallHealthScore >= 75 ? "Operational" : overallHealthScore >= 50 ? "Needs Attention" : "At Risk";
  const overallHealthColor = overallHealthScore >= 75 ? "bg-emerald-500" : overallHealthScore >= 50 ? "bg-amber-500" : "bg-red-500";
  const overallHealthTextColor = overallHealthScore >= 75 ? "text-emerald-600" : overallHealthScore >= 50 ? "text-amber-600" : "text-red-600";

  const kpiAreas = [
    {
      title: "Rekrutmen & Staffing",
      icon: <Briefcase size={16} />,
      target: Math.max(totalEmployees || 0, 1),
      actual: openJobs || 0,
      unit: "lowongan",
      color: "blue",
      inverse: false,
    },
    {
      title: "Penilaian Kinerja",
      icon: <Target size={16} />,
      target: 85,
      actual: Math.round(avgScore),
      unit: "skor",
      color: "emerald",
      inverse: false,
    },
    {
      title: "Kehadiran",
      icon: <Calendar size={16} />,
      target: 90,
      actual: completionTargets,
      unit: "%",
      color: "amber",
      inverse: false,
    },
    {
      title: "Payroll Processing",
      icon: <DollarSign size={16} />,
      target: (totalEmployees || 0),
      actual: paidPayroll,
      unit: "diproses",
      color: "red",
      inverse: false,
    },
    {
      title: "Evaluasi KPI",
      icon: <Star size={16} />,
      target: (totalEmployees || 0),
      actual: evaluatedCount,
      unit: "dinilai",
      color: "purple",
      inverse: false,
    },
    {
      title: "Departemen",
      icon: <Users size={16} />,
      target: Math.max(totalEmployees || 0, 1),
      actual: totalDepartments || 0,
      unit: "dept",
      color: "cyan",
      inverse: false,
    },
  ];

  const stats = [
    { label: "Total Karyawan", value: totalEmployees || 0, icon: <Users size={16} />, color: "blue", subtitle: "Aktif" },
    { label: "Lowongan Aktif", value: openJobs || 0, icon: <Briefcase size={16} />, color: "red", subtitle: `dari ${totalJobs || 0} total` },
    { label: "Rata-rata Skor", value: avgScore.toFixed(1), icon: <TrendingUp size={16} />, color: "emerald", subtitle: `evaluasi KPI` },
    { label: "Kehadiran", value: `${completionTargets}%`, icon: <Calendar size={16} />, color: "amber", subtitle: "rata-rata" },
    { label: "Total Payroll", value: `Rp ${totalNetSalary.toLocaleString("id-ID").split(",")[0]}`, icon: <DollarSign size={16} />, color: "purple", subtitle: "total bersih" },
    { label: "Evaluasi Rate", value: `${evaluationRate}%`, icon: <Award size={16} />, color: "cyan", subtitle: `${evaluatedCount} dari ${totalEmployees || 0}` },
  ];

  const colorClasses: Record<string, { bg: string; text: string; bar: string; light: string }> = {
    blue: { bg: "bg-blue-500", text: "text-blue-600", bar: "bg-blue-500", light: "bg-blue-50" },
    emerald: { bg: "bg-emerald-500", text: "text-emerald-600", bar: "bg-emerald-500", light: "bg-emerald-50" },
    amber: { bg: "bg-amber-500", text: "text-amber-600", bar: "bg-amber-500", light: "bg-amber-50" },
    red: { bg: "bg-red-500", text: "text-red-600", bar: "bg-red-500", light: "bg-red-50" },
    purple: { bg: "bg-purple-500", text: "text-purple-600", bar: "bg-purple-500", light: "bg-purple-50" },
    cyan: { bg: "bg-cyan-500", text: "text-cyan-600", bar: "bg-cyan-500", light: "bg-cyan-50" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Dashboards KPI & OKR</h1>
          <p className="text-sm text-gray-500">Control panel pemantauan target dan pencapaian seluruh proses HR</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-500">Real-time Dashboard</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const c = colorClasses[stat.color] || colorClasses.blue;
          return (
            <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className={`p-2.5 rounded-xl ${c.light} ${c.text} w-fit mb-3`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{stat.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">OKR Progress - HR Process Areas</h3>
                <p className="text-xs text-slate-400 mt-0.5">Target vs Actual untuk setiap area proses HR</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {kpiAreas.map((area) => {
              const pct = area.target > 0 ? Math.min(Math.round((area.actual / area.target) * 100), 100) : 0;
              return (
                <div key={area.title} className="flex flex-col items-center">
                  <RadialGauge value={pct} label={area.title} size={120} sublabel={`${area.actual}/${area.target} ${area.unit}`} />
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">System Status</h3>
                <p className="text-xs text-slate-400 mt-0.5">Status modul dan proses</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {[
              { label: "Database Employees", value: totalEmployees || 0, target: 1, unit: "records" },
              { label: "Active Jobs", value: openJobs || 0, target: 1, unit: "openings" },
              { label: "KPI Evaluations", value: evaluations?.length || 0, target: 1, unit: "reviews" },
              { label: "Active Positions", value: totalPositions || 0, target: 1, unit: "positions" },
              { label: "Attendance Records", value: attendance?.length || 0, target: 1, unit: "logs" },
              { label: "Payroll Slips", value: payrolls?.length || 0, target: 1, unit: "slips" },
              { label: "Departments", value: totalDepartments || 0, target: 1, unit: "units" },
            ].map((item) => {
              const active = item.value > 0;
              return (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <span className="text-xs font-medium text-slate-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">{item.value}</span>
                    <span className="text-[10px] text-slate-400">{item.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Overall Health</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${overallHealthColor}`} />
                <span className={`text-[10px] font-bold ${overallHealthTextColor}`}>{overallHealthLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-red-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Evaluasi KPI Terbaru</h3>
                <p className="text-xs text-slate-400 mt-0.5">5 evaluasi terakhir yang tercatat di sistem</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {(recentEvals || []).length === 0 ? (
              <EmptyState icon={Target} title="Belum ada evaluasi." className="py-4" />
            ) : (
              (recentEvals as Record<string, unknown>[]).map((ev, i) => {
                const emp = ev.karyawan as Record<string, string> | undefined;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{emp?.full_name || "-"}</p>
                      <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-800">{Number(ev.score) || 0}</p>
                      <p className="text-[10px] text-slate-400">skor</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-purple-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Cakupan Evaluasi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Persentase karyawan yang sudah dinilai</p>
              </div>
            </div>
          </div>
          <div className="p-6 flex flex-col items-center">
            <RadialGauge value={evaluationRate} label="Progress Evaluasi" size={140} />
            <div className="flex items-center justify-between text-xs text-slate-500 w-full mt-4">
              <span>{evaluatedCount} sudah dinilai</span>
              <span>{(totalEmployees || 0) - evaluatedCount} belum dinilai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
