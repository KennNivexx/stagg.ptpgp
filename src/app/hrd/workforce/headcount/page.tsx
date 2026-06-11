import { supabaseAdmin } from "@/lib/supabase";
import { BarChart3, Users, Building2, TrendingUp, AlertCircle } from "lucide-react";

export default async function HeadcountPlanning() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, department, status");

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("*");

  const deptList = (departments || []).length > 0
    ? (departments as Record<string, unknown>[]).map((d) => ({
        name: d.name as string,
        id: d.id as string,
        planned: (d.headcount as number) || 10,
      }))
    : [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string))]
        .filter(Boolean)
        .map((name) => ({ name, id: name, planned: 10 }));

  const headcountData = deptList.map((dept) => {
    const current = (employees || []).filter((e: Record<string, unknown>) =>
      e.department === dept.name && e.status !== "Inactive"
    ).length;
    return {
      ...dept,
      current,
      approved: dept.planned,
      variance: dept.planned - current,
    };
  }).sort((a, b) => b.current - a.current);

  const totalCurrent = headcountData.reduce((s, d) => s + d.current, 0);
  const totalApproved = headcountData.reduce((s, d) => s + d.approved, 0);
  const totalVariance = totalApproved - totalCurrent;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Headcount Planning</h1>
        <p className="text-sm text-gray-500">Perencanaan jumlah karyawan per departemen. Monitor headcount saat ini vs yang disetujui.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Headcount Saat Ini", value: totalCurrent, icon: <Users size={18} />, color: "blue" },
          { label: "Headcount Disetujui", value: totalApproved, icon: <BarChart3 size={18} />, color: "emerald" },
          { label: "Varians (Kekosongan)", value: totalVariance, icon: <TrendingUp size={18} />, color: totalVariance > 0 ? "amber" : "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                stat.color === "amber" ? "bg-amber-50 text-amber-600" :
                "bg-red-50 text-red-600"
              }`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Headcount per Departemen</h3>
              <p className="text-xs text-slate-400 mt-0.5">Perbandingan headcount saat ini vs yang disetujui</p>
            </div>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Departemen</div>
          <div className="col-span-2 text-center">Saat Ini</div>
          <div className="col-span-2 text-center">Disetujui</div>
          <div className="col-span-2 text-center">Varians</div>
          <div className="col-span-2 text-center">Progress</div>
        </div>

        <div className="divide-y divide-slate-50">
          {headcountData.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data karyawan atau departemen.</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan karyawan dan departemen untuk melihat headcount.</p>
            </div>
          ) : (
            headcountData.map((dept) => {
              const pct = dept.approved > 0 ? Math.round((dept.current / dept.approved) * 100) : 0;
              const isFull = dept.current >= dept.approved;
              const isOver = dept.current > dept.approved;
              return (
                <div key={dept.name} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <p className="text-sm font-bold text-slate-800">{dept.name}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-extrabold text-slate-800">{dept.current}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-sm font-bold text-slate-500">{dept.approved}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`text-xs font-bold ${
                        isOver ? "text-red-600" : dept.variance > 0 ? "text-emerald-600" : "text-slate-500"
                      }`}>
                        {dept.variance > 0 ? `+${dept.variance}` : dept.variance === 0 ? "Penuh" : dept.variance}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isOver ? "bg-red-500" : isFull ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold w-8 text-right ${isOver ? "text-red-600" : "text-slate-600"}`}>{pct}%</span>
                        {isOver && <AlertCircle size={12} className="text-red-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Rata-rata Utilisasi Headcount</span>
            <span className="text-xs font-bold text-slate-700">
              {totalApproved > 0 ? Math.round((totalCurrent / totalApproved) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
