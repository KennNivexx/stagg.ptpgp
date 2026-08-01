"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Save, AlertOctagon } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { createNC, updateNCStatus, type LaporanNC, type Audit5R } from "@/app/actions/ga-housekeeping";

const STATUS_STYLE: Record<string, string> = {
  Terbuka: "bg-red-50 text-red-700 border-red-200",
  Ditindaklanjuti: "bg-amber-50 text-amber-700 border-amber-200",
  Ditutup: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const emptyForm = { audit_5r_id: "", deskripsi: "", tindak_lanjut: "", pic: "", batas_waktu: "" };

export default function NCTab({ initialAudits, initialReports }: { initialAudits: Audit5R[]; initialReports: LaporanNC[] }) {
  const [reports, setReports] = useState<LaporanNC[]>(initialReports);
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
    const result = await createNC(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowForm(false);
    setForm(emptyForm);
    flash("success", "Laporan ketidaksesuaian berhasil disimpan.");
    router.refresh();
  };

  const advance = async (id: string, status: "Ditindaklanjuti" | "Ditutup") => {
    const result = await updateNCStatus(id, status);
    if ("error" in result) { flash("error", result.error); return; }
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">Laporan ketidaksesuaian (NC) dari hasil audit 5R.</p>
        <button onClick={() => setShowForm(true)} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#aa0000] inline-flex items-center gap-2">
          <Plus size={14} /> Laporan Baru
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      {reports.length === 0 ? (
        <EmptyState icon={AlertOctagon} title="Belum ada laporan ketidaksesuaian." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left font-bold px-4 py-3">Deskripsi</th>
                <th className="text-left font-bold px-4 py-3">Tindak Lanjut</th>
                <th className="text-left font-bold px-4 py-3">PIC</th>
                <th className="text-left font-bold px-4 py-3">Batas Waktu</th>
                <th className="text-left font-bold px-4 py-3">Status</th>
                <th className="text-right font-bold px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-700 max-w-xs">{r.deskripsi}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">{r.tindak_lanjut || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.pic || "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.batas_waktu || "-"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "Terbuka" && <button onClick={() => advance(r.id, "Ditindaklanjuti")} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100">Tindak Lanjuti</button>}
                    {r.status === "Ditindaklanjuti" && <button onClick={() => advance(r.id, "Ditutup")} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Tutup</button>}
                  </td>
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
              <h3 className="font-extrabold text-slate-800 text-sm">Laporan Ketidaksesuaian Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Terkait Audit 5R (opsional)</label>
                <select value={form.audit_5r_id} onChange={e => setForm({ ...form, audit_5r_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Tidak terkait audit tertentu</option>
                  {initialAudits.map(a => <option key={a.id} value={a.id}>{a.area} — {a.tanggal_audit}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea required value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={3} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tindak Lanjut</label>
                <textarea value={form.tindak_lanjut} onChange={e => setForm({ ...form, tindak_lanjut: e.target.value })} rows={2} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">PIC</label>
                  <input value={form.pic} onChange={e => setForm({ ...form, pic: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batas Waktu</label>
                  <input type="date" value={form.batas_waktu} onChange={e => setForm({ ...form, batas_waktu: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
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
