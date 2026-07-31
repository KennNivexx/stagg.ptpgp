import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { Clipboard, TrendingUp, CheckCircle, Clock } from "lucide-react";
import ReviewsTable from "./ReviewsTable";

export default async function ReviewsPage() {
  await requireRole("hrd", "superadmin");
  const { data: evaluations } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("*, karyawan!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(30);

  const evals = (evaluations || []) as Array<Record<string, unknown>>;
  const scores = evals.filter((e) => e.score != null).map((e) => Number(e.score) || 0);
  const avgScore = scores.length > 0 ? scores.reduce((s, n) => s + n, 0) / scores.length : 0;
  const completedReviews = evals.filter((e) => e.status === "Approved" || e.status === "Reviewed").length;
  const pendingReviews = evals.filter((e) => !e.status || e.status === "Pending" || e.status === "Draft").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Review Kinerja</h1>
        <p className="text-sm text-gray-500">Review dan penilaian kinerja karyawan per periode.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Clipboard, label: "Total Review", value: evals.length, color: "bg-blue-50 text-blue-600" },
          { icon: TrendingUp, label: "Rata-rata Skor", value: avgScore.toFixed(1), color: "bg-emerald-50 text-emerald-600" },
          { icon: CheckCircle, label: "Selesai Direview", value: completedReviews, color: "bg-purple-50 text-purple-600" },
          { icon: Clock, label: "Menunggu Review", value: pendingReviews, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ReviewsTable evaluations={evals} />
    </div>
  );
}
