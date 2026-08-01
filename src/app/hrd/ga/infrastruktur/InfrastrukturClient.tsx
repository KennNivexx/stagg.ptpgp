"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Plus, X, Save, Wrench } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  createInfrastruktur, requestMaintenance, updateMaintenanceStatus,
  type Infrastruktur, type PemeliharaanInfrastruktur, type MaintenanceStatus,
} from "@/app/actions/ga-infrastruktur";

const STATUS_COLUMNS: MaintenanceStatus[] = ["Diajukan", "Dianalisis", "Dikerjakan", "Diverifikasi", "Selesai"];
const STATUS_STYLE: Record<string, string> = {
  Diajukan: "bg-blue-50 text-blue-700 border-blue-200",
  Dianalisis: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Dikerjakan: "bg-amber-50 text-amber-700 border-amber-200",
  Diverifikasi: "bg-purple-50 text-purple-700 border-purple-200",
  Selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const emptyInfraForm = { nama: "", jenis: "", lokasi: "" };
const emptyReqForm = { infrastruktur_id: "", jenis: "Reaktif", deskripsi: "", butuh_spare_part: "" };

export default function InfrastrukturClient({ initialInfrastruktur, initialMaintenance }: { initialInfrastruktur: Infrastruktur[]; initialMaintenance: PemeliharaanInfrastruktur[] }) {
  const [infra, setInfra] = useState<Infrastruktur[]>(initialInfrastruktur);
  const [maintenance, setMaintenance] = useState<PemeliharaanInfrastruktur[]>(initialMaintenance);
  const [showInfraForm, setShowInfraForm] = useState(false);
  const [showReqForm, setShowReqForm] = useState(false);
  const [infraForm, setInfraForm] = useState(emptyInfraForm);
  const [reqForm, setReqForm] = useState(emptyReqForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const router = useRouter();

  const grouped = useMemo(() => {
    const map: Record<string, PemeliharaanInfrastruktur[]> = {};
    STATUS_COLUMNS.forEach(s => { map[s] = []; });
    maintenance.forEach(m => { (map[m.status] ||= []).push(m); });
    return map;
  }, [maintenance]);

  const flash = (type: "success" | "error", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const handleInfraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(infraForm).forEach(([k, v]) => fd.append(k, v));
    const result = await createInfrastruktur(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowInfraForm(false);
    flash("success", "Infrastruktur berhasil ditambahkan.");
    router.refresh();
  };

  const handleReqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("infrastruktur_id", reqForm.infrastruktur_id);
    fd.append("jenis", reqForm.jenis);
    fd.append("deskripsi", reqForm.deskripsi);
    if (reqForm.butuh_spare_part) fd.append("butuh_spare_part", "on");
    const result = await requestMaintenance(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowReqForm(false);
    setReqForm(emptyReqForm);
    flash("success", "Permintaan pemeliharaan berhasil diajukan.");
    router.refresh();
  };

  const advance = async (id: string, status: MaintenanceStatus) => {
    const result = await updateMaintenanceStatus(id, status);
    if ("error" in result) { flash("error", result.error); return; }
    setMaintenance(prev => prev.map(m => m.id === id ? { ...m, status } : m));
  };

  const submitVerification = async (hasil: "Efektif" | "Belum Efektif") => {
    if (!verifyingId) return;
    const result = await updateMaintenanceStatus(verifyingId, "Diverifikasi", hasil);
    if ("error" in result) { flash("error", result.error); return; }
    setMaintenance(prev => prev.map(m => m.id === verifyingId ? { ...m, status: hasil === "Efektif" ? "Selesai" : "Dikerjakan", hasil_verifikasi: hasil } : m));
    setVerifyingId(null);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Pemeliharaan Infrastruktur</h1>
          <p className="text-sm text-gray-500 mt-1">Pemeliharaan terjadwal dan reaktif untuk bangunan, jalan, mesin, dan kendaraan (PR-SDM-07).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReqForm(true)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
            <Wrench size={14} /> Ajukan Pemeliharaan
          </button>
          <button onClick={() => setShowInfraForm(true)} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
            <Plus size={14} /> Tambah Infrastruktur
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      {infra.length === 0 ? (
        <EmptyState icon={Building2} title="Belum ada data infrastruktur." description="Tambahkan aset infrastruktur (bangunan, jalan, mesin, dll) untuk mulai mengajukan pemeliharaan." />
      ) : maintenance.length === 0 ? (
        <EmptyState icon={Wrench} title="Belum ada permintaan pemeliharaan." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
          {STATUS_COLUMNS.map(status => (
            <div key={status} className="bg-slate-50 rounded-2xl p-3 min-w-[220px]">
              <div className={`text-[10px] font-bold px-2 py-1 rounded border inline-block mb-3 ${STATUS_STYLE[status]}`}>{status} ({grouped[status].length})</div>
              <div className="space-y-2">
                {grouped[status].map(m => {
                  const infraItem = infra.find(i => i.id === m.infrastruktur_id);
                  return (
                    <div key={m.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-3">
                      <p className="text-xs font-bold text-slate-700 mb-0.5">{infraItem?.nama || m.infrastruktur_id}</p>
                      <p className="text-[10px] text-slate-400 mb-1.5">{m.jenis}{m.butuh_spare_part ? " • Butuh spare part" : ""}</p>
                      {m.deskripsi && <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">{m.deskripsi}</p>}
                      <div className="flex gap-1.5">
                        {status === "Diajukan" && <button onClick={() => advance(m.id, "Dianalisis")} className="text-[10px] font-bold px-2 py-1 rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Analisis</button>}
                        {status === "Dianalisis" && <button onClick={() => advance(m.id, "Dikerjakan")} className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100">Mulai Kerjakan</button>}
                        {status === "Dikerjakan" && <button onClick={() => setVerifyingId(m.id)} className="text-[10px] font-bold px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100">Verifikasi</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showInfraForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Infrastruktur</h3>
              <button onClick={() => setShowInfraForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleInfraSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama</label>
                <input required value={infraForm.nama} onChange={e => setInfraForm({ ...infraForm, nama: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis</label>
                  <input value={infraForm.jenis} onChange={e => setInfraForm({ ...infraForm, jenis: e.target.value })} placeholder="cth. Bangunan, Mesin" className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                  <input value={infraForm.lokasi} onChange={e => setInfraForm({ ...infraForm, lokasi: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showReqForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Ajukan Pemeliharaan</h3>
              <button onClick={() => setShowReqForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleReqSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Infrastruktur</label>
                <select required value={reqForm.infrastruktur_id} onChange={e => setReqForm({ ...reqForm, infrastruktur_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih infrastruktur...</option>
                  {infra.map(i => <option key={i.id} value={i.id}>{i.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis</label>
                <select value={reqForm.jenis} onChange={e => setReqForm({ ...reqForm, jenis: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="Reaktif">Reaktif (kerusakan mendadak)</option>
                  <option value="Terjadwal">Terjadwal (preventive)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                <textarea value={reqForm.deskripsi} onChange={e => setReqForm({ ...reqForm, deskripsi: e.target.value })} rows={3} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm resize-none" />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input type="checkbox" checked={!!reqForm.butuh_spare_part} onChange={e => setReqForm({ ...reqForm, butuh_spare_part: e.target.checked ? "on" : "" })} />
                Membutuhkan spare part
              </label>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Mengirim..." : "Ajukan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {verifyingId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Verifikasi Hasil Pekerjaan</h3>
              <button onClick={() => setVerifyingId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Jika hasil pekerjaan belum efektif, permintaan akan dikembalikan ke status Dikerjakan.</p>
            <div className="flex gap-2">
              <button onClick={() => submitVerification("Efektif")} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700">Efektif</button>
              <button onClick={() => submitVerification("Belum Efektif")} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-amber-700">Belum Efektif</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
