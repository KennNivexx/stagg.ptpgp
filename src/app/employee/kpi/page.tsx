import { supabaseAdmin } from "@/lib/supabase";
import { Target, TrendingUp, Award, Star } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import EmptyState from "@/components/EmptyState";

export default async function EmployeeKPI() {
  let userEmail: string;
  try {
    const auth = await requireAuth();
    userEmail = auth.email;
  } catch {
    redirect("/login");
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const employeeId = employee?.id;

  const { data: evaluations } = employeeId ? await supabaseAdmin
    .from("kpi_evaluations")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(10) : { data: [] };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Penilaian Kinerja (KPI)</h1>
        <p className="text-sm text-gray-500">Lihat target dan hasil evaluasi kinerja Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Evaluasi Terakhir</p>
              <p className="text-xl font-extrabold text-slate-800">
                {evaluations && evaluations.length > 0 ? (evaluations[0] as Record<string, unknown>).score as string || "-" : "-"}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Skor</p>
              <p className="text-xl font-extrabold text-slate-800">
                {(() => {
                  const scored = (evaluations || []).filter((e: Record<string, unknown>) => e.score != null);
                  if (scored.length === 0) return "-";
                  const avg = scored.reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.score) || 0), 0) / scored.length;
                  return avg.toFixed(1);
                })()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Award size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Evaluasi</p>
              <p className="text-xl font-extrabold text-slate-800">{evaluations?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Evaluasi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Hasil penilaian kinerja Anda</p>
        </div>

        {!evaluations || evaluations.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Belum ada evaluasi KPI."
            description="Evaluasi akan muncul setelah dilakukan penilaian oleh HRD."
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {evaluations.map((ev: Record<string, unknown>) => {
              const score = Number(ev.score) || 0;
              const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
              const scoreBg = score >= 80 ? "bg-emerald-50" : score >= 60 ? "bg-amber-50" : "bg-red-50";
              return (
                <div key={ev.id as string} className="p-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-800 text-sm">{ev.period as string || "Periode Tidak Diketahui"}</h4>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          ev.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                          ev.status === "Reviewed" ? "bg-blue-50 text-blue-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {ev.status as string || "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{ev.comments as string || "Tidak ada komentar."}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              className={star <= score / 20 ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-4 py-2 rounded-xl ${scoreBg}`}>
                        <p className={`text-2xl font-extrabold ${scoreColor}`}>{score}</p>
                        <p className="text-[9px] font-bold text-slate-400">NILAI</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
