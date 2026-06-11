import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, ArrowUp, Briefcase, Building, Plus, Edit } from "lucide-react";

export default async function CareerPathPage() {
  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const careerPaths = [
    {
      department: "Operasional",
      levels: [
        { level: "Entry", positions: ["Operator Gudang", "Driver", "Helper"] },
        { level: "Staff", positions: ["Staff Gudang", "Staff Logistik", "Admin Operasional"] },
        { level: "Supervisor", positions: ["Supervisor Gudang", "Supervisor Armada", "Supervisor Distribusi"] },
        { level: "Manager", positions: ["Manager Operasional", "Manager Logistik"] },
        { level: "Senior", positions: ["Senior Manager Operasional", "Kepala Cabang"] },
      ],
    },
    {
      department: "Keuangan",
      levels: [
        { level: "Entry", positions: ["Staff Admin Keuangan"] },
        { level: "Staff", positions: ["Staff Accounting", "Staff Finance", "Staff Pajak"] },
        { level: "Supervisor", positions: ["Supervisor Accounting", "Supervisor Finance"] },
        { level: "Manager", positions: ["Manager Keuangan", "Finance Controller"] },
        { level: "Senior", positions: ["Senior Finance Manager", "Direktur Keuangan"] },
      ],
    },
    {
      department: "SDM",
      levels: [
        { level: "Entry", positions: ["Staff Admin HR"] },
        { level: "Staff", positions: ["HR Officer", "Recruitment Officer", "Training Officer"] },
        { level: "Supervisor", positions: ["HR Supervisor", "HRBP"] },
        { level: "Manager", positions: ["HR Manager", "Talent Management Manager"] },
        { level: "Senior", positions: ["Senior HR Manager", "Direktur SDM"] },
      ],
    },
    {
      department: "IT",
      levels: [
        { level: "Entry", positions: ["IT Helpdesk"] },
        { level: "Staff", positions: ["IT Support", "Programmer", "Network Admin"] },
        { level: "Supervisor", positions: ["IT Supervisor", "System Analyst"] },
        { level: "Manager", positions: ["IT Manager", "IT Infrastructure Manager"] },
        { level: "Senior", positions: ["Senior IT Manager", "Direktur IT"] },
      ],
    },
  ];

  const levelColors: Record<string, string> = {
    Entry: "bg-slate-100 text-slate-600 border-slate-200",
    Staff: "bg-blue-50 text-blue-700 border-blue-200",
    Supervisor: "bg-amber-50 text-amber-700 border-amber-200",
    Manager: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Senior: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Jalur Karir</h1>
          <p className="text-sm text-gray-500">Visualisasi jenjang karir per departemen.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Edit size={14} /> Edit Jalur Karir
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Building size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Departemen</p>
              <p className="text-xl font-extrabold text-slate-800">{careerPaths.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Briefcase size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Level Jabatan</p>
              <p className="text-xl font-extrabold text-slate-800">
                {careerPaths.reduce((sum, cp) => sum + cp.levels.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Posisi</p>
              <p className="text-xl font-extrabold text-slate-800">
                {careerPaths.reduce((sum, cp) => sum + cp.levels.reduce((s, l) => s + l.positions.length, 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {careerPaths.map((cp) => (
          <div key={cp.department} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#CC0000]/10 text-[#CC0000] rounded-lg">
                  <Building size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">{cp.department}</h3>
                  <p className="text-xs text-slate-400">Jenjang karir departemen</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-4 overflow-x-auto pb-2">
                {cp.levels.map((level, idx) => (
                  <div key={level.level} className="flex items-start gap-4 min-w-fit">
                    <div className={`rounded-2xl border p-5 min-w-[200px] ${levelColors[level.level] || "bg-slate-50 border-slate-200"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider opacity-70">{level.level}</span>
                        <span className="text-[9px] font-bold opacity-50">{idx + 1}</span>
                      </div>
                      <div className="space-y-1.5">
                        {level.positions.map((pos) => (
                          <div key={pos} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0"></div>
                            <span className="text-[10px] font-semibold">{pos}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {idx < cp.levels.length - 1 && (
                      <div className="flex items-center py-8">
                        <ArrowUp size={18} className="text-slate-300 shrink-0" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Edit Jalur Karir</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tambah atau ubah jenjang karir</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Departemen</label>
            <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
              <option value="">Pilih Departemen</option>
              {departments?.map((d: Record<string, unknown>) => (
                <option key={d.name as string} value={d.name as string}>{d.name as string}</option>
              )) || <option>Operasional</option>}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level</label>
            <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
              <option value="">Pilih Level</option>
              <option>Entry</option><option>Staff</option><option>Supervisor</option><option>Manager</option><option>Senior</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Posisi</label>
            <input type="text" placeholder="Nama jabatan" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          <div className="md:col-span-3">
            <button className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
              <Plus size={14} /> Tambah Posisi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
