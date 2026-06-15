import { supabaseAdmin } from "@/lib/supabase";
import { FileText, TrendingUp, Award, Users, Download, Building, Star, Target } from "lucide-react";

export default async function PerformanceReportsPage() {
  const { data: evaluations } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("*, employees!inner(full_name, department, position)")
    .limit(100);


  const totalEval = evaluations?.length || 0;

  const avgScore = evaluations && evaluations.length > 0
    ? (evaluations.filter((e: Record<string, unknown>) => e.score != null)
        .reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.score) || 0), 0) /
       evaluations.filter((e: Record<string, unknown>) => e.score != null).length)
    : 0;

  const completed = evaluations?.filter((e: Record<string, unknown>) =>
    e.status === "Approved" || e.status === "Reviewed"
  ).length || 0;

  const uniqueEmployees = new Set(evaluations?.map((e: Record<string, unknown>) => e.employee_id)).size || 0;

  const deptBreakdown: Record<string, { count: number; total: number; avg: number; employees: Set<string> }> = {};
  evaluations?.forEach((ev: Record<string, unknown>) => {
    const emp = ev.employees as Record<string, string> | undefined;
    const dept = emp?.department || "Lainnya";
    if (!deptBreakdown[dept]) {
      deptBreakdown[dept] = { count: 0, total: 0, avg: 0, employees: new Set() };
    }
    deptBreakdown[dept].count++;
    deptBreakdown[dept].total += Number(ev.score) || 0;
    deptBreakdown[dept].employees.add(ev.employee_id as string);
  });

  Object.values(deptBreakdown).forEach((d) => {
    d.avg = d.count > 0 ? Math.round((d.total / d.count) * 10) / 10 : 0;
  });

  const deptColors: Record<string, string> = {
    Operasional: "bg-blue-500", SDM: "bg-emerald-500", Keuangan: "bg-amber-500",
    HSE: "bg-red-500", IT: "bg-purple-500", Marketing: "bg-indigo-500",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Kinerja</h1>
          <p className="text-sm text-gray-500">Ringkasan dan analisis performa seluruh karyawan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Download size={14} /> Ekspor Laporan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Evaluasi</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEval}</p>
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
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Award size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Review Selesai</p>
              <p className="text-xl font-extrabold text-slate-800">{completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Dinilai</p>
              <p className="text-xl font-extrabold text-slate-800">{uniqueEmployees}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Building size={16} className="text-[#CC0000]" />
              Perbandingan Skor per Departemen
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Rata-rata skor KPI berdasarkan departemen</p>
          </div>

          <div className="p-6 space-y-5">
            {Object.entries(deptBreakdown).map(([dept, data], i) => (
              <div key={dept}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${deptColors[dept] || "bg-slate-400"}`}></span>
                    <span className="text-xs font-semibold text-slate-700">{dept}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>{data.employees.size} karyawan</span>
                    <span>{data.count} evaluasi</span>
                    <span className="text-xs font-bold text-slate-800">{data.avg}</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-3 rounded-full ${deptColors[dept] || "bg-slate-500"}`}
                    style={{ width: `${Math.min((data.avg / 100) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}

            {Object.keys(deptBreakdown).length === 0 && (
              <div className="text-center py-8">
                <Target size={32} className="mx-auto text-slate-300 mb-3" />
                <p className="text-xs text-slate-500">Belum ada data evaluasi.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                Distribusi Skor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Kategori performa karyawan</p>
            </div>

            <div className="p-6">
              {(() => {
                const excellent = evaluations?.filter((e: Record<string, unknown>) => (Number(e.score) || 0) >= 80).length || 0;
                const good = evaluations?.filter((e: Record<string, unknown>) => {
                  const s = Number(e.score) || 0;
                  return s >= 60 && s < 80;
                }).length || 0;
                const needsImprove = evaluations?.filter((e: Record<string, unknown>) => {
                  const s = Number(e.score) || 0;
                  return s > 0 && s < 60;
                }).length || 0;

                const total = excellent + good + needsImprove || 1;

                return (
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-semibold text-emerald-700">Sangat Baik (80-100)</span>
                        <span className="font-bold text-slate-800">{excellent} evaluasi ({Math.round((excellent / total) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${(excellent / total) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-semibold text-amber-700">Baik (60-79)</span>
                        <span className="font-bold text-slate-800">{good} evaluasi ({Math.round((good / total) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${(good / total) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-semibold text-red-700">Perlu Peningkatan (0-59)</span>
                        <span className="font-bold text-slate-800">{needsImprove} evaluasi ({Math.round((needsImprove / total) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div className="bg-red-500 h-3 rounded-full" style={{ width: `${(needsImprove / total) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2">Ekspor Laporan</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              Unduh laporan kinerja lengkap dalam format PDF atau Excel untuk keperluan rapat manajemen dan audit.
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white text-slate-800 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-2">
                <Download size={12} /> PDF
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2">
                <Download size={12} /> Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


