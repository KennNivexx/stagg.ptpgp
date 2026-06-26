"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, Star } from "lucide-react";
import { saveKpiEvaluation } from "@/app/actions/performance-hrd";

type Employee = { id: string; full_name: string; department: string; position: string };
type KpiEval = Record<string, unknown>;

interface Props {
  employees: Employee[];
  evaluations: KpiEval[];
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function KpiForm({ employees, evaluations }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<KpiEval | null>(null);

  async function handleSave() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await saveKpiEvaluation(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Evaluasi KPI berhasil disimpan!" });
    formRef.current.reset();
    setShowForm(false);
    router.refresh();
  }

  function scoreColor(score: number) {
    if (score >= 85) return "text-emerald-600 bg-emerald-50";
    if (score >= 70) return "text-blue-600 bg-blue-50";
    if (score >= 55) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> {showForm ? "Tutup Form" : "Buat Evaluasi Baru"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Evaluasi KPI</h3>
          </div>
          <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
              <select name="employee_id" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                <option value="">Pilih karyawan...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Periode</label>
              <input name="period" type="text" placeholder="Q1 2026 / Jan 2026" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">KPI Metrics (satu per baris: Metric|Bobot|Nilai)</label>
              <textarea name="metrics" rows={3} placeholder="Sales Revenue|30|85&#10;Customer Satisfaction|25|90&#10;Productivity|45|75" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Skor Total (0–100)</label>
              <input name="score" type="number" min="0" max="100" placeholder="82" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan</label>
              <input name="notes" type="text" placeholder="Catatan evaluator..." className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="md:col-span-2">
              <Msg m={msg} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan Evaluasi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
            <h3 className="font-extrabold text-slate-800 mb-4">Detail Evaluasi KPI</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Karyawan</span><span className="font-bold">{(detail.employees as Record<string, string>)?.full_name || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Periode</span><span className="font-bold">{detail.period as string}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Skor</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${scoreColor(Number(detail.score))}`}>{Number(detail.score).toFixed(0)}</span>
              </div>
              {!!detail.notes && <div className="flex justify-between"><span className="text-slate-500">Catatan</span><span className="font-medium text-xs text-right max-w-xs">{detail.notes as string}</span></div>}
            </div>
            <button onClick={() => setDetail(null)} className="mt-6 w-full px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200">Tutup</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Karyawan", "Periode", "Skor", "Grade", "Catatan", ""].map((h) => (
                <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {evaluations.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">Belum ada evaluasi KPI. Klik &quot;Buat Evaluasi Baru&quot; untuk mulai.</td></tr>
            ) : evaluations.map((ev) => {
              const emp = ev.employees as Record<string, string> | undefined;
              const score = Number(ev.score) || 0;
              const grade = score >= 90 ? "A" : score >= 80 ? "B+" : score >= 70 ? "B" : score >= 60 ? "C" : "D";
              return (
                <tr key={ev.id as string} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "-"}</p>
                    <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{ev.period as string}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${scoreColor(score)}`}>{score.toFixed(0)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                      <Star size={12} className="fill-amber-400 text-amber-400" />{grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-[150px] truncate">{(ev.notes as string) || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setDetail(ev)}
                      className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center gap-1 ml-auto">
                      <Eye size={10} /> Lihat Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
