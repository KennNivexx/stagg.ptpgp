import { supabaseAdmin } from "@/lib/supabase";
import { Crosshair, Plus, Target, Calendar, TrendingUp, Clock } from "lucide-react";
import EmptyState from "@/components/EmptyState";

async function saveObjective(formData: FormData) {
  "use server";
  // Fitur akan segera tersedia
}

const SEED_OBJECTIVES = [
  { id: 1, title: "Meningkatkan Employee Engagement Score", kpiTarget: "85% engagement score", deadline: "Des 2026", progress: 62, status: "In Progress" },
  { id: 2, title: "Mengurangi Turnover Rate", kpiTarget: "Turnover < 5% per tahun", deadline: "Des 2026", progress: 78, status: "In Progress" },
  { id: 3, title: "Meningkatkan Time-to-Hire", kpiTarget: "Rata-rata 14 hari", deadline: "Jun 2026", progress: 90, status: "On Track" },
  { id: 4, title: "Implementasi Sistem LMS", kpiTarget: "100% modul training online", deadline: "Sep 2026", progress: 35, status: "In Progress" },
  { id: 5, title: "Pengembangan KPI Per Departemen", kpiTarget: "Seluruh departemen punya KPI", deadline: "Mar 2026", progress: 100, status: "Tercapai" },
  { id: 6, title: "Sertifikasi ISO 9001:2015", kpiTarget: "Lulus audit sertifikasi", deadline: "Nov 2026", progress: 20, status: "Planning" },
];

export default async function TujuanSasaran() {
  const { data: evaluations } = await supabaseAdmin.from("kpi_evaluations").select("score").limit(100);
  const avgKPI = evaluations && evaluations.length > 0
    ? Math.round(evaluations.filter((e: Record<string, unknown>) => e.score != null).reduce((s: number, e: Record<string, unknown>) => s + (Number(e.score) || 0), 0) / evaluations.filter((e: Record<string, unknown>) => e.score != null).length)
    : 0;

  const tercapai = SEED_OBJECTIVES.filter((o) => o.progress >= 100).length;
  const onTrack = SEED_OBJECTIVES.filter((o) => o.progress >= 70 && o.progress < 100).length;
  const inProgress = SEED_OBJECTIVES.filter((o) => o.progress < 70).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Tujuan & Sasaran SDM</h1>
        <p className="text-sm text-gray-500">Kelola tujuan strategis SDM lengkap dengan target KPI dan progres pencapaian.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tujuan", value: SEED_OBJECTIVES.length, icon: <Crosshair size={18} />, color: "blue" },
          { label: "Tercapai", value: tercapai, icon: <Target size={18} />, color: "emerald" },
          { label: "On Track", value: onTrack, icon: <TrendingUp size={18} />, color: "amber" },
          { label: "Rata-rata KPI", value: avgKPI, icon: <Target size={18} />, color: "red", subtitle: "dari evaluasi" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                stat.color === "amber" ? "bg-amber-50 text-amber-600" :
                "bg-red-50 text-red-600"
              }`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
                {stat.subtitle && <p className="text-[10px] text-slate-400">{stat.subtitle}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#CC0000]" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Tambah Tujuan Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Definisikan sasaran dan target KPI</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form action={saveObjective} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Judul Tujuan</label>
                <input type="text" name="judul_tujuan" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Meningkatkan Employee Engagement" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Target KPI</label>
                <input type="text" name="target_kpi" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Engagement score 85%" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Batas Waktu</label>
                <input type="text" name="batas_waktu" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Des 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Progress Awal (%)</label>
                <input type="number" name="progress_awal" min="0" max="100" defaultValue="0" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" />
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Simpan Tujuan
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Crosshair size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daftar Tujuan Strategis</h3>
                <p className="text-xs text-slate-400 mt-0.5">Semua sasaran dengan target dan progres</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {SEED_OBJECTIVES.length === 0 ? (
              <EmptyState icon={Target} title="Belum ada tujuan strategis." description="Tambahkan tujuan baru untuk memulai." />
            ) : (
              SEED_OBJECTIVES.map((obj) => (
                <div key={obj.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{obj.title}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Target size={10} /> Target: {obj.kpiTarget}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar size={10} /> {obj.deadline}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                      obj.progress >= 100 ? "bg-emerald-50 text-emerald-700" :
                      obj.progress >= 70 ? "bg-blue-50 text-blue-700" :
                      obj.progress >= 30 ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{obj.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        obj.progress >= 100 ? "bg-emerald-500" :
                        obj.progress >= 70 ? "bg-blue-500" :
                        obj.progress >= 30 ? "bg-amber-500" :
                        "bg-slate-400"
                      }`} style={{ width: `${obj.progress}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-10 text-right">{obj.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
