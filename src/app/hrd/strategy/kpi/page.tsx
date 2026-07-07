import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, Target, Users, Building2, Award, CheckCircle2, Star, AlertCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default async function KPIStrategis() {
  const { data: evaluations } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("*, employees!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department")
    .neq("status", "Inactive");

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("*");

  const evals = (evaluations || []) as Record<string, unknown>[];
  const avgScore = evals.length > 0
    ? Math.round(evals.filter((e) => e.score != null).reduce((s, e) => s + (Number(e.score) || 0), 0) / evals.filter((e) => e.score != null).length)
    : 0;

  const aboveTarget = evals.filter((e) => Number(e.score) >= 80).length;
  const belowTarget = evals.filter((e) => Number(e.score) < 60 && e.score != null).length;

  const deptList = (departments || []).length > 0
    ? (departments as Record<string, unknown>[])
    : [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string))].filter(Boolean).map((name) => ({ name, id: name }));

  const deptKPIs = deptList.map((dept: Record<string, unknown>) => {
    const name = (dept.name || dept.id) as string;
    const deptEvals = evals.filter((e) => {
      const emp = e.employees as Record<string, string> | undefined;
      return emp?.department === name;
    });
    const deptAvg = deptEvals.length > 0
      ? Math.round(deptEvals.filter((e) => e.score != null).reduce((s, e) => s + (Number(e.score) || 0), 0) / deptEvals.filter((e) => e.score != null).length)
      : 0;
    return { name, total: deptEvals.length, avgScore: deptAvg, target: 80 };
  }).filter((d) => d.total > 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">KPI Strategis</h1>
        <p className="text-sm text-gray-500">Pantau key performance indicators strategis berdasarkan departemen dan individu.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total KPI Dinilai", value: evals.length, icon: <Target size={18} />, color: "blue" },
          { label: "Rata-rata Skor", value: avgScore, icon: <TrendingUp size={18} />, color: "emerald" },
          { label: "Di Atas Target", value: aboveTarget, icon: <CheckCircle2 size={18} />, color: "amber" },
          { label: "Perlu Perhatian", value: belowTarget, icon: <AlertCircle size={18} />, color: "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                stat.color === "amber" ? "bg-amber-50 text-amber-600" :
                "bg-red-50 text-red-600"
              }`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">KPI per Departemen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Target vs pencapaian per unit</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            {deptKPIs.length === 0 ? (
              <EmptyState icon={Building2} title="Belum ada data KPI departemen." description="Lakukan evaluasi KPI untuk melihat ringkasan di sini." />
            ) : (
              deptKPIs.map((dkpi) => {
                const pct = dkpi.target > 0 ? Math.min(Math.round((dkpi.avgScore / dkpi.target) * 100), 100) : 0;
                const isOnTrack = pct >= 75;
                return (
                  <div key={dkpi.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-700">{dkpi.name}</span>
                        <span className="text-[10px] text-slate-400">({dkpi.total} evaluasi)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400">Target: <span className="font-bold text-slate-700">{dkpi.target}</span></span>
                        <span className={`text-[10px] font-bold ${isOnTrack ? "text-emerald-600" : "text-red-600"}`}>Skor: {dkpi.avgScore}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isOnTrack ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.max(pct, 3)}%` }} />
                      </div>
                      <span className={`text-xs font-bold w-10 text-right ${isOnTrack ? "text-emerald-600" : "text-red-600"}`}>{pct}%</span>
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
              <Users size={16} className="text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Top Performers</h3>
                <p className="text-xs text-slate-400 mt-0.5">KPI tertinggi dari evaluasi terbaru</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {evals.length === 0 ? (
              <EmptyState icon={Star} title="Belum ada evaluasi KPI." />
            ) : (
              evals
                .filter((e) => e.score != null)
                .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
                .slice(0, 10)
                .map((ev: Record<string, unknown>, idx: number) => {
                  const emp = ev.employees as Record<string, string> | undefined;
                  const score = Number(ev.score) || 0;
                  return (
                    <div key={ev.id as string} className="px-5 py-3 hover:bg-slate-50/30 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 w-4">{idx + 1}</span>
                        <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {emp?.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{emp?.full_name || "Unknown"}</p>
                          <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={8} className={star <= score / 20 ? "text-amber-400 fill-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                        <span className={`text-[10px] font-bold ${score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}>{score}</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-amber-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Pencapaian KPI</h3>
              <p className="text-xs text-slate-400 mt-0.5">Klasifikasi berdasarkan skor evaluasi</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Sangat Baik (81-100)", count: evals.filter((e) => (Number(e.score) || 0) > 80).length, color: "bg-emerald-500", text: "text-emerald-600" },
              { label: "Baik (61-80)", count: evals.filter((e) => (Number(e.score) || 0) > 60 && (Number(e.score) || 0) <= 80).length, color: "bg-blue-500", text: "text-blue-600" },
              { label: "Cukup (41-60)", count: evals.filter((e) => (Number(e.score) || 0) > 40 && (Number(e.score) || 0) <= 60).length, color: "bg-amber-500", text: "text-amber-600" },
              { label: "Kurang (0-40)", count: evals.filter((e) => (Number(e.score) || 0) <= 40 && e.score != null).length, color: "bg-red-500", text: "text-red-600" },
            ].map((bucket) => (
              <div key={bucket.label} className="bg-white rounded-xl border border-slate-100 p-4 text-center">
                <div className={`h-1.5 w-full rounded-full ${bucket.color} mb-3`} />
                <p className="text-[10px] text-slate-500">{bucket.label}</p>
                <p className={`text-lg font-extrabold ${bucket.text} mt-1`}>{bucket.count}</p>
                <p className="text-[10px] text-slate-400">evaluasi</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
