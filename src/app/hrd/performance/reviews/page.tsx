import { supabaseAdmin } from "@/lib/supabase";
import { Clipboard, TrendingUp, Star, Users, Filter, CheckCircle, Clock } from "lucide-react";

export default async function ReviewsPage() {
  const { data: evaluations } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("*, employees!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const completedReviews = evaluations?.filter((e: Record<string, unknown>) =>
    e.status === "Approved" || e.status === "Reviewed"
  ).length || 0;

  const pendingReviews = evaluations?.filter((e: Record<string, unknown>) =>
    e.status === "Pending" || e.status === "Draft"
  ).length || 0;

  const avgScore = evaluations && evaluations.length > 0
    ? (evaluations.filter((e: Record<string, unknown>) => e.score != null)
        .reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.score) || 0), 0) /
       evaluations.filter((e: Record<string, unknown>) => e.score != null).length)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Review Kinerja</h1>
        <p className="text-sm text-gray-500">Review dan penilaian kinerja karyawan per periode.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Clipboard size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Review</p>
              <p className="text-xl font-extrabold text-slate-800">{evaluations?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Skor</p>
              <p className="text-xl font-extrabold text-slate-800">{avgScore.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Selesai Direview</p>
              <p className="text-xl font-extrabold text-slate-800">{completedReviews}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Review</p>
              <p className="text-xl font-extrabold text-slate-800">{pendingReviews}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <select className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 focus:border-[#CC0000] outline-none">
            <option value="">Semua Periode</option>
            <option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Building size={14} className="text-slate-400" />
          <select className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-600 focus:border-[#CC0000] outline-none">
            <option value="">Semua Departemen</option>
            {departments?.map((d: Record<string, unknown>) => (
              <option key={d.name as string} value={d.name as string}>{d.name as string}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Review Kinerja</h3>
          <p className="text-xs text-slate-400 mt-0.5">Hasil penilaian dari kpi_evaluations</p>
        </div>

        {!evaluations || evaluations.length === 0 ? (
          <div className="p-12 text-center">
            <Clipboard size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada data review kinerja.</p>
            <p className="text-xs text-slate-400 mt-1">Lakukan evaluasi KPI untuk melihat review di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Skor</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {evaluations.map((ev: Record<string, unknown>) => {
                  const emp = ev.employees as Record<string, string> | undefined;
                  const score = Number(ev.score) || 0;
                  return (
                    <tr key={ev.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400">{emp?.position || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">
                          {emp?.department || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{ev.period as string || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          score >= 80 ? "bg-emerald-50 text-emerald-700" :
                          score >= 60 ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }`}>
                          {score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          ev.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                          ev.status === "Reviewed" ? "bg-blue-50 text-blue-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {ev.status === "Approved" ? "Disetujui" : ev.status === "Reviewed" ? "Direview" : (ev.status as string) || "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Building({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  );
}
