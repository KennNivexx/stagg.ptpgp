import { supabaseAdmin } from "@/lib/supabase";
import { Target, TrendingUp, Star, Award, Users, Eye } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default async function HRDPerformance() {
  const { data: evaluations, error } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("*, employees!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(30);

  const { count: totalEmployees } = await supabaseAdmin
    .from("employees")
    .select("*", { count: "exact", head: true });

  const avgScore = evaluations && evaluations.length > 0
    ? (evaluations.filter((e: Record<string, unknown>) => e.score != null)
        .reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.score) || 0), 0) /
       evaluations.filter((e: Record<string, unknown>) => e.score != null).length)
    : 0;

  const evaluatedEmployees = new Set((evaluations || []).map((e: Record<string, unknown>) => e.employee_id)).size;

  const topScore = (() => {
    const scores = (evaluations || []).filter((e: Record<string, unknown>) => e.score != null)
      .map((e: Record<string, unknown>) => Number(e.score) || 0);
    return scores.length > 0 ? Math.max(...scores) : 0;
  })();

  const pendingEvals = (evaluations || []).filter((e: Record<string, unknown>) => e.status === "Pending" || e.status === "Draft").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Performance Appraisal</h1>
        <p className="text-sm text-gray-500">Penilaian kinerja dan evaluasi karyawan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Evaluasi</p>
              <p className="text-xl font-extrabold text-slate-800">{evaluations?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Skor</p>
              <p className="text-xl font-extrabold text-slate-800">{avgScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Award size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Skor Tertinggi</p>
              <p className="text-xl font-extrabold text-slate-800">{topScore || "-"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Dinilai</p>
              <p className="text-xl font-extrabold text-slate-800">{evaluatedEmployees}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">dari {totalEmployees || 0} karyawan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Evaluasi Kinerja</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {pendingEvals > 0 ? `${pendingEvals} evaluasi menunggu diproses` : "Semua evaluasi telah diproses"}
            </p>
          </div>
        </div>

        {error ? (
          <div className="p-12 text-center text-red-600 text-sm">{error.message}</div>
        ) : !evaluations || evaluations.length === 0 ? (
          <EmptyState icon={Star} title="Belum ada data evaluasi kinerja." description="Buat evaluasi baru untuk memulai penilaian kinerja karyawan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Skor</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nilai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(evaluations as Record<string, unknown>[]).map((ev) => {
                  const emp = ev.employees as Record<string, string> | undefined;
                  const score = Number(ev.score) || 0;
                  return (
                    <tr key={ev.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {emp?.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                            <p className="text-[10px] text-slate-400">{emp?.department || "-"} - {emp?.position || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{ev.period as string || "-"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-0.5 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={10}
                              className={star <= score / 20 ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800">{score}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          score >= 80 ? "bg-emerald-50 text-emerald-700" :
                          score >= 60 ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }`}>
                          {score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          ev.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                          ev.status === "Pending" || ev.status === "Draft" ? "bg-amber-50 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {ev.status === "Approved" ? "Disetujui" :
                           ev.status === "Pending" ? "Pending" :
                           ev.status === "Draft" ? "Draft" : (ev.status as string) || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="p-2 rounded-lg text-slate-300 cursor-not-allowed inline-flex" title="Segera tersedia">
                          <Eye size={14} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs text-slate-500">Total: <span className="font-bold text-slate-800">{evaluations?.length || 0}</span> evaluasi</p>
        </div>
      </div>
    </div>
  );
}
