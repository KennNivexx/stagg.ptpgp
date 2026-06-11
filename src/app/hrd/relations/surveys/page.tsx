import { supabaseAdmin } from "@/lib/supabase";
import { Heart, BarChart3, ClipboardList, TrendingUp, Users } from "lucide-react";

export default async function SurveiKaryawan() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department")
    .neq("status", "Resigned")
    .order("full_name");

  const surveyTypes = [
    { id: "engagement", label: "Engagement", icon: Heart, desc: "Survei keterikatan karyawan" },
    { id: "satisfaction", label: "Kepuasan", icon: TrendingUp, desc: "Survei kepuasan kerja" },
    { id: "exit", label: "Exit Interview", icon: ClipboardList, desc: "Wawancara keluar karyawan" },
    { id: "training", label: "Feedback Pelatihan", icon: BarChart3, desc: "Umpan balik program pelatihan" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Survei Karyawan</h1>
        <p className="text-sm text-gray-500">Buat dan kelola survei engagement, kepuasan, dan feedback karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {surveyTypes.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-sm font-extrabold text-slate-800">{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Buat Survei Baru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Rancang survei untuk karyawan</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Judul Survei</label>
                <input type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Masukkan judul survei..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tipe Survei</label>
                <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                  {surveyTypes.map((s) => (
                    <option key={s.id} value={s.id}>{s.label} - {s.desc}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Mulai</label>
                <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Selesai</label>
                <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pertanyaan (pisahkan dengan baris baru)</label>
              <textarea rows={6} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="1. Bagaimana tingkat kepuasan Anda terhadap lingkungan kerja?&#10;2. Apakah Anda merasa dihargai dalam pekerjaan?&#10;3. Bagaimana hubungan Anda dengan atasan langsung?&#10;..."></textarea>
            </div>
            <button className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              Buat & Kirim Survei
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan Hasil Survei</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik hasil survei</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Survei Dibuat</span>
                <span className="text-sm font-extrabold text-slate-800">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Responden</span>
                <span className="text-sm font-extrabold text-slate-800">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Rata-rata Kepuasan</span>
                <span className="text-sm font-extrabold text-emerald-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Engagement Score</span>
                <span className="text-sm font-extrabold text-blue-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Response Rate</span>
                <span className="text-sm font-extrabold text-amber-600">-</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Tujuan Survei</h3>
              <p className="text-xs text-slate-400 mt-0.5">Target responden</p>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Departemen</label>
                <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                  <option value="">Semua Departemen</option>
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                <Users size={12} className="inline mr-1" />
                Total karyawan aktif: <span className="font-bold text-slate-800">{employees?.length || 0}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
