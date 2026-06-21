import { supabaseAdmin } from "@/lib/supabase";
import { TrendingUp, ArrowUp, Briefcase, Building } from "lucide-react";
import CareerPathForm from "./CareerPathForm";

export default async function CareerPathPage() {
  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const { data: positions } = await supabaseAdmin
    .from("positions")
    .select("name, department, level")
    .order("level")
    .order("name");

  const levelOrder = ["Entry", "Staff", "Supervisor", "Manager", "Senior"];

  const grouped: Record<string, Record<string, string[]>> = {};
  (positions || []).forEach((p: Record<string, unknown>) => {
    const dept = (p.department as string) || "Umum";
    const level = (p.level as string) || "Staff";
    const name = p.name as string;
    if (!grouped[dept]) grouped[dept] = {};
    if (!grouped[dept][level]) grouped[dept][level] = [];
    grouped[dept][level].push(name);
  });

  const careerPaths = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([department, levels]) => ({
      department,
      levels: levelOrder
        .filter((l) => levels[l] && levels[l].length > 0)
        .map((level) => ({ level, positions: levels[level] })),
    }));

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
        <a href="#career-path-form"
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          Edit Jalur Karir
        </a>
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
        {careerPaths.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Building size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada jalur karir yang terdefinisi.</p>
            <p className="text-xs text-slate-400 mt-1">Tambahkan posisi di bagian Edit Jalur Karir di bawah.</p>
          </div>
        ) : careerPaths.map((cp) => (
          <div key={cp.department} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#CC0000]/10 text-[#CC0000] rounded-lg"><Building size={18} /></div>
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
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
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

      <CareerPathForm departments={departments || []} />
    </div>
  );
}
