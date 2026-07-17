import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { ShieldAlert } from "lucide-react";

export default async function EmployeeRiskScorePage() {
  await requireRole("hrd", "superadmin");
  const [{ data: employeesByDept }, { data: cases }, { data: separations }] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, department").neq("status", "Inactive"),
    supabaseAdmin.from("employee_cases").select("subject_department").not("subject_department", "is", null),
    supabaseAdmin.from("employee_separations").select("karyawan_id, karyawan!employee_separations_karyawan_id_fkey(department)"),
  ]);

  const deptTotal: Record<string, number> = {};
  (employeesByDept || []).forEach((e) => { if (e.department) deptTotal[e.department] = (deptTotal[e.department] || 0) + 1; });

  const deptSeparations: Record<string, number> = {};
  (separations || []).forEach((s) => {
    const rel = (s as unknown as { karyawan?: { department?: string } | { department?: string }[] }).karyawan;
    const dept = Array.isArray(rel) ? rel[0]?.department : rel?.department;
    if (dept) deptSeparations[dept] = (deptSeparations[dept] || 0) + 1;
  });

  const risk = Object.entries(deptTotal).map(([dept, total]) => {
    const separationCount = deptSeparations[dept] || 0;
    const riskPct = total > 0 ? Math.round((separationCount / total) * 1000) / 10 : 0;
    return { dept, total, separationCount, riskPct };
  }).sort((a, b) => b.riskPct - a.riskPct);

  void cases;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Employee Risk Score</h1>
          <p className="text-sm text-slate-500 mt-1">Skor risiko per departemen dihitung dari rasio pemisahan hubungan kerja terhadap jumlah karyawan aktif.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Departemen</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Separation</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {risk.map((r) => (
              <tr key={r.dept} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-semibold text-slate-700">{r.dept}</td>
                <td className="px-4 py-3 text-slate-600">{r.total}</td>
                <td className="px-4 py-3 text-slate-600">{r.separationCount}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.riskPct >= 10 ? "bg-red-50 text-pgp-red" : "bg-slate-100 text-slate-600"}`}>{r.riskPct}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
