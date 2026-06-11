import { supabaseAdmin } from "@/lib/supabase";
import { GitBranch, Plus, Users, Edit, Trash2, Building2 } from "lucide-react";

export default async function Departemen() {
  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("*")
    .order("name");

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, department")
    .neq("status", "Inactive");

  const deptList = (departments || []) as Record<string, unknown>[];

  const enrichedDepts: Record<string, unknown>[] = deptList.map((dept) => {
    const empCount = (employees || []).filter((e: Record<string, unknown>) =>
      e.department === (dept.name as string)
    ).length;
    return { ...dept, empCount };
  });

  if (deptList.length === 0 && (employees || []).length > 0) {
    const deptNames = [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string).filter(Boolean))];
    deptNames.forEach((name) => {
      const empCount = (employees || []).filter((e: Record<string, unknown>) => e.department === name).length;
      enrichedDepts.push({ id: name, name, code: "", head_name: "", status: "Active", empCount });
    });
  }

  const totalDepartments = enrichedDepts.length;
  const totalEmployees = (employees || []).length;
  const activeDepts = enrichedDepts.filter((d) => d.status === "Active").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Departemen</h1>
        <p className="text-sm text-gray-500">Kelola data departemen dan divisi dalam struktur organisasi perusahaan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Departemen", value: totalDepartments, icon: <Building2 size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Departemen Aktif", value: activeDepts, icon: <GitBranch size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Total Karyawan", value: totalEmployees, icon: <Users size={18} />, color: "bg-amber-50 text-amber-600" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#CC0000]" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Tambah / Edit Departemen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola data departemen</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nama Departemen</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Human Resource" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Kode Departemen</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: HRD" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Kepala Departemen</label>
                <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Nama kepala departemen" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Status</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Simpan Departemen
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daftar Departemen</h3>
                <p className="text-xs text-slate-400 mt-0.5">Semua unit organisasi</p>
              </div>
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Nama Departemen</div>
            <div className="col-span-2">Kode</div>
            <div className="col-span-2">Kepala</div>
            <div className="col-span-1 text-center">Karyawan</div>
            <div className="col-span-2 text-center">Status / Aksi</div>
          </div>

          <div className="divide-y divide-slate-50">
            {enrichedDepts.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 size={40} className="mx-auto text-slate-300 mb-4" />
                <p className="text-sm text-slate-500">Belum ada data departemen.</p>
                <p className="text-xs text-slate-400 mt-1">Tambahkan departemen untuk memulai.</p>
              </div>
            ) : (
              enrichedDepts.map((dept: Record<string, unknown>, idx: number) => (
                <div key={dept.id as string} className="p-4 hover:bg-slate-50/30 transition-colors grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-1">
                    <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                  </div>
                  <div className="col-span-4">
                    <p className="text-sm font-bold text-slate-800">{dept.name as string}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-500 font-mono">{(dept.code as string) || "-"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-slate-600">{(dept.head_name as string) || "-"}</span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700">
                      <Users size={10} /> {dept.empCount as number}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${dept.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {dept.status as string}
                    </span>
                    <button className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                      <Edit size={12} />
                    </button>
                    <button className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                      <Trash2 size={12} />
                    </button>
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
