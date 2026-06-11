import { supabaseAdmin } from "@/lib/supabase";
import { Building2, ChevronRight, Users, Award, TrendingUp } from "lucide-react";

export default async function StrukturOrganisasi() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position, status")
    .neq("status", "Inactive")
    .order("full_name");

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("*");

  const deptList = (departments || []).length > 0
    ? (departments as Record<string, unknown>[]).map((d) => ({
        name: d.name as string,
        head: d.head_name as string || "-",
      }))
    : [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string).filter(Boolean))]
        .map((name) => ({ name, head: "-" }));

  const hierarchy = deptList.map((dept) => {
    const deptEmps = (employees || []).filter((e: Record<string, unknown>) => e.department === dept.name);
    const positions = [...new Set(deptEmps.map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];
    const posWithEmps = positions.map((pos) => ({
      name: pos,
      employees: deptEmps.filter((e: Record<string, unknown>) => e.position === pos),
    }));
    return { ...dept, total: deptEmps.length, positions: posWithEmps };
  }).sort((a, b) => b.total - a.total);

  const totalEmployees = (employees || []).length;
  const totalDepts = hierarchy.length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Struktur Organisasi</h1>
        <p className="text-sm text-gray-500">Bagan hierarki organisasi menampilkan departemen, jabatan, dan karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Departemen", value: totalDepts, icon: <Building2 size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Total Karyawan Aktif", value: totalEmployees, icon: <Users size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Rata-rata per Dept", value: totalDepts > 0 ? Math.round(totalEmployees / totalDepts) : 0, icon: <TrendingUp size={18} />, color: "bg-amber-50 text-amber-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Bagan Organisasi</h3>
              <p className="text-xs text-slate-400 mt-0.5">Hierarki: Departemen &gt; Jabatan &gt; Karyawan</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {hierarchy.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data karyawan atau departemen.</p>
              <p className="text-xs text-slate-400 mt-1">Tambahkan karyawan dan departemen untuk melihat struktur organisasi.</p>
            </div>
          ) : (
            hierarchy.map((dept, deptIdx) => (
              <div key={dept.name} className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
                      {dept.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{dept.name}</p>
                      {dept.head !== "-" && (
                        <p className="text-[10px] text-slate-300">Kepala: {dept.head}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{dept.total} orang</span>
                </div>

                <div className="divide-y divide-slate-50">
                  {dept.positions.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-xs text-slate-400">Belum ada jabatan terisi di departemen ini.</p>
                    </div>
                  ) : (
                    dept.positions.map((pos) => (
                      <div key={pos.name} className="p-3 pl-8 hover:bg-slate-50/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <ChevronRight size={12} className="text-slate-400" />
                          <Award size={14} className="text-amber-500" />
                          <span className="text-xs font-bold text-slate-700">{pos.name}</span>
                          <span className="text-[10px] text-slate-400">({pos.employees.length} orang)</span>
                        </div>
                        <div className="flex flex-wrap gap-2 ml-6">
                          {pos.employees.map((emp: Record<string, unknown>) => (
                            <span key={emp.id as string} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] text-slate-600 border border-slate-100">
                              <span className="h-4 w-4 rounded-full bg-slate-300 text-white flex items-center justify-center text-[8px] font-bold">
                                {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                              {emp.full_name as string}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
