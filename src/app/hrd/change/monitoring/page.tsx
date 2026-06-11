import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, Target, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function MonitoringPerubahan() {
  const statusCards = [
    { label: "Total Inisiatif", value: 0, icon: Target, color: "bg-blue-50 text-blue-600" },
    { label: "On Track", value: 0, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
    { label: "Tertunda", value: 0, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Selesai", value: 0, icon: CheckCircle2, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Monitoring Perubahan</h1>
        <p className="text-sm text-gray-500">Dashboard monitoring progres inisiatif perubahan organisasi secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCards.map((card) => (
          <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${card.color} rounded-xl`}><card.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{card.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Status Inisiatif</h3>
            <p className="text-xs text-slate-400 mt-0.5">Kartu status setiap inisiatif perubahan</p>
          </div>
          <div className="p-12 text-center">
            <Target size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada inisiatif untuk dimonitor.</p>
            <p className="text-xs text-slate-400 mt-1">Tambahkan inisiatif perubahan terlebih dahulu.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Progres Keseluruhan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Persentase kemajuan total</p>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <p className="text-5xl font-extrabold text-slate-300">0%</p>
              <p className="text-xs text-slate-400 mt-2">Progres Keseluruhan</p>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#CC0000] rounded-full" style={{ width: "0%" }} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="text-center p-2 bg-slate-50 rounded-lg">
                <p className="text-xs font-bold text-blue-600">0</p>
                <p className="text-[9px] text-slate-400">Perencanaan</p>
              </div>
              <div className="text-center p-2 bg-slate-50 rounded-lg">
                <p className="text-xs font-bold text-amber-600">0</p>
                <p className="text-[9px] text-slate-400">Berjalan</p>
              </div>
              <div className="text-center p-2 bg-slate-50 rounded-lg">
                <p className="text-xs font-bold text-red-600">0</p>
                <p className="text-[9px] text-slate-400">Tertunda</p>
              </div>
              <div className="text-center p-2 bg-slate-50 rounded-lg">
                <p className="text-xs font-bold text-emerald-600">0</p>
                <p className="text-[9px] text-slate-400">Selesai</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Alert & Peringatan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Notifikasi inisiatif yang memerlukan perhatian</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-red-600" />
              <span className="text-xs font-bold text-red-700">Terlambat</span>
            </div>
            <p className="text-[10px] text-red-600">Belum ada inisiatif yang terlambat.</p>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700">Mendekati Deadline</span>
            </div>
            <p className="text-[10px] text-amber-600">Belum ada inisiatif dengan deadline dekat.</p>
          </div>
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">Selesai Bulan Ini</span>
            </div>
            <p className="text-[10px] text-emerald-600">Belum ada inisiatif selesai bulan ini.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
