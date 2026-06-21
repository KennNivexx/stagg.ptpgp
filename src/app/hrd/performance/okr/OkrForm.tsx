"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target } from "lucide-react";
import { saveOkr } from "@/app/actions/performance-hrd";

type Employee = { id: string; full_name: string; department: string };
type OkrItem = Record<string, unknown>;

interface Props {
  employees: Employee[];
  okrData: OkrItem[];
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function OkrForm({ employees, okrData }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleSave() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await saveOkr(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "OKR berhasil disimpan!" });
    formRef.current.reset();
    setShowForm(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> {showForm ? "Tutup Form" : "Tambah OKR Baru"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Tambah OKR</h3>
          </div>
          <form ref={formRef} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
                <select name="employee_id" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                  <option value="">Pilih karyawan...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Periode</label>
                <input name="period" type="text" placeholder="Q1 2026" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Objective</label>
              <input name="objective" type="text" placeholder="Tujuan utama yang ingin dicapai..." className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Key Results (satu per baris: Deskripsi|Target|Satuan)</label>
              <textarea name="key_results" rows={3} placeholder="Tingkatkan revenue|10%|persen&#10;Tambah customer baru|50|pelanggan&#10;Reduce churn|5%|persen" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Progress Awal (%)</label>
              <input name="progress" type="number" min="0" max="100" defaultValue={0} className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <Msg m={msg} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan OKR"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {okrData.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <Target size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Belum ada OKR. Klik "Tambah OKR Baru" untuk mulai.</p>
          </div>
        ) : okrData.map((okr) => {
          const progress = Number(okr.progress) || 0;
          const emp = okr.employees as Record<string, string> | undefined;
          return (
            <div key={okr.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">{okr.objective as string}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{emp?.full_name || "-"} · {okr.period as string}</p>
                </div>
                <span className="text-lg font-extrabold text-[#CC0000]">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#CC0000] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
