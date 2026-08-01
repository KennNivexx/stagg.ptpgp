"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Plus, X, Save, Pencil, Wrench, Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  createAsset, updateAsset, requestAssetRepair, decideAssetRepair,
  type Aset, type PermintaanPerbaikanAset,
} from "@/app/actions/ga-assets";

const KONDISI_OPTIONS = ["Baik", "Rusak Ringan", "Rusak Berat", "Hilang"] as const;
const KONDISI_STYLE: Record<string, string> = {
  Baik: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Rusak Ringan": "bg-amber-50 text-amber-700 border-amber-200",
  "Rusak Berat": "bg-red-50 text-red-700 border-red-200",
  Hilang: "bg-slate-100 text-slate-600 border-slate-200",
};
const STATUS_REPAIR_STYLE: Record<string, string> = {
  Diajukan: "bg-blue-50 text-blue-700 border-blue-200",
  Disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Ditolak: "bg-red-50 text-red-700 border-red-200",
  Selesai: "bg-slate-100 text-slate-600 border-slate-200",
};

const emptyAssetForm = {
  id: "", nama_aset: "", jenis: "", divisi: "", penanggung_jawab: "", jumlah: "1", kondisi: "Baik", status: "Aktif",
};

export default function AssetsClient({ initialAssets, initialRepairRequests }: { initialAssets: Aset[]; initialRepairRequests: PermintaanPerbaikanAset[] }) {
  const [tab, setTab] = useState<"list" | "repair">("list");
  const [assets, setAssets] = useState<Aset[]>(initialAssets);
  const [repairs, setRepairs] = useState<PermintaanPerbaikanAset[]>(initialRepairRequests);
  const [showForm, setShowForm] = useState(false);
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [form, setForm] = useState(emptyAssetForm);
  const [repairForm, setRepairForm] = useState({ asset_id: "", jenis_permintaan: "Perbaikan", alasan: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [divisiFilter, setDivisiFilter] = useState("");

  const divisiList = useMemo(() => [...new Set(assets.map(a => a.divisi).filter(Boolean))] as string[], [assets]);

  const filtered = useMemo(() => {
    let list = assets;
    if (divisiFilter) list = list.filter(a => a.divisi === divisiFilter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(a => `${a.nama_aset} ${a.kode_aset} ${a.jenis}`.toLowerCase().includes(q));
    return list;
  }, [assets, search, divisiFilter]);

  const flash = (type: "success" | "error", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const openAdd = () => { setForm(emptyAssetForm); setShowForm(true); };
  const openEdit = (a: Aset) => {
    setForm({
      id: a.id, nama_aset: a.nama_aset, jenis: a.jenis, divisi: a.divisi || "",
      penanggung_jawab: a.penanggung_jawab || "", jumlah: String(a.jumlah), kondisi: a.kondisi, status: a.status,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    const result = form.id ? await updateAsset(fd) : await createAsset(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowForm(false);
    flash("success", "Aset berhasil disimpan.");
    // Re-fetch would need server round trip; simplest reliable path is a full reload of the list state via location refresh is avoided — instead just patch client state optimistically for edit, and prompt add via page revalidation on navigation.
    if (form.id) {
      setAssets(prev => prev.map(a => a.id === form.id ? {
        ...a, nama_aset: form.nama_aset, jenis: form.jenis, divisi: form.divisi,
        penanggung_jawab: form.penanggung_jawab || null, jumlah: parseInt(form.jumlah) || 1,
        kondisi: form.kondisi as Aset["kondisi"], status: form.status as Aset["status"],
      } : a));
    } else {
      router.refresh();
    }
  };

  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(repairForm).forEach(([k, v]) => fd.append(k, v));
    const result = await requestAssetRepair(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowRepairForm(false);
    setRepairForm({ asset_id: "", jenis_permintaan: "Perbaikan", alasan: "" });
    flash("success", "Permintaan berhasil diajukan.");
    router.refresh();
  };

  const handleDecision = async (id: string, decision: "Disetujui" | "Ditolak" | "Selesai") => {
    const result = await decideAssetRepair(id, decision);
    if ("error" in result) { flash("error", result.error); return; }
    setRepairs(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Pengendalian Aset</h1>
          <p className="text-sm text-gray-500 mt-1">Registrasi aset perusahaan dan permintaan perbaikan/penambahan (SOP-SDM-10).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRepairForm(true)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
            <Wrench size={14} /> Permintaan Perbaikan
          </button>
          <button onClick={openAdd} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
            <Plus size={14} /> Tambah Aset
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
        <button onClick={() => setTab("list")} className={`px-4 py-2.5 text-xs font-bold border-b-2 ${tab === "list" ? "border-[#CC0000] text-[#CC0000]" : "border-transparent text-slate-500"}`}>Daftar Aset</button>
        <button onClick={() => setTab("repair")} className={`px-4 py-2.5 text-xs font-bold border-b-2 ${tab === "repair" ? "border-[#CC0000] text-[#CC0000]" : "border-transparent text-slate-500"}`}>
          Antrian Permintaan {repairs.filter(r => r.status === "Diajukan").length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px]">{repairs.filter(r => r.status === "Diajukan").length}</span>}
        </button>
      </div>

      {tab === "list" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, kode, atau jenis aset..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <select value={divisiFilter} onChange={e => setDivisiFilter(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-3 py-2">
              <option value="">Semua Divisi</option>
              {divisiList.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Boxes} title="Belum ada aset." description="Tambahkan aset pertama untuk mulai mengelola registrasi aset perusahaan." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left font-bold px-4 py-3">Kode Aset</th>
                    <th className="text-left font-bold px-4 py-3">Nama Aset</th>
                    <th className="text-left font-bold px-4 py-3">Divisi</th>
                    <th className="text-left font-bold px-4 py-3">PJ</th>
                    <th className="text-left font-bold px-4 py-3">Jumlah</th>
                    <th className="text-left font-bold px-4 py-3">Kondisi</th>
                    <th className="text-left font-bold px-4 py-3">Status</th>
                    <th className="text-right font-bold px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{a.kode_aset}</td>
                      <td className="px-4 py-3 text-slate-700">{a.nama_aset}<div className="text-[10px] text-slate-400">{a.jenis}</div></td>
                      <td className="px-4 py-3 text-slate-600">{a.divisi || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{a.penanggung_jawab || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{a.jumlah}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${KONDISI_STYLE[a.kondisi]}`}>{a.kondisi}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{a.status}</span></td>
                      <td className="px-4 py-3 text-right"><button onClick={() => openEdit(a)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><Pencil size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        repairs.length === 0 ? (
          <EmptyState icon={Wrench} title="Belum ada permintaan perbaikan/penambahan." />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left font-bold px-4 py-3">Aset</th>
                  <th className="text-left font-bold px-4 py-3">Jenis</th>
                  <th className="text-left font-bold px-4 py-3">Alasan</th>
                  <th className="text-left font-bold px-4 py-3">Diajukan Oleh</th>
                  <th className="text-left font-bold px-4 py-3">Status</th>
                  <th className="text-right font-bold px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {repairs.map(r => {
                  const asset = assets.find(a => a.id === r.asset_id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-700">{asset ? `${asset.kode_aset} — ${asset.nama_aset}` : r.asset_id}</td>
                      <td className="px-4 py-3 text-slate-600">{r.jenis_permintaan}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.alasan || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.requested_by || "-"}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_REPAIR_STYLE[r.status]}`}>{r.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        {r.status === "Diajukan" && (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => handleDecision(r.id, "Disetujui")} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Setujui</button>
                            <button onClick={() => handleDecision(r.id, "Ditolak")} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 hover:bg-red-100">Tolak</button>
                          </div>
                        )}
                        {r.status === "Disetujui" && (
                          <button onClick={() => handleDecision(r.id, "Selesai")} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">Tandai Selesai</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">{form.id ? "Edit Aset" : "Tambah Aset Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Aset</label>
                <input required value={form.nama_aset} onChange={e => setForm({ ...form, nama_aset: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis</label>
                  <input required value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })} placeholder="cth. Elektronik" className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Divisi</label>
                  <input required value={form.divisi} onChange={e => setForm({ ...form, divisi: e.target.value })} placeholder="cth. Operasional" className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab</label>
                <input value={form.penanggung_jawab} onChange={e => setForm({ ...form, penanggung_jawab: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah</label>
                  <input type="number" min={1} value={form.jumlah} onChange={e => setForm({ ...form, jumlah: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kondisi</label>
                  <select value={form.kondisi} onChange={e => setForm({ ...form, kondisi: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    {KONDISI_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>
              {form.id && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              )}
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showRepairForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Permintaan Perbaikan / Penambahan Aset</h3>
              <button onClick={() => setShowRepairForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleRepairSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Aset</label>
                <select required value={repairForm.asset_id} onChange={e => setRepairForm({ ...repairForm, asset_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih aset...</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.kode_aset} — {a.nama_aset}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Permintaan</label>
                <select value={repairForm.jenis_permintaan} onChange={e => setRepairForm({ ...repairForm, jenis_permintaan: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="Perbaikan">Perbaikan</option>
                  <option value="Penambahan">Penambahan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan</label>
                <textarea value={repairForm.alasan} onChange={e => setRepairForm({ ...repairForm, alasan: e.target.value })} rows={3} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm resize-none" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Mengirim..." : "Ajukan Permintaan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
