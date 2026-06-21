import { supabaseAdmin } from "@/lib/supabase";
import { Target, TrendingUp, Award, Users } from "lucide-react";
import KpiForm from "./KpiForm";

export default async function KPIPage() {
  const [{ data: evaluations }, { data: employees }] = await Promise.all([
    supabaseAdmin
      .from("kpi_evaluations")
      .select("*, employees!inner(full_name, department, position)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("employees")
      .select("id, full_name, department, position")
      .limit(100),
  ]);

  const evals = (evaluations || []) as Array<Record<string, unknown>>;
  const scores = evals.filter((e) => e.score != null).map((e) => Number(e.score) || 0);
  const avgScore = scores.length > 0 ? scores.reduce((s, n) => s + n, 0) / scores.length : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const uniqueEmployees = new Set(evals.map((e) => e.employee_id)).size;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Manajemen KPI</h1>
        <p className="text-sm text-gray-500">Kelola target, evaluasi, dan penilaian KPI karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Target, label: "Total Evaluasi", value: evals.length, color: "bg-blue-50 text-blue-600" },
          { icon: TrendingUp, label: "Rata-rata Skor", value: avgScore.toFixed(1), color: "bg-emerald-50 text-emerald-600" },
          { icon: Award, label: "Skor Tertinggi", value: maxScore > 0 ? maxScore.toFixed(0) : "-", color: "bg-amber-50 text-amber-600" },
          { icon: Users, label: "Karyawan Dinilai", value: uniqueEmployees, color: "bg-red-50 text-red-600" },
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

      <KpiForm
        employees={(employees || []) as Array<{ id: string; full_name: string; department: string; position: string }>}
        evaluations={evals}
      />
    </div>
  );
}
