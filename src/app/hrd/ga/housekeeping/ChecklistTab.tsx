"use client";

import { useState } from "react";
import { Plus, X, Save, ClipboardCheck, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { submitChecklistKebersihan, type ChecklistKebersihan, type ChecklistItem } from "@/app/actions/ga-housekeeping";

const emptyForm = { ruang_atau_area: "", petugas: "", catatan: "" };

export default function ChecklistTab({ initialChecklist }: { initialChecklist: ChecklistKebersihan[] }) {
  const [checklist] = useState<ChecklistKebersihan[]>(initialChecklist);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<ChecklistItem[]>([{ item: "", status: "OK" }]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const flash = (type: "success" | "error", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const addItemRow = () => setItems(prev => [...prev, { item: "", status: "OK" }]);
  const removeItemRow = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("ruang_atau_area", form.ruang_atau_area);
    fd.append("petugas", form.petugas);
    fd.append("catatan", form.catatan);
    fd.append("item_diperiksa", JSON.stringify(items.filter(i => i.item.trim())));
    const result = await submitChecklistKebersihan(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowForm(false);
    setForm(emptyForm);
    setItems([{ item: "", status: "OK" }]);
    flash("success", "Checklist berhasil disimpan.");
    window.location.reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">Checklist kebersihan harian per ruang/area.</p>
        <button onClick={() => setShowForm(true)} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#aa0000] inline-flex items-center gap-2">
          <Plus size={14} /> Checklist Baru
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      {checklist.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="Belum ada checklist kebersihan." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checklist.map(c => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">{c.ruang_atau_area}</h3>
              <p className="text-[11px] text-slate-400 mb-2">{c.tanggal} • {c.petugas || "Petugas belum diisi"}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {(c.item_diperiksa || []).map((it, idx) => (
                  <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${it.status === "OK" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>{it.item}: {it.status}</span>
                ))}
              </div>
              {c.catatan && <p className="text-[11px] text-slate-500">{c.catatan}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Checklist Kebersihan Baru</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ruang/Area</label>
                <input required value={form.ruang_atau_area} onChange={e => setForm({ ...form, ruang_atau_area: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Petugas (OB)</label>
                <input value={form.petugas} onChange={e => setForm({ ...form, petugas: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Item Diperiksa</label>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input value={it.item} onChange={e => setItems(prev => prev.map((p, i) => i === idx ? { ...p, item: e.target.value } : p))} placeholder="cth. AC, Proyektor, Wifi" className="flex-1 border border-slate-200 p-2 rounded-lg text-xs" />
                      <select value={it.status} onChange={e => setItems(prev => prev.map((p, i) => i === idx ? { ...p, status: e.target.value as "OK" | "Rusak" } : p))} className="border border-slate-200 p-2 rounded-lg text-xs">
                        <option value="OK">OK</option>
                        <option value="Rusak">Rusak</option>
                      </select>
                      <button type="button" onClick={() => removeItemRow(idx)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItemRow} className="mt-2 text-[11px] font-bold text-[#CC0000] hover:underline">+ Tambah item</button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <textarea value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} rows={2} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm resize-none" />
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
