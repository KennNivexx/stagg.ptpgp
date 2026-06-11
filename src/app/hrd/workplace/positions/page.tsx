import { supabaseAdmin } from "@/lib/supabase";
import { Network, Plus, Users, Award, Briefcase } from "lucide-react";

export default async function Jabatan() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position, status")
    .neq("status", "Inactive")
    .order("position");

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("*");

  const deptList = [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string).filter(Boolean))];

  const positionsByDept = deptList.map((dept) => {
    const deptEmps = (employees || []).filter((e: Record<string, unknown>) => e.department === dept);
    const positions = [...new Set(deptEmps.map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];
    const posData = positions.map((pos) => ({
      name: pos,
      count: deptEmps.filter((e: Record<string, unknown>) => e.position === pos).length,
      employees: deptEmps.filter((e: Record<string, unknown>) => e.position === pos).map((e) => e.full_name as string),
    }));
    return { department: dept, totalEmployees: deptEmps.length, positions: posData };
  }).sort((a, b) => b.totalEmployees - a.totalEmployees);

  const allPositions = [...new Set((employees || []).map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];
  const totalUniquePositions = allPositions.length;
  const totalEmployees = (employees || []).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Jabatan</h1>
        <p className="text-sm text-gray-500">Daftar jabatan dan posisi dalam organisasi, dikelompokkan per departemen.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Jabatan Unik", value: totalUniquePositions, icon: <Award size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Total Karyawan", value: totalEmployees, icon: <Users size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Departemen", value: deptList.length, icon: <Briefcase size={18} />, color: "bg-amber-50 text-amber-600" },
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#CC0000]" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Tambah Jabatan Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Definisikan posisi baru</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nama Jabatan</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Staff Akuntansi" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="">Pilih Departemen</option>
                  {deptList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Level</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="">Pilih Level</option>
                  <option>Staff</option>
                  <option>Supervisor</option>
                  <option>Manager</option>
                  <option>Kepala Bagian</option>
                  <option>Direktur</option>
                </select>
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Simpan Jabatan
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Network size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daftar Jabatan per Departemen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Semua posisi dalam organisasi</p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {positionsByDept.length === 0 ? (
              <div className="p-12 text-center">
                <Network size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">Belum ada data jabatan.</p>
                <p className="text-xs text-slate-400 mt-1">Tambahkan karyawan untuk melihat daftar jabatan.</p>
              </div>
            ) : (
              positionsByDept.map((dept) => (
                <div key={dept.department} className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                      {dept.department.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">{dept.department}</p>
                      <p className="text-[10px] text-slate-400">{dept.totalEmployees} karyawan &middot; {dept.positions.length} jabatan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-11">
                    {dept.positions.map((pos) => (
                      <div key={pos.name} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Award size={12} className="text-amber-500" />
                            {pos.name}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded-md">{pos.count}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {pos.employees.slice(0, 3).map((name) => (
                            <span key={name} className="text-[9px] text-slate-500 bg-white px-1.5 py-0.5 rounded-md border border-slate-100">
                              {name}
                            </span>
                          ))}
                          {pos.employees.length > 3 && (
                            <span className="text-[9px] text-slate-400">+{pos.employees.length - 3} lainnya</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
