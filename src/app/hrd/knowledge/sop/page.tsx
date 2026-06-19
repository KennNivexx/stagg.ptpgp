import { supabaseAdmin } from "@/lib/supabase";
import { BookOpen, Plus, Search, FileText, Clock, Building } from "lucide-react";

export default async function SOPPage() {
  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const sopCategories = ["Semua", ...(departments || []).map((d: Record<string, unknown>) => d.name as string)];

  const sopData: Array<Record<string, unknown>> = [];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Standard Operating Procedure</h1>
          <p className="text-sm text-gray-500">Dokumen SOP dan prosedur kerja perusahaan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Tambah SOP Baru
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {sopCategories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              cat === "Semua"
                ? "bg-[#CC0000] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-[#CC0000] hover:text-[#CC0000]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total SOP" value={sopData.length} color="bg-blue-50 text-blue-600" />
        <StatCard icon={FileText} label="SOP Aktif" value={sopData.filter((s) => s.status === "Aktif").length} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock} label="Dalam Revisi" value={sopData.filter((s) => s.status === "Revisi").length} color="bg-amber-50 text-amber-600" />
        <StatCard icon={Building} label="Departemen" value={departments?.length || 0} color="bg-purple-50 text-purple-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar SOP</h3>
            <p className="text-xs text-slate-400 mt-0.5">Dokumen prosedur standar operasional</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SOP..."
              className="pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">No. SOP</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Judul</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Versi</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Terakhir Diperbarui</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sopData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <BookOpen size={40} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm text-slate-500">SOP management coming soon.</p>
                    <p className="text-xs text-slate-400 mt-1">Fitur pengelolaan SOP akan tersedia dalam waktu dekat.</p>
                  </td>
                </tr>
              ) : (
                sopData.map((sop) => (
                  <tr key={sop.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-[#CC0000]">{sop.id as string}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">{sop.title as string}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{sop.department as string}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{sop.version as string}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{sop.lastUpdated as string}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        sop.status === "Aktif" ? "bg-emerald-50 text-emerald-700" :
                        sop.status === "Revisi" ? "bg-amber-50 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {sop.status as string}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        Lihat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Tambah SOP Baru</h3>
          <p className="text-xs text-slate-400 mt-0.5">Formulir penambahan dokumen SOP</p>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nomor SOP</label>
            <input type="text" placeholder="SOP-XXX" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul SOP</label>
            <input type="text" placeholder="Nama prosedur" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Departemen</label>
            <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
              <option value="">Pilih Departemen</option>
              {departments?.map((d: Record<string, unknown>) => (
                <option key={d.name as string} value={d.name as string}>{d.name as string}</option>
              )) || <option>Operasional</option>}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Versi</label>
            <input type="text" placeholder="v1.0" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi</label>
            <textarea rows={3} placeholder="Deskripsi prosedur..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
          </div>
          <div className="md:col-span-2">
            <button className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
              <Plus size={14} /> Simpan SOP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ size?: number }>; label: string; value: number; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}><Icon size={18} /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
          <p className="text-xl font-extrabold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
