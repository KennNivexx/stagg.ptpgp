import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { Users } from "lucide-react";

/** Conflict "prediction" here is honestly a proxy: departments with multiple
 * concurrent open cases are flagged as elevated-risk for further conflict —
 * a defensible heuristic, not a trained prediction model. */
export default async function ConflictPredictionPage() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("employee_cases")
    .select("subject_department, status")
    .not("subject_department", "is", null)
    .not("status", "in", '("Case Closed","Rejected")');
  const rows = (data || []) as { subject_department: string; status: string }[];
  const byDept: Record<string, number> = {};
  rows.forEach((r) => { byDept[r.subject_department] = (byDept[r.subject_department] || 0) + 1; });
  const flagged = Object.entries(byDept).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Users size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Conflict Prediction</h1>
          <p className="text-sm text-slate-500 mt-1">Departemen dengan &ge;2 kasus terbuka bersamaan ditandai berisiko konflik lebih tinggi — heuristik berbasis data kasus aktif, bukan model prediksi terlatih.</p>
        </div>
      </div>
      {flagged.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-sm text-slate-400">Tidak ada departemen dengan indikasi risiko konflik saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {flagged.map(([dept, count]) => (
            <div key={dept} className="bg-white rounded-xl border border-red-100 bg-red-50 shadow-sm p-4">
              <p className="text-xl font-extrabold text-pgp-red">{count}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{dept}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
