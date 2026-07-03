import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ForecastFormClient from "./ForecastFormClient";

export const dynamic = "force-dynamic";

const CURRENT_YEAR = 2026;
const quarters = ["Q1", "Q2", "Q3", "Q4"];

export default async function ProyeksiKebutuhanSDM() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("department")
    .neq("status", "Inactive");

  const { data: departmentRows } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const { data: forecastRows } = await supabaseAdmin
    .from("department_forecasts")
    .select("department, q1, q2, q3, q4")
    .eq("year", CURRENT_YEAR);

  const deptNames = (departmentRows || []).map((d: Record<string, unknown>) => d.name as string).filter(Boolean);
  const forecastByDept = new Map(
    (forecastRows || []).map((f: Record<string, unknown>) => [f.department as string, f])
  );

  // Every department appears in the table, even ones without a saved
  // forecast yet — those simply show 0 instead of being hidden.
  const forecastData = deptNames.map((department) => {
    const f = forecastByDept.get(department) as Record<string, unknown> | undefined;
    return {
      department,
      q1: Number(f?.q1) || 0,
      q2: Number(f?.q2) || 0,
      q3: Number(f?.q3) || 0,
      q4: Number(f?.q4) || 0,
    };
  });

  const deptList = [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string).filter(Boolean))];

  const currentHeadcount = deptList.map((name) => ({
    name,
    current: (employees || []).filter((e: Record<string, unknown>) => e.department === name).length,
  }));

  const totalQ1 = forecastData.reduce((s, f) => s + f.q1, 0);
  const totalQ2 = forecastData.reduce((s, f) => s + f.q2, 0);
  const totalQ3 = forecastData.reduce((s, f) => s + f.q3, 0);
  const totalQ4 = forecastData.reduce((s, f) => s + f.q4, 0);

  const totalCurrent = currentHeadcount.reduce((s, d) => s + d.current, 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Proyeksi Kebutuhan SDM</h1>
        <p className="text-sm text-gray-500">Rencana kebutuhan tenaga kerja per departemen per kuartal tahun {CURRENT_YEAR}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Headcount Saat Ini", value: totalCurrent, icon: <Users size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: `Proyeksi ${quarters[0]}`, value: totalQ1, icon: <TrendingUp size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: `Proyeksi ${quarters[1]}`, value: totalQ2, icon: <TrendingUp size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: `Proyeksi ${quarters[2]}`, value: totalQ3, icon: <TrendingUp size={18} />, color: "bg-purple-50 text-purple-600" },
          { label: `Proyeksi ${quarters[3]}`, value: totalQ4, icon: <TrendingUp size={18} />, color: "bg-red-50 text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-lg font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <ForecastFormClient departments={deptNames} quarters={quarters} year={CURRENT_YEAR} />

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Tabel Proyeksi per Departemen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kebutuhan SDM per kuartal {CURRENT_YEAR}</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                  {quarters.map((q) => (
                    <th key={q} className="px-6 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">{q}</th>
                  ))}
                  <th className="px-6 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pertumbuhan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {forecastData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <EmptyState icon={TrendingUp} title="Belum ada data proyeksi." description="Tambahkan proyeksi untuk setiap departemen." />
                    </td>
                  </tr>
                ) : (
                  forecastData.map((row) => {
                    const vals = [row.q1, row.q2, row.q3, row.q4];
                    const total = vals.reduce((s, v) => s + v, 0);
                    const growth = row.q1 > 0 ? Math.round(((row.q4 - row.q1) / row.q1) * 100) : 0;
                    const maxVal = Math.max(...vals);
                    return (
                      <tr key={row.department} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.department}</td>
                        {vals.map((v, i) => (
                          <td key={i} className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs font-bold text-slate-700">{v}</span>
                              <div className="h-1.5 w-9 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${v === maxVal ? "bg-blue-500" : "bg-slate-300"}`} style={{ width: `${Math.round((v / Math.max(maxVal, 1)) * 100)}%` }} />
                              </div>
                            </div>
                          </td>
                        ))}
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-extrabold text-slate-800">{total}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-bold ${growth > 0 ? "text-emerald-600" : growth < 0 ? "text-red-600" : "text-slate-500"}`}>
                            {growth > 0 ? "+" : ""}{growth}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-100 bg-slate-50/30">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">TOTAL</td>
                  <td className="px-6 py-4 text-center text-xs font-extrabold text-slate-800">{totalQ1}</td>
                  <td className="px-6 py-4 text-center text-xs font-extrabold text-slate-800">{totalQ2}</td>
                  <td className="px-6 py-4 text-center text-xs font-extrabold text-slate-800">{totalQ3}</td>
                  <td className="px-6 py-4 text-center text-xs font-extrabold text-slate-800">{totalQ4}</td>
                  <td className="px-6 py-4 text-center text-xs font-extrabold text-slate-800">{totalQ1 + totalQ2 + totalQ3 + totalQ4}</td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-emerald-600">
                    +{totalQ1 > 0 ? Math.round(((totalQ4 - totalQ1) / totalQ1) * 100) : 0}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
