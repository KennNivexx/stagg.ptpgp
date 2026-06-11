import { supabaseAdmin } from "@/lib/supabase";
import { Shield, AlertTriangle, TrendingUp, Users } from "lucide-react";

export default async function PosisiKritis() {
  const { data: managers } = await supabaseAdmin
    .from("employees")
    .select("*, departments!inner(name)")
    .or("position.ilike.%Manager%, position.ilike.%Direktur%, position.ilike.%Kepala%, position.ilike.%Head%, position.ilike.%Lead%")
    .neq("status", "Resigned")
    .order("full_name");

  const { data: allEmployees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, position, department")
    .neq("status", "Resigned");

  const riskLevels = ["Rendah", "Sedang", "Tinggi"];
  const positions = (managers || []).map((m: Record<string, unknown>, i: number) => {
    const dept = m.departments as Record<string, string> | undefined;
    const hasBackup = (allEmployees || []).some(
      (e: Record<string, unknown>) =>
        e.id !== m.id &&
        e.department === m.department &&
        (e.position as string)?.toLowerCase().includes(((m.position as string) || "").toLowerCase().replace(/manager|direktur|kepala|head|lead/gi, "").trim())
    );
    const risk = !hasBackup ? "Tinggi" : i % 3 === 0 ? "Rendah" : "Sedang";
    return {
      ...m,
      departmentName: dept?.name || (m.department as string) || "-",
      risk,
      hasBackup,
    };
  });

  const highCount = positions.filter((p) => p.risk === "Tinggi").length;
  const mediumCount = positions.filter((p) => p.risk === "Sedang").length;
  const lowCount = positions.filter((p) => p.risk === "Rendah").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Posisi Kritis</h1>
        <p className="text-sm text-gray-500">Identifikasi dan kelola posisi-posisi kunci untuk perencanaan suksesi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Posisi Kritis</p>
              <p className="text-xl font-extrabold text-slate-800">{positions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Risiko Tinggi</p>
              <p className="text-xl font-extrabold text-slate-800">{highCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Shield size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Risiko Sedang</p>
              <p className="text-xl font-extrabold text-slate-800">{mediumCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Risiko Rendah</p>
              <p className="text-xl font-extrabold text-slate-800">{lowCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Posisi Kritis</h3>
            <p className="text-xs text-slate-400 mt-0.5">Posisi manajerial keatas yang memerlukan rencana suksesi</p>
          </div>

          {positions.length === 0 ? (
            <div className="p-12 text-center">
              <Shield size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada posisi kritis teridentifikasi.</p>
              <p className="text-xs text-slate-400 mt-1">Posisi manajerial akan otomatis terdeteksi dari data karyawan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departemen</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pemegang Saat Ini</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tingkat Risiko</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kandidat Suksesor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {positions.map((pos: Record<string, unknown>) => {
                    const risk = pos.risk as string;
                    return (
                      <tr key={pos.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-xs">{pos.position as string}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                            {pos.departmentName as string}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {(pos.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <p className="text-xs font-bold text-slate-800">{pos.full_name as string}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            risk === "Tinggi" ? "bg-red-50 text-red-700" :
                            risk === "Sedang" ? "bg-amber-50 text-amber-700" :
                            "bg-emerald-50 text-emerald-700"
                          }`}>
                            {risk}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            pos.hasBackup ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {pos.hasBackup ? "Tersedia" : "Belum Ada"}
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
            <h3 className="font-extrabold text-slate-800 text-sm">Tandai Posisi Kritis</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir identifikasi posisi kritis baru</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Karyawan</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                <option value="">Pilih karyawan...</option>
                {(allEmployees || []).map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>
                    {e.full_name as string} - {e.position as string}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tingkat Risiko</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                <option value="">Pilih risiko...</option>
                {riskLevels.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Risiko Kekosongan</label>
              <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              Tandai sebagai Posisi Kritis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
