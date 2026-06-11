import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Clock, CheckCircle2, History, Plus } from "lucide-react";

export default async function PerubahanKebijakan() {
  const { data: managers } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, position")
    .or("position.ilike.%Manager%, position.ilike.%Direktur%, position.ilike.%Head%")
    .neq("status", "Resigned")
    .order("full_name")
    .limit(10);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Perubahan Kebijakan</h1>
        <p className="text-sm text-gray-500">Kelola log perubahan kebijakan, draft kebijakan baru, dan riwayat versi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Kebijakan Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Draft</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><History size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Perubahan Bulan Ini</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Approval</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Log Perubahan Kebijakan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat semua perubahan kebijakan</p>
          </div>

          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada perubahan kebijakan tercatat.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan formulir di samping untuk membuat draft kebijakan baru.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Draft Kebijakan Baru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir pembuatan kebijakan</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Kebijakan</label>
              <input type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Masukkan nama kebijakan..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Versi</label>
              <input type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="v1.0" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Deskripsi Perubahan</label>
              <textarea rows={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Jelaskan perubahan yang diusulkan..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Efektif</label>
              <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Approver</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                <option value="">Pilih approver...</option>
                {(managers || []).map((m: Record<string, unknown>) => (
                  <option key={m.id as string} value={m.id as string}>{m.full_name as string}</option>
                ))}
              </select>
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
              <Plus size={14} /> Simpan Draft
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Versi Kebijakan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tracking perubahan versi kebijakan perusahaan</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <History size={14} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Belum ada riwayat versi</span>
            </div>
            <p className="text-[10px] text-slate-400">Versi kebijakan akan tercatat saat draft pertama disimpan.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs font-bold text-slate-700 mb-1">Sistem Versioning</p>
            <p className="text-[10px] text-slate-400">Setiap perubahan akan disimpan sebagai versi baru (v1.0, v1.1, v2.0) dengan timestamp dan approver.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
