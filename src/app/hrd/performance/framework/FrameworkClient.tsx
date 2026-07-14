"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Target, Sparkles, Scale, CheckCircle2, XCircle } from "lucide-react";
import {
  saveKpiCatalogEntry, deleteKpiCatalogEntry,
  saveBudayaPerusahaan, deleteBudayaPerusahaan, saveBehaviourIndicator, deleteBehaviourIndicator,
  savePerformanceFramework,
} from "@/app/actions/performance-hrd";
import EmptyState from "@/components/EmptyState";

type Position = { id: string; name: string; department: string | null };
type KpiCatalogEntry = { id: string; jabatan_id: string; nama_kpi: string; source_system: string | null; satuan: string | null; bobot_default: number; aktif: boolean };
type Budaya = { id: string; kode: string | null; nama: string; deskripsi: string | null; bobot_default: number; indikator: { id: string; deskripsi: string }[] };
type Framework = { id: string; jabatan_id: string | null; ta_weight_pct: number; culture_weight_pct: number; jabatan?: { name: string } | null };

interface Props {
  positions: Position[];
  kpiCatalog: KpiCatalogEntry[];
  budayaList: Budaya[];
  frameworks: Framework[];
}

const TABS = [
  { key: "kpi", label: "KPI Catalog", icon: Target },
  { key: "culture", label: "Core Values", icon: Sparkles },
  { key: "weight", label: "Bobot TA:Culture", icon: Scale },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function FrameworkClient({ positions, kpiCatalog, budayaList, frameworks }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("kpi");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedJabatan, setSelectedJabatan] = useState(positions[0]?.id || "");

  const showMsg = (type: "success" | "error", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  async function runAction(action: (fd: FormData) => Promise<{ error?: string; success?: true }>, fd: FormData, successText: string) {
    setBusy(true);
    const res = await action(fd);
    setBusy(false);
    if (res?.error) { showMsg("error", res.error); return; }
    showMsg("success", successText);
    router.refresh();
  }

  async function runDelete(action: (id: string) => Promise<{ error?: string; success?: true }>, id: string) {
    setBusy(true);
    const res = await action(id);
    setBusy(false);
    if (res?.error) { showMsg("error", res.error); return; }
    router.refresh();
  }

  const catalogForJabatan = kpiCatalog.filter(k => k.jabatan_id === selectedJabatan);
  const frameworkForJabatan = frameworks.find(f => f.jabatan_id === selectedJabatan);
  const defaultFramework = frameworks.find(f => f.jabatan_id === null);

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${tab === t.key ? "bg-[#CC0000] text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {msg && <Msg m={msg} />}

      {tab === "kpi" && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jabatan</label>
            <select value={selectedJabatan} onChange={e => setSelectedJabatan(e.target.value)}
              className="w-full max-w-sm text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
              {positions.map(p => <option key={p.id} value={p.id}>{p.name}{p.department ? ` — ${p.department}` : ""}</option>)}
            </select>
          </div>

          <div className="divide-y divide-slate-50 border-t border-slate-100">
            {catalogForJabatan.length === 0 ? (
              <EmptyState icon={Target} title="Belum ada KPI untuk jabatan ini." />
            ) : catalogForJabatan.map(k => (
              <div key={k.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{k.nama_kpi}</p>
                  <p className="text-[11px] text-slate-400">{k.source_system || "-"} {k.satuan ? `· ${k.satuan}` : ""} · Bobot {k.bobot_default}</p>
                </div>
                <button onClick={() => runDelete(deleteKpiCatalogEntry, k.id)} disabled={busy} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>

          <form action={fd => runAction(saveKpiCatalogEntry, fd, "KPI berhasil ditambahkan.")} className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <input type="hidden" name="jabatan_id" value={selectedJabatan} />
            <input name="nama_kpi" placeholder="Nama KPI, mis. Productivity" required className="border border-gray-200 p-2.5 rounded-xl text-xs sm:col-span-2" />
            <input name="source_system" placeholder="Source System, mis. Manufacturing" className="border border-gray-200 p-2.5 rounded-xl text-xs" />
            <input name="satuan" placeholder="Satuan, mis. %" className="border border-gray-200 p-2.5 rounded-xl text-xs" />
            <input name="bobot_default" type="number" min="0" max="100" placeholder="Bobot Default" className="border border-gray-200 p-2.5 rounded-xl text-xs" />
            <button type="submit" disabled={busy || !selectedJabatan} className="sm:col-span-2 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah KPI</button>
          </form>
        </div>
      )}

      {tab === "culture" && (
        <div className="space-y-4">
          {budayaList.length === 0 && <EmptyState icon={Sparkles} title="Belum ada Core Value. Perusahaan bebas mendefinisikan sendiri (mis. Integrity/Discipline, AKHLAK, 5S)." />}
          {budayaList.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{b.kode ? `${b.kode} — ` : ""}{b.nama}</p>
                  {b.deskripsi && <p className="text-xs text-slate-500 mt-0.5">{b.deskripsi}</p>}
                  <p className="text-[11px] text-slate-400 mt-0.5">Bobot Default: {b.bobot_default}</p>
                </div>
                <button onClick={() => runDelete(deleteBudayaPerusahaan, b.id)} disabled={busy} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
              <div className="pl-3 border-l-2 border-slate-100 space-y-1.5">
                {b.indikator.length === 0 ? <p className="text-[11px] text-slate-400">Belum ada behaviour indicator.</p> : b.indikator.map(i => (
                  <div key={i.id} className="flex items-center justify-between gap-2 text-xs text-slate-600">
                    <span>• {i.deskripsi}</span>
                    <button onClick={() => runDelete(deleteBehaviourIndicator, i.id)} disabled={busy} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-600"><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
              <form action={fd => runAction(saveBehaviourIndicator, fd, "Behaviour indicator ditambahkan.")} className="flex gap-2">
                <input type="hidden" name="budaya_id" value={b.id} />
                <input name="deskripsi" placeholder="Tambah behaviour indicator..." required className="flex-1 border border-gray-200 p-2 rounded-lg text-xs" />
                <button type="submit" disabled={busy} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={12} /></button>
              </form>
            </div>
          ))}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-3">Tambah Core Value Baru</h3>
            <form action={fd => runAction(saveBudayaPerusahaan, fd, "Core Value berhasil ditambahkan.")} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input name="kode" placeholder="Kode, mis. C001" className="border border-gray-200 p-2.5 rounded-xl text-xs" />
              <input name="nama" placeholder="Nama Value, mis. Integrity" required className="border border-gray-200 p-2.5 rounded-xl text-xs" />
              <input name="deskripsi" placeholder="Deskripsi" className="border border-gray-200 p-2.5 rounded-xl text-xs sm:col-span-2" />
              <input name="bobot_default" type="number" min="0" max="100" placeholder="Bobot Default" className="border border-gray-200 p-2.5 rounded-xl text-xs" />
              <button type="submit" disabled={busy} className="flex items-center justify-center gap-1.5 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-xl text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah Core Value</button>
            </form>
          </div>
        </div>
      )}

      {tab === "weight" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-1">Default Global</h3>
            <p className="text-xs text-slate-400 mb-4">Dipakai untuk jabatan yang belum punya konfigurasi bobot sendiri.</p>
            <WeightForm jabatanId={null} current={defaultFramework} busy={busy} onSubmit={fd => runAction(savePerformanceFramework, fd, "Bobot default tersimpan.")} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Per Jabatan</h3>
            <div className="mb-4">
              <select value={selectedJabatan} onChange={e => setSelectedJabatan(e.target.value)}
                className="w-full max-w-sm text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                {positions.map(p => <option key={p.id} value={p.id}>{p.name}{p.department ? ` — ${p.department}` : ""}</option>)}
              </select>
            </div>
            <WeightForm jabatanId={selectedJabatan} current={frameworkForJabatan} busy={busy} onSubmit={fd => runAction(savePerformanceFramework, fd, "Bobot jabatan tersimpan.")} />
          </div>

          {frameworks.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Jabatan", "TA %", "Culture %"].map(h => <th key={h} className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {frameworks.map(f => (
                    <tr key={f.id}>
                      <td className="px-6 py-3 text-xs font-semibold text-slate-700">{f.jabatan_id ? (f.jabatan?.name || "-") : "(Default Global)"}</td>
                      <td className="px-6 py-3 text-xs text-slate-600">{f.ta_weight_pct}%</td>
                      <td className="px-6 py-3 text-xs text-slate-600">{f.culture_weight_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeightForm({ jabatanId, current, busy, onSubmit }: { jabatanId: string | null; current?: Framework; busy: boolean; onSubmit: (fd: FormData) => void }) {
  const [ta, setTa] = useState(current?.ta_weight_pct ?? 70);
  const [culture, setCulture] = useState(current?.culture_weight_pct ?? 30);
  const total = Number(ta) + Number(culture);
  const valid = Math.round(total) === 100;

  return (
    <form action={onSubmit} className="flex flex-wrap items-end gap-3">
      {jabatanId && <input type="hidden" name="jabatan_id" value={jabatanId} />}
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Target Achievement %</label>
        <input name="ta_weight_pct" type="number" min="0" max="100" value={ta} onChange={e => setTa(Number(e.target.value))}
          className="w-28 border border-gray-200 p-2.5 rounded-xl text-xs" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Culture Achievement %</label>
        <input name="culture_weight_pct" type="number" min="0" max="100" value={culture} onChange={e => setCulture(Number(e.target.value))}
          className="w-28 border border-gray-200 p-2.5 rounded-xl text-xs" />
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl ${valid ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
        {valid ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {total}% / 100%
      </div>
      <button type="submit" disabled={busy || !valid} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold disabled:opacity-50">Simpan</button>
    </form>
  );
}
