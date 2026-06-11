import { supabaseAdmin } from "@/lib/supabase";
import { FileText, GraduationCap, Clock, TrendingUp, Users } from "lucide-react";

export default async function LaporanPelatihan() {
  const trainingStats = [
    { label: "Total Program", value: 0, icon: GraduationCap, color: "bg-blue-50 text-blue-600" },
    { label: "Peserta Selesai", value: 0, icon: Users, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Jam", value: 0, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Rata-rata Biaya", value: "Rp 0", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Pelatihan</h1>
        <p className="text-sm text-gray-500">Statistik penyelesaian pelatihan, jam partisipan, dan biaya per pelatihan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trainingStats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${stat.color} rounded-xl`}><stat.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Program Pelatihan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik per program</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="month" className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Program</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Peserta</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Selesai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Jam</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Biaya</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <GraduationCap size={40} className="mx-auto text-slate-300 mb-4" />
                    <p className="text-sm text-slate-500">Belum ada data pelatihan.</p>
                    <p className="text-xs text-slate-400 mt-1">Tambahkan program pelatihan untuk melihat laporan.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik pelatihan</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Program</span>
                <span className="text-sm font-extrabold text-slate-800">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Peserta Terdaftar</span>
                <span className="text-sm font-extrabold text-blue-600">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Completion Rate</span>
                <span className="text-sm font-extrabold text-emerald-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Avg Jam/Peserta</span>
                <span className="text-sm font-extrabold text-amber-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Biaya</span>
                <span className="text-sm font-extrabold text-red-600">Rp 0</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Completion Rate</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tingkat penyelesaian</p>
            </div>
            <div className="p-8 text-center">
              <div className="text-5xl font-extrabold text-slate-300 mb-2">-</div>
              <p className="text-xs text-slate-400">Belum ada data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
