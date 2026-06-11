import { supabaseAdmin } from "@/lib/supabase";
import { Target, TrendingUp, Award, Star, Users, Plus, Eye, Filter } from "lucide-react";
import Link from "next/link";

export default async function KPIPage() {
  const { data: evaluations } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("*, employees!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(50);

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const avgScore = evaluations && evaluations.length > 0
    ? (evaluations.filter((e: Record<string, unknown>) => e.score != null)
        .reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.score) || 0), 0) /
       evaluations.filter((e: Record<string, unknown>) => e.score != null).length)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Manajemen KPI</h1>
          <p className="text-sm text-gray-500">Kelola target, evaluasi, dan penilaian KPI karyawan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Buat Evaluasi Baru
        </button>
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
              <p className="text-xl font-extrabold text-slate-800">
                {(() => {
                  const scores = evaluations?.filter((e: Record<string, unknown>) => e.score != null).map((e: Record<string, unknown>) => Number(e.score) || 0) || [];
                  return scores.length > 0 ? Math.max(...scores) : "-";
                })()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Dinilai</p>
              <p className="text-xl font-extrabold text-slate-800">
                {new Set(evaluations?.map((e: Record<string, unknown>) => e.employee_id)).size || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Evaluasi KPI</h3>
              <p className="text-xs text-slate-400 mt-0.5">Penilaian kinerja karyawan</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-600 focus:border-[#CC0000] outline-none">
                <option value="">Semua Periode</option>
                <option>Q1 2026</option>
                <option>Q2 2026</option>
                <option>Q3 2026</option>
                <option>Q4 2026</option>
              </select>
            </div>
          </div>

          {!evaluations || evaluations.length === 0 ? (
            <div className="p-12 text-center">
              <Target size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data evaluasi KPI.</p>
              <p className="text-xs text-slate-400 mt-1">Buat evaluasi baru untuk memulai penilaian kinerja.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {evaluations.map((ev: Record<string, unknown>) => {
                const emp = ev.employees as Record<string, string> | undefined;
                const score = Number(ev.score) || 0;
                return (
                  <div key={ev.id as string} className="p-6 hover:bg-slate-50/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {emp?.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{emp?.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400">{emp?.department || "-"} - {emp?.position || "-"}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Periode: {ev.period as string || "-"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex gap-0.5 justify-end mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={10}
                              className={star <= score / 20 ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          score >= 80 ? "bg-emerald-50 text-emerald-700" :
                          score >= 60 ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }`}>
                          Skor: {score}
                        </span>
                      </div>
                      <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Lihat Detail">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Evaluasi KPI</h3>
              <p className="text-xs text-slate-400 mt-0.5">Form penilaian baru</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
                <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Karyawan</option>
                  {employees?.map((emp: Record<string, unknown>) => (
                    <option key={emp.id as string} value={emp.id as string}>{emp.full_name as string} - {emp.department as string}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Periode</label>
                <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Periode</option>
                  <option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skor (0-100)</label>
                <input type="number" min="0" max="100" placeholder="Masukkan skor" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Komentar</label>
                <textarea rows={3} placeholder="Catatan evaluasi..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
              </div>
              <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Simpan Evaluasi
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Karyawan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Belum dinilai</p>
            </div>
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {!employees || employees.length === 0 ? (
                <div className="p-8 text-center">
                  <Users size={32} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-xs text-slate-500">Belum ada karyawan.</p>
                  <Link href="/hrd/employees/new" className="text-[10px] text-[#CC0000] font-bold hover:underline mt-2 inline-block">
                    + Tambah Karyawan
                  </Link>
                </div>
              ) : (
                employees.map((emp: Record<string, unknown>) => (
                  <div key={emp.id as string} className="px-6 py-4 hover:bg-slate-50/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{emp.full_name as string}</p>
                        <p className="text-[10px] text-slate-400">{emp.department as string}</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-bold text-[#CC0000] hover:text-[#aa0000] transition-colors">
                      Nilai
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
