import { supabaseAdmin } from "@/lib/supabase";
import { RefreshCw, TrendingUp, Clock, CheckCircle2, Target, Users } from "lucide-react";

export default async function InisiatifPerubahan() {
  const { data: managers } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, position")
    .or("position.ilike.%Manager%, position.ilike.%Direktur%, position.ilike.%Head%")
    .neq("status", "Resigned")
    .order("full_name")
    .limit(10);

  const statuses = ["Perencanaan", "Berjalan", "Tertunda", "Selesai"];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Inisiatif Perubahan</h1>
        <p className="text-sm text-gray-500">Kelola inisiatif perubahan organisasi, lacak progres, dan kelola timeline.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Inisiatif</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Berjalan</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tertunda</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Selesai</p>
              <p className="text-xl font-extrabold text-slate-800">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Inisiatif Perubahan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Proyek perubahan organisasi</p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none">
              <option value="">Semua Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="p-12 text-center">
            <RefreshCw size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada inisiatif perubahan.</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan formulir di samping untuk menambahkan inisiatif baru.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Inisiatif</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir inisiatif perubahan baru</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Inisiatif</label>
              <input type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Masukkan nama inisiatif..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tujuan</label>
              <textarea rows={2} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Tujuan dari inisiatif ini..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Sponsor</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                <option value="">Pilih sponsor...</option>
                {(managers || []).map((m: Record<string, unknown>) => (
                  <option key={m.id as string} value={m.id as string}>{m.full_name as string} - {m.position as string}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tgl Mulai</label>
                <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tgl Target</label>
                <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              Simpan Inisiatif
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Progres Tracker</h3>
          <p className="text-xs text-slate-400 mt-0.5">Pantau perkembangan setiap inisiatif</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Perencanaan", pct: 0, color: "bg-blue-500", icon: "📋" },
            { label: "Implementasi", pct: 0, color: "bg-amber-500", icon: "🔄" },
            { label: "Evaluasi", pct: 0, color: "bg-purple-500", icon: "📊" },
            { label: "Selesai", pct: 0, color: "bg-emerald-500", icon: "✅" },
          ].map((phase) => (
            <div key={phase.label} className="text-center p-4 bg-slate-50 rounded-xl">
              <p className="text-2xl mb-2">{phase.icon}</p>
              <p className="text-xs font-bold text-slate-800">{phase.label}</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{phase.pct}</p>
              <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${phase.color} rounded-full`} style={{ width: `${phase.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
