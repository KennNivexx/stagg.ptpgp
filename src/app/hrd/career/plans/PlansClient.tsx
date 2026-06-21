"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clipboard, Plus, Target, Calendar, BookOpen, User, CheckCircle } from "lucide-react";
import { createDevelopmentPlan, updatePlanProgress } from "@/app/actions/career-hrd";

type Employee = { id: string; full_name: string; department: string; position: string };
type Plan = Record<string, unknown>;

interface Props {
  employees: Employee[];
  initialPlans: Plan[];
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function PlansClient({ employees, initialPlans }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingProgress, setEditingProgress] = useState<{ id: string; value: number } | null>(null);

  async function handleSubmit() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await createDevelopmentPlan(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Rencana pengembangan berhasil disimpan!" });
    formRef.current.reset();
    router.refresh();
  }

  async function handleProgressUpdate(id: string, progress: number) {
    await updatePlanProgress(id, progress);
    setEditingProgress(null);
    router.refresh();
  }

  const plans = initialPlans;
  const avgProgress = plans.length > 0
    ? Math.round(plans.reduce((s, p) => s + (Number(p.progress) || 0), 0) / plans.length)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Rencana Pengembangan</h1>
          <p className="text-sm text-gray-500">Rencana pengembangan karir dan kompetensi karyawan.</p>
        </div>
        <button onClick={() => document.getElementById("plan-form")?.scrollIntoView({ behavior: "smooth" })}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Tambah Rencana
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Clipboard, label: "Total Rencana", value: plans.length, color: "bg-blue-50 text-blue-600" },
          { icon: Target, label: "Rata-rata Progres", value: `${avgProgress}%`, color: "bg-emerald-50 text-emerald-600" },
          { icon: User, label: "Karyawan Terlibat", value: new Set(plans.map((p) => p.employee_id)).size, color: "bg-purple-50 text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {plans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Clipboard size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada rencana pengembangan.</p>
            </div>
          ) : plans.map((plan) => {
            const emp = plan.employees as Record<string, string> | undefined;
            const progress = Number(plan.progress) || 0;
            const id = plan.id as string;
            const isExpanded = expandedId === id;
            const isEditing = editingProgress?.id === id;
            const trainings = (plan.trainings as string || "").split(",").map((t) => t.trim()).filter(Boolean);
            return (
              <div key={id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#1A2530] to-slate-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {emp?.full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800">{emp?.full_name || "-"}</h3>
                      <p className="text-[10px] text-slate-400">{emp?.position || "-"} - {emp?.department || "-"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-[#CC0000]">{progress}%</div>
                    <p className="text-[9px] text-slate-400">Progres</p>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                  <div className="bg-[#CC0000] h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>

                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] mb-4 p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Target size={10} /> Tujuan</p>
                      <p className="text-slate-700 font-medium">{plan.goals as string}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Calendar size={10} /> Timeline</p>
                      <p className="text-slate-700 font-medium">{(plan.timeline as string) || "-"}</p>
                    </div>
                    {trainings.length > 0 && (
                      <div>
                        <p className="font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><BookOpen size={10} /> Pelatihan</p>
                        <div className="flex flex-wrap gap-1">
                          {trainings.map((t) => <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-semibold">{t}</span>)}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><User size={10} /> Mentor</p>
                      <p className="text-slate-700 font-medium">{(plan.mentor as string) || "-"}</p>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="mb-4 flex items-center gap-3">
                    <input type="number" min="0" max="100" defaultValue={progress}
                      onChange={(e) => setEditingProgress({ id, value: parseInt(e.target.value, 10) || 0 })}
                      className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#CC0000]" />
                    <button onClick={() => handleProgressUpdate(id, editingProgress!.value)}
                      className="px-3 py-1.5 text-[10px] font-bold bg-[#CC0000] text-white rounded-lg hover:bg-[#aa0000]">Simpan</button>
                    <button onClick={() => setEditingProgress(null)}
                      className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg">Batal</button>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                  <button onClick={() => setExpandedId(isExpanded ? null : id)}
                    className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                    {isExpanded ? "Sembunyikan" : "Detail"}
                  </button>
                  <button onClick={() => setEditingProgress(isEditing ? null : { id, value: progress })}
                    className="px-3 py-1.5 text-[10px] font-bold bg-[#CC0000]/10 text-[#CC0000] rounded-lg hover:bg-[#CC0000]/20 transition-colors">
                    {isEditing ? "Batal" : "Edit Progres"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div id="plan-form" className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Rencana Pengembangan</h3>
            </div>
            <form ref={formRef} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
                <select name="employee_id" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Karyawan</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tujuan</label>
                <textarea name="goals" rows={2} placeholder="Target karir yang ingin dicapai..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pelatihan (pisah koma)</label>
                <textarea name="trainings" rows={2} placeholder="Leadership Training, Supply Chain..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Timeline</label>
                <input name="timeline" type="text" placeholder="Jan 2026 - Des 2027" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mentor</label>
                <select name="mentor" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Mentor (opsional)</option>
                  {employees.slice(0, 10).map((e) => <option key={e.id} value={e.full_name}>{e.full_name}</option>)}
                </select>
              </div>
              <Msg m={msg} />
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                <Plus size={14} /> {loading ? "Menyimpan..." : "Simpan Rencana"}
              </button>
            </form>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-400" /> Mengapa Rencana Pengembangan?
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#9679;</span><span>Memetakan jalur karir yang jelas</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#9679;</span><span>Mengidentifikasi kebutuhan pelatihan</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#9679;</span><span>Meningkatkan retensi karyawan</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&#9679;</span><span>Membangun suksesi kepemimpinan</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
