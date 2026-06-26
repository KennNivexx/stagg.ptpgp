import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, Users, Star, Award } from "lucide-react";

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-50 text-emerald-700";
  if (score >= 60) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function gradeLabel(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

export default async function PerformanceReportsPage() {
  const { data: evaluations } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("*, employees!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);

  const evals = (evaluations || []) as Array<Record<string, unknown>>;
  const scores = evals.map((e) => Number(e.score) || 0);
  const avgScore = scores.length > 0 ? scores.reduce((s, n) => s + n, 0) / scores.length : 0;
  const topPerformers = evals.filter((e) => Number(e.score) >= 80).length;
  const needsImprovement = evals.filter((e) => Number(e.score) < 60).length;

  const byDept: Record<string, { total: number; sum: number }> = {};
  evals.forEach((e) => {
    const emp = e.employees as Record<string, string> | undefined;
    const dept = emp?.department || "—";
    if (!byDept[dept]) byDept[dept] = { total: 0, sum: 0 };
    byDept[dept].total++;
    byDept[dept].sum += Number(e.score) || 0;
  });
  const deptRows = Object.entries(byDept)
    .map(([dept, d]) => ({ dept, avg: d.total > 0 ? d.sum / d.total : 0, count: d.total }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Kinerja</h1>
        <p className="text-sm text-gray-500">Ringkasan penilaian kinerja dan evaluasi KPI seluruh karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Evaluasi", value: evals.length, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
          { label: "Rata-rata Skor", value: avgScore.toFixed(1), icon: Star, color: "bg-emerald-50 text-emerald-600" },
          { label: "Performa Baik (≥80)", value: topPerformers, icon: Award, color: "bg-amber-50 text-amber-600" },
          { label: "Perlu Perbaikan (<60)", value: needsImprovement, icon: Users, color: "bg-red-50 text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Skor per Departemen</h3>
            <p className="text-xs text-slate-400 mt-0.5">Rata-rata skor KPI per divisi</p>
          </div>
          {deptRows.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">Belum ada data evaluasi.</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {deptRows.map((row) => (
                <div key={row.dept} className="px-6 py-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{row.dept}</p>
                    <p className="text-[10px] text-slate-400">{row.count} evaluasi</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.avg >= 80 ? "bg-emerald-500" : row.avg >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(row.avg, 100)}%` }} />
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${scoreColor(row.avg)}`}>{row.avg.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Rincian Evaluasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">50 evaluasi terbaru</p>
          </div>
          {evals.length === 0 ? (
            <div className="p-12 text-center">
              <TrendingUp size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data evaluasi KPI.</p>
              <p className="text-xs text-slate-400 mt-1">Buat evaluasi di menu KPI &amp; Feedback untuk melihat laporan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["Karyawan", "Departemen", "Periode", "Skor", "Grade"].map((h) => (
                      <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {evals.map((ev) => {
                    const emp = ev.employees as Record<string, string> | undefined;
                    const score = Number(ev.score) || 0;
                    return (
                      <tr key={ev.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                          <p className="text-[10px] text-slate-400">{emp?.position || "-"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{emp?.department || "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">{(ev.period as string) || "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${scoreColor(score)}`}>{score}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-extrabold text-[#CC0000]">{gradeLabel(score)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
