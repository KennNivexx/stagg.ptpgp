import { supabaseAdmin } from "@/lib/supabase";
import { Target, Plus, Calendar, User, Flag } from "lucide-react";
import EmptyState from "@/components/EmptyState";

async function saveInitiative(formData: FormData) {
  "use server";
  // Fitur akan segera tersedia
}

export default async function PerencanaanStrategis() {
  const [{ data: evaluations }] = await Promise.all([
    supabaseAdmin
      .from("kpi_evaluations")
      .select("*, employees!inner(full_name, department, position)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const evals = (evaluations || []) as Record<string, unknown>[];
  const initiatives = evals.map((ev) => {
    const emp = ev.employees as Record<string, string> | undefined;
    const status = (ev.status as string) || "Draft";
    const score = Number(ev.score) || 0;
    return {
      id: ev.id as string,
      name: `Evaluasi KPI - ${emp?.full_name || "Unknown"}`,
      objective: ev.comments as string || `Penilaian kinerja periode ${ev.period || "-"}`,
      timeline: ev.period as string || "-",
      pic: emp?.full_name || "Unknown",
      status: status.charAt(0).toUpperCase() + status.slice(1),
      progress: score,
    };
  });

  const inProgress = initiatives.filter((i) => i.status === "In Progress").length;
  const planning = initiatives.filter((i) => i.status === "Draft" || i.status === "Planning").length;
  const avgProgress = initiatives.length > 0
    ? Math.round(initiatives.reduce((s, i) => s + i.progress, 0) / initiatives.length)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Perencanaan Strategis SDM</h1>
        <p className="text-sm text-gray-500">Kelola inisiatif dan rencana strategis pengembangan sumber daya manusia.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Inisiatif", value: initiatives.length, icon: <Flag size={18} />, color: "blue" },
          { label: "In Progress", value: inProgress, icon: <Target size={18} />, color: "emerald" },
          { label: "Planning / Draft", value: planning, icon: <Calendar size={18} />, color: "amber" },
          { label: "Rata-rata Progress", value: `${avgProgress}%`, icon: <Target size={18} />, color: "purple" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                stat.color === "amber" ? "bg-amber-50 text-amber-600" :
                "bg-purple-50 text-purple-600"
              }`}>{stat.icon}</div>
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
                <h3 className="font-extrabold text-slate-800 text-sm">Tambah Inisiatif Baru</h3>
                <p className="text-xs text-slate-400 mt-0.5">Buat rencana strategis baru</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <form action={saveInitiative} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nama Inisiatif</label>
                <input type="text" name="nama_inisiatif" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Transformasi Digital HR" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Tujuan</label>
                <textarea name="tujuan" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={3} placeholder="Deskripsikan tujuan strategis..." required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Timeline</label>
                <input type="text" name="timeline" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Jan - Des 2026" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Penanggung Jawab (PIC)</label>
                <input type="text" name="pic" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Nama atau jabatan PIC" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Status</label>
                <select name="status" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30">
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <button type="submit" className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Simpan Inisiatif
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Flag size={16} className="text-blue-600" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Daftar Inisiatif Strategis</h3>
                <p className="text-xs text-slate-400 mt-0.5">Semua rencana strategis SDM</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {initiatives.length === 0 ? (
              <EmptyState icon={Target} title="Belum ada inisiatif strategis." description="Tambahkan inisiatif baru untuk memulai perencanaan strategis." />
            ) : (
              initiatives.map((init) => (
                <div key={init.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Flag size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{init.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{init.objective}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      init.status === "In Progress" ? "bg-emerald-50 text-emerald-700" :
                      init.status === "Completed" ? "bg-blue-50 text-blue-700" :
                      init.status === "On Hold" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>{init.status}</span>
                  </div>
                  <div className="flex items-center gap-6 text-[10px] text-slate-400 ml-11">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {init.timeline}</span>
                    <span className="flex items-center gap-1"><User size={10} /> {init.pic}</span>
                  </div>
                  <div className="flex items-center gap-3 ml-11 mt-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${init.progress}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{init.progress}%</span>
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
