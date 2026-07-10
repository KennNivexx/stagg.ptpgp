import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, Clock, TrendingUp, Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ExportExcelButton from "@/components/ExportExcelButton";

export const dynamic = "force-dynamic";

export default async function LaporanPelatihan() {
  const [{ data: trainings }, { data: enrollments }, { data: roiRows }] = await Promise.all([
    supabaseAdmin.from("pelatihan").select("*").order("date_start", { ascending: false }),
    supabaseAdmin.from("peserta_pelatihan").select("training_id, status"),
    supabaseAdmin.from("roi_pelatihan").select("training_id, cost").then((r) => r.error ? { data: [] } : r),
  ]);

  const allTrainings = (trainings || []) as Array<Record<string, unknown>>;
  const allEnrollments = (enrollments || []) as Array<Record<string, unknown>>;
  const costByTraining: Record<string, number> = {};
  ((roiRows || []) as Array<Record<string, unknown>>).forEach((r) => { costByTraining[r.training_id as string] = Number(r.cost) || 0; });

  const enrollCount: Record<string, number> = {};
  const completeCount: Record<string, number> = {};
  allEnrollments.forEach((e) => {
    const tid = e.training_id as string;
    enrollCount[tid] = (enrollCount[tid] || 0) + 1;
    if (e.status === "Completed") completeCount[tid] = (completeCount[tid] || 0) + 1;
  });

  const totalParticipants = allEnrollments.length;
  const totalCompleted = allEnrollments.filter((e) => e.status === "Completed").length;
  const completionRate = totalParticipants > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : null;
  const totalHours = allTrainings.reduce((sum, t) => {
    if (!t.date_start || !t.date_end) return sum;
    const days = Math.max(1, Math.round((new Date(t.date_end as string).getTime() - new Date(t.date_start as string).getTime()) / 86400000) + 1);
    return sum + days * 8;
  }, 0);
  const totalCost = Object.values(costByTraining).reduce((s, c) => s + c, 0);
  const costedCount = Object.values(costByTraining).filter((c) => c > 0).length;
  const avgCost = costedCount > 0 ? Math.round(totalCost / costedCount) : 0;

  const rows = allTrainings.map((t) => {
    const id = t.id as string;
    const days = t.date_start && t.date_end
      ? Math.max(1, Math.round((new Date(t.date_end as string).getTime() - new Date(t.date_start as string).getTime()) / 86400000) + 1)
      : 0;
    return {
      Program: t.title as string,
      Departemen: (t.department as string) || "-",
      Peserta: enrollCount[id] || 0,
      Selesai: completeCount[id] || 0,
      "Jam (est.)": days * 8,
      "Biaya (Rp)": costByTraining[id] || 0,
      Status: t.status as string,
    };
  });

  const trainingStats = [
    { label: "Total Program", value: allTrainings.length, icon: GraduationCap, color: "bg-blue-50 text-blue-600" },
    { label: "Peserta Selesai", value: totalCompleted, icon: Users, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Jam (est.)", value: totalHours, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Rata-rata Biaya", value: `Rp ${(avgCost / 1_000_000).toFixed(1)} Jt`, icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Pelatihan</h1>
          <p className="text-sm text-gray-500">Statistik penyelesaian pelatihan, jam partisipan, dan biaya per pelatihan.</p>
        </div>
        <ExportExcelButton filename="Laporan_Pelatihan" sheetName="Pelatihan" rows={rows} />
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
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Program</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Peserta</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Selesai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Biaya</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allTrainings.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState
                        icon={GraduationCap}
                        title="Belum ada data pelatihan."
                        description="Tambahkan program pelatihan untuk melihat laporan."
                      />
                    </td>
                  </tr>
                ) : allTrainings.map((t) => {
                  const id = t.id as string;
                  const cost = costByTraining[id] || 0;
                  return (
                    <tr key={id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-800">{t.title as string}</p>
                        <p className="text-[10px] text-slate-400">{(t.department as string) || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-semibold">{enrollCount[id] || 0}</td>
                      <td className="px-6 py-4 text-xs text-emerald-600 font-semibold">{completeCount[id] || 0}</td>
                      <td className="px-6 py-4 text-xs text-slate-700">{cost > 0 ? `Rp ${cost.toLocaleString("id-ID")}` : "-"}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">{t.status as string}</span>
                      </td>
                    </tr>
                  );
                })}
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
                <span className="text-sm font-extrabold text-slate-800">{allTrainings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Peserta Terdaftar</span>
                <span className="text-sm font-extrabold text-blue-600">{totalParticipants}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Completion Rate</span>
                <span className="text-sm font-extrabold text-emerald-600">{completionRate === null ? "-" : `${completionRate}%`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Biaya</span>
                <span className="text-sm font-extrabold text-red-600">Rp {totalCost.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Completion Rate</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tingkat penyelesaian</p>
            </div>
            <div className="p-8 text-center">
              <div className="text-5xl font-extrabold text-slate-300 mb-2">{completionRate === null ? "-" : `${completionRate}%`}</div>
              <p className="text-xs text-slate-400">{totalParticipants === 0 ? "Belum ada data" : `${totalCompleted} dari ${totalParticipants} peserta`}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
