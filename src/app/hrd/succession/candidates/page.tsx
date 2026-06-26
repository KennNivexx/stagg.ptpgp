import { supabaseAdmin } from "@/lib/supabase";
import { Users, TrendingUp, Award, Star } from "lucide-react";

export default async function KandidatSuksesor() {
  const { data: managers } = await supabaseAdmin
    .from("employees")
    .select("*")
    .or("position.ilike.%Manager%, position.ilike.%Direktur%, position.ilike.%Kepala%, position.ilike.%Head%, position.ilike.%Lead%")
    .neq("status", "Resigned")
    .order("full_name");

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("*, kpi_evaluations(score)")
    .neq("status", "Resigned")
    .order("full_name");

  const { data: evaluations } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("employee_id, score")
    .order("created_at", { ascending: false });

  const employeeScores: Record<string, number> = {};
  const scoreCounts: Record<string, number> = {};
  (evaluations || []).forEach((e: Record<string, unknown>) => {
    const eid = e.employee_id as string;
    employeeScores[eid] = (employeeScores[eid] || 0) + (Number(e.score) || 0);
    scoreCounts[eid] = (scoreCounts[eid] || 0) + 1;
  });

  const getAvgScore = (id: string) => {
    if (!scoreCounts[id]) return 0;
    return Math.round(employeeScores[id] / scoreCounts[id]);
  };

  const getReadiness = (score: number) => Math.min(100, Math.max(10, score || 10));

  const candidates = (employees || [])
    .map((emp: Record<string, unknown>) => ({
      ...emp,
      avgScore: getAvgScore(emp.id as string),
      readiness: getReadiness(getAvgScore(emp.id as string)),
    }))
    .filter((emp: Record<string, unknown>) => (emp.avgScore as number) >= 50)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.avgScore as number) - (a.avgScore as number))
    .slice(0, 20);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Kandidat Suksesor</h1>
        <p className="text-sm text-gray-500">Daftar kandidat potensial untuk mengisi posisi-posisi kritis.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Posisi Kritis</p>
              <p className="text-xl font-extrabold text-slate-800">{managers?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Star size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kandidat Potensial</p>
              <p className="text-xl font-extrabold text-slate-800">{candidates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Siap Segera</p>
              <p className="text-xl font-extrabold text-slate-800">
                {candidates.filter((c: Record<string, unknown>) => (c.readiness as number) >= 80).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Award size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Skor</p>
              <p className="text-xl font-extrabold text-slate-800">
                {candidates.length > 0
                  ? Math.round(candidates.reduce((s: number, c: Record<string, unknown>) => s + (c.avgScore as number), 0) / candidates.length)
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Kandidat Suksesor</h3>
            <p className="text-xs text-slate-400 mt-0.5">Kandidat dengan performa tinggi dan potensi kepemimpinan</p>
          </div>

          {candidates.length === 0 ? (
            <div className="p-12 text-center">
              <Star size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada kandidat suksesor teridentifikasi.</p>
              <p className="text-xs text-slate-400 mt-1">Lakukan evaluasi KPI untuk mengidentifikasi kandidat potensial.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Posisi Saat Ini</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departemen</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tingkat Kesiapan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Skor Kinerja</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kebutuhan Pengembangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {candidates.map((c: Record<string, unknown>) => {
                    const readiness = c.readiness as number;
                    const score = c.avgScore as number;
                    return (
                      <tr key={c.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {(c.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <p className="text-xs font-bold text-slate-800">{c.full_name as string}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{c.position as string || "-"}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                            {c.department as string || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  readiness >= 80 ? "bg-emerald-500" :
                                  readiness >= 60 ? "bg-amber-500" :
                                  "bg-red-500"
                                }`}
                                style={{ width: `${readiness}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 w-8">{readiness}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={10}
                                className={star <= score / 20 ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                              />
                            ))}
                            <span className="text-[10px] font-bold text-slate-600 ml-1">{score}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            readiness >= 80 ? "bg-emerald-50 text-emerald-700" :
                            readiness >= 60 ? "bg-amber-50 text-amber-700" :
                            "bg-red-50 text-red-700"
                          }`}>
                            {readiness >= 80 ? "Siap" :
                             readiness >= 60 ? "Pengembangan Kepemimpinan" : "Perlu Pelatihan Intensif"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Kandidat</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tambahkan kandidat ke rencana suksesi</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Karyawan</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                <option value="">Pilih karyawan...</option>
                {(employees || []).map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Posisi Target Suksesi</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                <option value="">Pilih posisi target...</option>
                {(managers || []).map((m: Record<string, unknown>) => (
                  <option key={m.id as string} value={m.id as string}>{m.position as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tingkat Kesiapan (%)</label>
              <input type="number" min="0" max="100" placeholder="0-100" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
            </div>
            <span className="w-full px-4 py-2.5 bg-slate-300 text-white text-xs font-bold rounded-xl cursor-not-allowed inline-flex items-center justify-center" title="Segera tersedia">
              Tambah ke Rencana Suksesi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
