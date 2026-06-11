import { supabaseAdmin } from "@/lib/supabase";
import { AlertTriangle, FileText, Clock, CheckCircle2 } from "lucide-react";

export default async function SuratPeringatan() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .neq("status", "Resigned")
    .order("full_name");

  const warningLevels = ["SP1", "SP2", "SP3"];
  const warningColors: Record<string, string> = {
    SP1: "bg-amber-50 text-amber-700",
    SP2: "bg-orange-50 text-orange-700",
    SP3: "bg-red-50 text-red-700",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Surat Peringatan</h1>
        <p className="text-sm text-gray-500">Kelola surat peringatan dan riwayat pelanggaran karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP1 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP2 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP3 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total SP Dikeluarkan</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Surat Peringatan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Riwayat surat peringatan karyawan</p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none">
              <option value="">Semua Level</option>
              {warningLevels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada surat peringatan tercatat.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan formulir di samping untuk menerbitkan surat peringatan.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Terbitkan Surat Peringatan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir penerbitan SP baru</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                <option value="">Pilih karyawan...</option>
                {(employees || []).map((e: Record<string, unknown>) => (
                  <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Level Peringatan</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                {warningLevels.map((l) => (
                  <option key={l} value={l}>{l} {l === "SP1" ? "- Peringatan Ringan" : l === "SP2" ? "- Peringatan Sedang" : "- Peringatan Berat"}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Penerbitan</label>
              <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Alasan</label>
              <textarea rows={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Jelaskan alasan pemberian surat peringatan..." />
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              Terbitkan Surat Peringatan
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat SP Per Karyawan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Lihat riwayat surat peringatan karyawan tertentu</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="max-w-md">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cari Karyawan</label>
            <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
              <option value="">Pilih karyawan untuk lihat riwayat...</option>
              {(employees || []).map((e: Record<string, unknown>) => (
                <option key={e.id as string} value={e.id as string}>{e.full_name as string} - {e.department as string}</option>
              ))}
            </select>
          </div>
          <div className="p-8 text-center bg-slate-50 rounded-xl">
            <CheckCircle2 size={32} className="mx-auto text-slate-300 mb-3" />
            <p className="text-xs text-slate-500">Pilih karyawan untuk melihat riwayat surat peringatan.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
