import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { Star, TrendingUp, Users, Filter } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { getTalentPoolEntries } from "@/app/actions/succession";
import AddToTalentPoolForm from "./AddToTalentPoolForm";

export const dynamic = "force-dynamic";

export default async function TalentPoolSuksesi({ searchParams }: { searchParams: Promise<{ dept?: string }> }) {
  await requireRole("hrd", "superadmin");
  const params = await searchParams;
  const filterDept = params?.dept || "";
  const poolEntries = await getTalentPoolEntries();
  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("*")
    .neq("status", "Resigned")
    .order("full_name");

  const { data: evaluations } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("employee_id, score")
    .order("created_at", { ascending: false });

  const { data: departments } = await supabaseAdmin
    .from("departemen")
    .select("name")
    .order("name");

  const employeeScores: Record<string, { total: number; count: number }> = {};
  (evaluations || []).forEach((e: Record<string, unknown>) => {
    const eid = e.employee_id as string;
    if (!employeeScores[eid]) employeeScores[eid] = { total: 0, count: 0 };
    employeeScores[eid].total += Number(e.score) || 0;
    employeeScores[eid].count += 1;
  });

  const getAvgScore = (id: string) => {
    const s = employeeScores[id];
    if (!s || s.count === 0) return 0;
    return Math.round(s.total / s.count);
  };

  const getPotentialRating = (score: number) => {
    if (score >= 85) return { label: "Bintang", grid: "9 (High-High)", color: "bg-emerald-50 text-emerald-700" };
    if (score >= 70) return { label: "Potensial Tinggi", grid: "7-8 (High-Mid)", color: "bg-blue-50 text-blue-700" };
    if (score >= 55) return { label: "Solid", grid: "5-6 (Mid-Mid)", color: "bg-amber-50 text-amber-700" };
    return { label: "Perlu Pengembangan", grid: "1-4", color: "bg-red-50 text-red-700" };
  };

  const talentPool = (employees || [])
    .map((emp: Record<string, unknown>) => ({
      ...emp,
      avgScore: getAvgScore(emp.id as string),
    }))
    .filter((emp: Record<string, unknown>) => (emp.avgScore as number) >= 50)
    .filter((emp: Record<string, unknown>) => !filterDept || (emp.department as string) === filterDept)
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (b.avgScore as number) - (a.avgScore as number));

  const highPotentials = (employees || [])
    .map((emp: Record<string, unknown>) => ({
      ...emp,
      avgScore: getAvgScore(emp.id as string),
    }))
    .filter((emp: Record<string, unknown>) => (emp.avgScore as number) >= 70)
    .filter((emp: Record<string, unknown>) => !filterDept || (emp.department as string) === filterDept);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Talent Pool Suksesi</h1>
        <p className="text-sm text-gray-500">Kelola kolam talenta karyawan berpotensi tinggi untuk pengembangan karir.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Talent Pool</p>
              <p className="text-xl font-extrabold text-slate-800">{talentPool.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Star size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Potensi Tinggi</p>
              <p className="text-xl font-extrabold text-slate-800">{highPotentials.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Skor Pool</p>
              <p className="text-xl font-extrabold text-slate-800">
                {talentPool.length > 0
                  ? Math.round(talentPool.reduce((s: number, t: Record<string, unknown>) => s + (t.avgScore as number), 0) / talentPool.length)
                  : 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Filter size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Departemen</p>
              <p className="text-xl font-extrabold text-slate-800">{departments?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Talent Pool</h3>
              <p className="text-xs text-slate-400 mt-0.5">Karyawan berpotensi tinggi berdasarkan Grid 9-Box</p>
            </div>
            <form method="get" className="flex items-center gap-2">
              <select name="dept" className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none" defaultValue={filterDept}>
                <option value="">Semua Departemen</option>
                {(departments || []).map((d: Record<string, unknown>) => (
                  <option key={d.name as string} value={d.name as string}>{d.name as string}</option>
                ))}
              </select>
              <button type="submit" className="text-xs px-3 py-2 bg-[#CC0000] text-white rounded-lg font-bold hover:bg-[#aa0000] transition-colors">
                Filter
              </button>
            </form>
          </div>

          {talentPool.length === 0 ? (
            <EmptyState
              icon={Star}
              title="Belum ada karyawan dalam talent pool."
              description="Lakukan evaluasi KPI untuk mengisi talent pool."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departemen</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Skor Kinerja</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rating Potensi</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Grid 9-Box</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {talentPool.map((t: Record<string, unknown>) => {
                    const potential = getPotentialRating(t.avgScore as number);
                    return (
                      <tr key={t.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                              {(t.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <p className="text-xs font-bold text-slate-800">{t.full_name as string}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{t.position as string || "-"}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                            {t.department as string || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            (t.avgScore as number) >= 80 ? "bg-emerald-50 text-emerald-700" :
                            (t.avgScore as number) >= 60 ? "bg-amber-50 text-amber-700" :
                            "bg-red-50 text-red-700"
                          }`}>
                            {t.avgScore as number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${potential.color}`}>
                            {potential.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">{potential.grid}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AddToTalentPoolForm
          employees={(employees || []).map((e: Record<string, unknown>) => ({
            id: e.id as string, full_name: e.full_name as string,
          }))}
          poolEntries={poolEntries}
        />
      </div>
    </div>
  );
}
