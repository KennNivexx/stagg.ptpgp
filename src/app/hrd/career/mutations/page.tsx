import { supabaseAdmin } from "@/lib/supabase";
import { ArrowLeftRight, Plus, Clock, CheckCircle, XCircle, Building, Calendar, User } from "lucide-react";

export default async function MutationsPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const mutations: Array<Record<string, unknown>> = [];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Mutasi Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola mutasi dan rotasi penempatan karyawan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Ajukan Mutasi
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><ArrowLeftRight size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Mutasi</p>
              <p className="text-xl font-extrabold text-slate-800">{mutations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Disetujui</p>
              <p className="text-xl font-extrabold text-slate-800">{mutations.filter((m) => m.status === "Disetujui").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu</p>
              <p className="text-xl font-extrabold text-slate-800">{mutations.filter((m) => m.status === "Pending").length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Pengajuan Mutasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat dan status pengajuan mutasi karyawan</p>
          </div>

          {mutations.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowLeftRight size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data mutasi karyawan.</p>
              <p className="text-xs text-slate-400 mt-1">Gunakan formulir di samping untuk mengajukan mutasi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dari Dept</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ke Dept</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Efektif</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mutations.map((m) => (
                    <tr key={m.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(m.employee as string)?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{m.employee as string}</p>
                            <p className="text-[10px] text-slate-400">{m.fromPosition as string}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{m.fromDept as string}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <ArrowLeftRight size={10} className="text-[#CC0000]" />
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">{m.toDept as string}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{m.effectiveDate as string}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          m.status === "Disetujui" ? "bg-emerald-50 text-emerald-700" :
                          m.status === "Ditolak" ? "bg-red-50 text-red-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {m.status as string}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Setujui"><CheckCircle size={12} /></button>
                          <button className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Tolak"><XCircle size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Pengajuan Mutasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ajukan mutasi untuk karyawan</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
              <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Karyawan</option>
                {employees?.map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>{e.full_name as string} - {e.department as string}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dari Departemen</label>
                <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih</option>
                  {departments?.map((d: Record<string, unknown>) => (
                    <option key={d.name as string} value={d.name as string}>{d.name as string}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ke Departemen</label>
                <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih</option>
                  {departments?.map((d: Record<string, unknown>) => (
                    <option key={d.name as string} value={d.name as string}>{d.name as string}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Efektif</label>
              <input type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alasan Mutasi</label>
              <textarea rows={3} placeholder="Jelaskan alasan mutasi..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
              <Plus size={14} /> Ajukan Mutasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
