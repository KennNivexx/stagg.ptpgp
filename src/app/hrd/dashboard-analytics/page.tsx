import { supabaseAdmin } from "@/lib/supabase";
import {
  BarChart3, Users, TrendingUp, Briefcase, CalendarCheck,
  DollarSign, Target, Activity, ArrowUp, FileText, Building2
} from "lucide-react";

export default async function DashboardAnalytics() {
  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: inactiveEmployees },
    { count: totalJobs },
    { count: openJobs },
    { count: totalApplications },
    { count: pendingApplications },
    { data: attendance },
    { count: totalLeaves },
    { count: pendingLeaves },
    { data: payrolls },
    { data: evaluations },
    { count: totalDepartments },
  ] = await Promise.all([
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).neq("status", "Inactive"),
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("status", "Inactive"),
    supabaseAdmin.from("jobs").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("jobs").select("*", { count: "exact", head: true }).eq("status", "Open"),
    supabaseAdmin.from("applications").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("applications").select("*", { count: "exact", head: true }).eq("status", "Menunggu Review"),
    supabaseAdmin.from("attendance").select("status, date").limit(1000),
    supabaseAdmin.from("leaves").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("leaves").select("*", { count: "exact", head: true }).eq("status", "Pending"),
    supabaseAdmin.from("payroll").select("net_salary, status, month, year"),
    supabaseAdmin.from("kpi_evaluations").select("score, status"),
    supabaseAdmin.from("departments").select("*", { count: "exact", head: true }),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = (attendance || []).filter((a: Record<string, unknown>) => a.date === today);
  const presentToday = todayAttendance.filter((a: Record<string, unknown>) => a.status === "Present").length;
  const absentToday = todayAttendance.filter((a: Record<string, unknown>) => a.status !== "Present").length;

  const attendanceRate = activeEmployees && activeEmployees > 0 && todayAttendance.length > 0
    ? Math.round((presentToday / activeEmployees) * 100) : 0;

  const growthRate = totalEmployees && totalEmployees > 0 ? Math.round(((activeEmployees || 0) / totalEmployees) * 100) : 0;

  const evals = (evaluations || []) as Record<string, unknown>[];
  const avgScore = evals.filter((e) => e.score != null).length > 0
    ? Math.round(evals.filter((e) => e.score != null).reduce((s, e) => s + (Number(e.score) || 0), 0) / evals.filter((e) => e.score != null).length)
    : 0;

  const paidPayroll = (payrolls || []).filter((p: Record<string, unknown>) => p.status === "Paid").length;
  const totalPayroll = (payrolls || []).reduce((s, p: Record<string, unknown>) => s + (Number(p.net_salary) || 0), 0);

  const modules = [
    { name: "Karyawan", icon: Users, total: totalEmployees || 0, active: activeEmployees || 0, inactive: inactiveEmployees || 0, color: "blue" },
    { name: "Rekrutmen", icon: Briefcase, total: totalJobs || 0, active: openJobs || 0, inactive: totalApplications || 0, color: "emerald" },
    { name: "Absensi", icon: CalendarCheck, total: todayAttendance.length, active: presentToday, inactive: absentToday, color: "amber" },
    { name: "Cuti", icon: FileText, total: totalLeaves || 0, active: (totalLeaves || 0) - (pendingLeaves || 0), inactive: pendingLeaves || 0, color: "purple" },
    { name: "Payroll", icon: DollarSign, total: (payrolls || []).length, active: paidPayroll, inactive: (payrolls || []).length - paidPayroll, color: "red" },
    { name: "KPI", icon: Target, total: evals.length, active: evals.filter((e) => Number(e.score) >= 60).length, inactive: evals.filter((e) => Number(e.score) < 60).length, color: "indigo" },
    { name: "Departemen", icon: Building2, total: totalDepartments || 0, active: totalDepartments || 0, inactive: 0, color: "teal" },
  ];

  const colorMap: Record<string, { bg: string; text: string; light: string }> = {
    blue: { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50" },
    emerald: { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50" },
    amber: { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50" },
    purple: { bg: "bg-purple-500", text: "text-purple-600", light: "bg-purple-50" },
    red: { bg: "bg-red-500", text: "text-red-600", light: "bg-red-50" },
    indigo: { bg: "bg-indigo-500", text: "text-indigo-600", light: "bg-indigo-50" },
    teal: { bg: "bg-teal-500", text: "text-teal-600", light: "bg-teal-50" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">Analitik performa SDM dan tren data perusahaan secara real-time.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-500">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Data Keseluruhan", value: (totalEmployees || 0) + (totalJobs || 0) + (totalApplications || 0) + (totalLeaves || 0) + (payrolls || []).length + evals.length, icon: <BarChart3 size={18} />, color: "blue", subtitle: "semua modul" },
          { label: "Tingkat Retensi", value: `${growthRate}%`, icon: <TrendingUp size={18} />, color: "emerald", subtitle: "karyawan aktif" },
          { label: "Tingkat Kehadiran", value: `${attendanceRate}%`, icon: <CalendarCheck size={18} />, color: "amber", subtitle: "hari ini" },
          { label: "Rata-rata Skor KPI", value: avgScore, icon: <Target size={18} />, color: "red", subtitle: `dari ${evals.length} evaluasi` },
        ].map((card) => {
          const c = colorMap[card.color] || colorMap.blue;
          return (
            <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${c.light} ${c.text}`}>{card.icon}</div>
                <div className="flex items-center gap-1">
                  <ArrowUp size={12} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600">Active</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{card.value}</p>
              <p className="text-[10px] text-slate-400 mt-1">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan Data per Modul</h3>
              <p className="text-xs text-slate-400 mt-0.5">Total, aktif, dan non-aktif per modul HR</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {modules.map((mod) => {
            const c = colorMap[mod.color] || colorMap.blue;
            const pct = mod.total > 0 ? Math.round((mod.active / mod.total) * 100) : 0;
            return (
              <div key={mod.name} className="p-5 hover:bg-slate-50/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${c.light} ${c.text}`}>
                      <mod.icon size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{mod.name}</p>
                      <p className="text-[10px] text-slate-400">Total: {mod.total} | Aktif: {mod.active} | Non-Aktif: {mod.inactive}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${pct >= 50 ? "text-emerald-600" : "text-amber-600"}`}>{pct}%</span>
                    <span className="text-[10px] text-slate-400 ml-1">aktif</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${c.bg}`} style={{ width: `${Math.max(pct, 2)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign size={16} className="text-purple-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan Payroll</h3>
                <p className="text-xs text-slate-400 mt-0.5">Total gaji bersih seluruh karyawan</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-700">Total Gaji Bersih</span>
              <span className="text-xl font-extrabold text-slate-800">Rp {totalPayroll.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Slip Digenerate</span>
              <span className="text-xs font-bold text-slate-700">{(payrolls || []).length}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Sudah Dibayar</span>
              <span className="text-xs font-bold text-emerald-600">{paidPayroll}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Belum Dibayar</span>
              <span className="text-xs font-bold text-amber-600">{(payrolls || []).length - paidPayroll}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Pipeline Rekrutmen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Status lowongan dan pelamar</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-700">Total Pelamar</span>
              <span className="text-xl font-extrabold text-slate-800">{totalApplications || 0}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Lowongan Aktif</span>
              <span className="text-xs font-bold text-slate-700">{openJobs || 0}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500">Menunggu Review</span>
              <span className="text-xs font-bold text-amber-600">{pendingApplications || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Lowongan</span>
              <span className="text-xs font-bold text-slate-700">{totalJobs || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
