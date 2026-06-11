import { supabaseAdmin } from "@/lib/supabase";
import { UserX, Clock, CheckCircle2, XCircle, FileText, Calendar } from "lucide-react";

export default async function PengunduranDiri() {
  const { data: resignedEmployees } = await supabaseAdmin
    .from("employees")
    .select("*")
    .eq("status", "Resigned")
    .order("full_name");

  const { data: activeEmployees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .neq("status", "Resigned")
    .order("full_name");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengunduran Diri</h1>
        <p className="text-sm text-gray-500">Kelola proses pengunduran diri, exit interview, dan clearance checklist.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Proses</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Disetujui</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><XCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ditolak</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl"><UserX size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Telah Resign</p>
              <p className="text-xl font-extrabold text-slate-800">{resignedEmployees?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Karyawan Resign</h3>
            <p className="text-xs text-slate-400 mt-0.5">Karyawan dengan status resign</p>
          </div>

          {!resignedEmployees || resignedEmployees.length === 0 ? (
            <div className="p-12 text-center">
              <UserX size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada karyawan yang mengundurkan diri.</p>
              <p className="text-xs text-slate-400 mt-1">Data akan muncul saat ada karyawan dengan status resign.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departemen</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Bergabung</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {resignedEmployees.map((emp: Record<string, unknown>) => (
                    <tr key={emp.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <p className="text-xs font-bold text-slate-800">{emp.full_name as string}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{emp.position as string || "-"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                          {emp.department as string || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {emp.join_date ? new Date(emp.join_date as string).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold">
                          Resign
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                          Detail
                        </button>
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
            <h3 className="font-extrabold text-slate-800 text-sm">Proses Pengunduran Diri</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir pemrosesan resign</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                <option value="">Pilih karyawan...</option>
                {(activeEmployees || []).map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Resign</label>
              <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Alasan</label>
              <textarea rows={2} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Alasan pengunduran diri..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Exit Interview</label>
              <textarea rows={2} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Hasil exit interview..." />
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors">
                Setujui
              </button>
              <button className="flex-1 px-4 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors">
                Tolak
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Clearance Checklist</h3>
          <p className="text-xs text-slate-400 mt-0.5">Daftar item yang harus diselesaikan sebelum resign</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              "Pengembalian aset perusahaan (laptop, HP, dll)",
              "Serah terima pekerjaan ke atasan",
              "Dokumen exit interview",
              "Penyelesaian administrasi HRD",
              "Pengembalian kartu akses / ID card",
              "Penyelesaian hak dan kewajiban finansial",
              "Nonaktifkan akun email dan sistem",
              "Formulir clearance ditandatangani semua pihak",
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                <input type="checkbox" className="accent-[#CC0000] w-4 h-4" />
                <span className="text-xs text-slate-700">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
