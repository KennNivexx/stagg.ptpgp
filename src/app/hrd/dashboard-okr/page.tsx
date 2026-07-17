import { supabaseAdmin } from "@/lib/supabase";
import { Users, Target, TrendingUp, Award, Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import RadialGauge from "@/components/charts/RadialGauge";
import RankedBar from "@/components/charts/RankedBar";

export default async function DashboardOKR() {
  const [
    { data: okrRaw, error: okrError },
    { data: employees },
    { data: departments },
    { count: totalEmployees },
    { count: totalDepartments },
  ] = await Promise.all([
    supabaseAdmin.from("okr").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("karyawan").select("id, full_name, department, status"),
    supabaseAdmin.from("departemen").select("*"),
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("departemen").select("*", { count: "exact", head: true }),
  ]);

  // okr_objectives may not exist yet in some environments (migration 20260621002) - degrade gracefully.
  const evals = (okrError ? [] : (okrRaw || [])) as Record<string, unknown>[];

  const deptList = (departments || []).length > 0
    ? (departments as Record<string, unknown>[])
    : [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string))].filter(Boolean).map((name) => ({
        name,
        id: name,
      }));

  const totalOKR = evals.length;
  const tercapai = evals.filter((e) => Number(e.progress) >= 80).length;
  const dalamProgress = evals.filter((e) => Number(e.progress) > 0 && Number(e.progress) < 80).length;
  const belumMulai = evals.filter((e) => e.progress == null || Number(e.progress) === 0).length;

  const deptOKR = deptList.map((dept: Record<string, unknown>) => {
    const name = (dept.name || dept.id) as string;
    const deptEmps = (employees || []).filter((e: Record<string, unknown>) => e.department === name);
    const deptEvals = evals.filter((e) => e.department === name);
    const avgProgress = deptEvals.length > 0
      ? deptEvals.reduce((s, e) => s + (Number(e.progress) || 0), 0) / deptEvals.length
      : 0;
    return {
      name,
      totalEmployees: deptEmps.length,
      totalOKR: deptEvals.length,
      avgScore: Math.round(avgProgress),
      target: 100,
    };
  }).filter((d) => d.totalOKR > 0);

  const periods = [...new Set(evals.map((e) => e.period as string).filter(Boolean))];
  const periodGroups = periods.map((period) => {
    const periodEvals = evals.filter((e) => e.period === period);
    const avg = periodEvals.length > 0
      ? Math.round(periodEvals.reduce((s, e) => s + (Number(e.progress) || 0), 0) / periodEvals.length)
      : 0;
    return { period, count: periodEvals.length, avgScore: avg };
  }).sort((a, b) => b.period.localeCompare(a.period));

  const stats = [
    { label: "Total OKR", value: totalOKR, icon: <Target size={18} />, color: "blue" },
    { label: "Tercapai", value: tercapai, icon: <CheckCircle2 size={18} />, color: "emerald" },
    { label: "Dalam Progress", value: dalamProgress, icon: <Clock size={18} />, color: "amber" },
    { label: "Belum Mulai", value: belumMulai, icon: <AlertCircle size={18} />, color: "red" },
  ];

  const colorMap: Record<string, { bg: string; text: string; bar: string; light: string }> = {
    blue: { bg: "bg-blue-500", text: "text-blue-600", bar: "bg-blue-500", light: "bg-blue-50" },
    emerald: { bg: "bg-emerald-500", text: "text-emerald-600", bar: "bg-emerald-500", light: "bg-emerald-50" },
    amber: { bg: "bg-amber-500", text: "text-amber-600", bar: "bg-amber-500", light: "bg-amber-50" },
    red: { bg: "bg-red-500", text: "text-red-600", bar: "bg-red-500", light: "bg-red-50" },
    purple: { bg: "bg-purple-500", text: "text-purple-600", bar: "bg-purple-500", light: "bg-purple-50" },
    indigo: { bg: "bg-indigo-500", text: "text-indigo-600", bar: "bg-indigo-500", light: "bg-indigo-50" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">OKR Dashboard</h1>
        <p className="text-sm text-gray-500">Pantau objectives dan key results berdasarkan departemen dan periode.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Karyawan</p>
              <p className="text-2xl font-extrabold text-slate-800">{totalEmployees || 0}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">aktif</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600"><Building2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Departemen</p>
              <p className="text-2xl font-extrabold text-slate-800">{totalDepartments || 0}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">unit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const c = colorMap[stat.color] || colorMap.blue;
          return (
            <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${c.light} ${c.text}`}>{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-slate-800">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Progress OKR per Departemen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Target vs Pencapaian per unit organisasi</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {deptOKR.length === 0 ? (
              <div className="col-span-full">
                <EmptyState icon={Target} title="Belum ada data OKR per departemen." description="Lakukan evaluasi KPI untuk melihat progress di sini." />
              </div>
            ) : (
              deptOKR.map((dept) => {
                const pct = dept.target > 0 ? Math.min(Math.round((dept.avgScore / dept.target) * 100), 100) : 0;
                return (
                  <div key={dept.name} className="flex flex-col items-center">
                    <RadialGauge value={pct} label={dept.name} size={120} sublabel={`${dept.totalEmployees} karyawan`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Periode Evaluasi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ringkasan skor per periode</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {periodGroups.length === 0 ? (
              <EmptyState icon={Clock} title="Belum ada periode evaluasi." className="py-6" />
            ) : (
              periodGroups.map((pg) => (
                <div key={pg.period} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{pg.period}</p>
                    <p className="text-[10px] text-slate-400">{pg.count} evaluasi</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-slate-800">{pg.avgScore}</p>
                    <p className="text-[10px] text-slate-400">rata-rata</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Status Keseluruhan</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${tercapai >= totalOKR * 0.6 ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className={`text-[10px] font-bold ${tercapai >= totalOKR * 0.6 ? "text-emerald-600" : "text-amber-600"}`}>
                  {totalOKR > 0 ? `${Math.round((tercapai / totalOKR) * 100)}% Tercapai` : "Belum Ada Data"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-amber-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Skor OKR</h3>
              <p className="text-xs text-slate-400 mt-0.5">Sebaran pencapaian seluruh evaluasi</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {evals.length === 0 ? (
            <EmptyState icon={Award} title="Belum ada data evaluasi OKR." description="Buat evaluasi KPI untuk melihat distribusi skor." />
          ) : (
            <RankedBar
              data={[
                { label: "0-20 · Sangat Rendah", value: evals.filter((e) => (Number(e.progress) || 0) <= 20).length, color: "var(--chart-status-critical)" },
                { label: "21-40 · Rendah", value: evals.filter((e) => (Number(e.progress) || 0) > 20 && (Number(e.progress) || 0) <= 40).length, color: "var(--chart-status-serious)" },
                { label: "41-60 · Cukup", value: evals.filter((e) => (Number(e.progress) || 0) > 40 && (Number(e.progress) || 0) <= 60).length, color: "var(--chart-status-warning)" },
                { label: "61-80 · Baik", value: evals.filter((e) => (Number(e.progress) || 0) > 60 && (Number(e.progress) || 0) <= 80).length, color: "var(--chart-status-good)" },
                { label: "81-100 · Sangat Baik", value: evals.filter((e) => (Number(e.progress) || 0) > 80).length, color: "var(--chart-1)" },
              ]}
              height={220}
              barLabel="Evaluasi"
            />
          )}
        </div>
      </div>
    </div>
  );
}
