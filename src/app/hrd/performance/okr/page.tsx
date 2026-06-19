import { supabaseAdmin } from "@/lib/supabase";
import { Target, Plus, TrendingUp, Building, BarChart3 } from "lucide-react";

export default async function OKRPage() {
  const [{ data: departments }, { data: employees }, { data: evaluations }] = await Promise.all([
    supabaseAdmin.from("departments").select("name").order("name"),
    supabaseAdmin.from("employees").select("id, full_name, department").limit(100),
    supabaseAdmin.from("kpi_evaluations").select("*, employees!inner(full_name, department)").limit(200),
  ]);

  const evals = (evaluations || []) as Record<string, unknown>[];

  const deptMap = new Map<string, { dept: string; evaluations: Record<string, unknown>[] }>();
  evals.forEach((ev) => {
    const emp = ev.employees as Record<string, string> | undefined;
    const dept = emp?.department || "Lainnya";
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { dept, evaluations: [] });
    }
    deptMap.get(dept)!.evaluations.push(ev);
  });

  const okrData = Array.from(deptMap.values()).map((item, idx) => {
    const keyResults = item.evaluations.slice(0, 4).map((ev, i) => {
      const emp = ev.employees as Record<string, string> | undefined;
      const score = Number(ev.score) || 0;
      return {
        id: i + 1,
        text: `${emp?.full_name || "Unknown"} - ${ev.period || "-"}`,
        progress: score,
      };
    });
    const overallProgress = keyResults.length > 0
      ? Math.round(keyResults.reduce((s, kr) => s + kr.progress, 0) / keyResults.length)
      : 0;
    return {
      id: idx + 1,
      department: item.dept,
      objective: `Pencapaian KPI ${item.dept}`,
      keyResults,
      overallProgress,
    };
  }).filter((o) => o.keyResults.length > 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Manajemen OKR</h1>
          <p className="text-sm text-gray-500">Objectives & Key Results per departemen.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Tambah OKR Baru
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total OKR Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{okrData.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata-rata Progres</p>
              <p className="text-xl font-extrabold text-slate-800">
                {Math.round(okrData.reduce((sum, o) => sum + o.overallProgress, 0) / okrData.length)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Building size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Departemen Terlibat</p>
              <p className="text-xl font-extrabold text-slate-800">{okrData.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {okrData.map((okr) => (
          <div key={okr.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{okr.department}</span>
                    <span className="text-[10px] font-bold text-slate-400">Objective</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800">{okr.objective}</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-[#CC0000]">{okr.overallProgress}%</div>
                  <p className="text-[10px] text-slate-400 font-medium">Progres Keseluruhan</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4 overflow-hidden">
                <div
                  className="bg-[#CC0000] h-2.5 rounded-full transition-all"
                  style={{ width: `${okr.overallProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Key Results</h4>
              {okr.keyResults.map((kr) => (
                <div key={kr.id} className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-700">{kr.text}</p>
                      <span className="text-[10px] font-bold text-slate-500">{kr.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          kr.progress >= 80 ? "bg-emerald-500" :
                          kr.progress >= 50 ? "bg-amber-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${kr.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Tambah OKR Baru</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tetapkan Objective & Key Results baru</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Departemen</label>
            <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
              <option value="">Pilih Departemen</option>
              {departments?.map((d: Record<string, unknown>) => (
                <option key={d.name as string} value={d.name as string}>{d.name as string}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Periode</label>
            <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
              <option value="">Pilih Periode</option>
              <option>Q1 2026</option><option>Q2 2026</option><option>Q3 2026</option><option>Q4 2026</option>
            </select>
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Objective</label>
            <textarea rows={2} placeholder="Tulis objective yang ingin dicapai..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Key Results (pisahkan dengan baris baru)</label>
            <textarea rows={4} placeholder="Tulis key results, satu per baris..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
          </div>
          <div className="md:col-span-2">
            <button className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
              <Plus size={14} /> Simpan OKR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
