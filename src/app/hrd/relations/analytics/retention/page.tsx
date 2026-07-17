import { getSeparationAnalytics } from "@/app/actions/employee-relations";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { TrendingDown } from "lucide-react";

export default async function RetentionAnalysisPage() {
  await requireRole("hrd", "superadmin");
  const [sep, { data: employeesByDept }] = await Promise.all([
    getSeparationAnalytics(),
    supabaseAdmin.from("karyawan").select("department").neq("status", "Inactive"),
  ]);
  const deptCount: Record<string, number> = {};
  (employeesByDept || []).forEach((e) => { if (e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1; });
  const retentionRate = 100 - (sep.total > 0 ? Math.min(100, sep.total) : 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <TrendingDown size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Retention &amp; Turnover Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">Analisis retensi karyawan berdasarkan data pemisahan hubungan kerja tahun berjalan.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-extrabold text-slate-800">{sep.total}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Separation</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-extrabold text-slate-800">~{retentionRate}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Estimasi Retention Rate</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-slate-800 mb-4">Headcount per Departemen (basis retensi)</h3>
        <div className="space-y-2">
          {Object.entries(deptCount).map(([dept, count]) => (
            <div key={dept} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{dept}</span>
              <span className="font-extrabold text-slate-800">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
