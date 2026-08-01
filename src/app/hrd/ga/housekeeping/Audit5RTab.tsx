"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, Sparkles } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { submitAudit5R, type Audit5R } from "@/app/actions/ga-housekeeping";

const emptyForm = { area: "", auditor: "", skor_atau_hasil: "" };

export default function Audit5RTab({ initialAudits }: { initialAudits: Audit5R[] }) {
  const [audits] = useState<Audit5R[]>(initialAudits);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const flash = (type: "success" | "error", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    const result = await submitAudit5R(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowForm(false);
    setForm(emptyForm);
    flash("success", "Audit 5R berhasil disimpan.");
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">Log audit 5R (Ringkas, Rapi, Resik, Rawat, Rajin) per area.</p>
        <button onClick={() => setShowForm(true)} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#aa0000] inline-flex items-center gap-2">
          <Plus size={14} /> Audit Baru
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      {audits.length === 0 ? (
        <EmptyState icon={Sparkles} title="Belum ada audit 5R." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left font-bold px-4 py-3">Area</th>
                <th className="text-left font-bold px-4 py-3">Tanggal</th>
                <th className="text-left font-bold px-4 py-3">Auditor</th>
                <th className="text-left font-bold px-4 py-3">Skor/Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {audits.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-700 font-bold">{a.area}</td>
                  <td className="px-4 py-3 text-slate-600">{a.tanggal_audit}</td>
                  <td className="px-4 py-3 text-slate-600">{a.auditor || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.skor_atau_hasil || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Audit 5R Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Area</label>
                <input required value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Auditor</label>
                <input value={form.auditor} onChange={e => setForm({ ...form, auditor: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Skor/Hasil</label>
                <input value={form.skor_atau_hasil} onChange={e => setForm({ ...form, skor_atau_hasil: e.target.value })} placeholder="cth. 85 / Baik" className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
