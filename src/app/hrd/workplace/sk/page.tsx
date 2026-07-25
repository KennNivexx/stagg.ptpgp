"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, CheckCircle2, Archive, Send, X, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { getStrukturVersions, createStrukturVersion, submitForReview, approveStruktur, archiveStruktur, type StrukturVersi } from "@/app/actions/org-sk";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLE: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600 border-slate-200",
  Review: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Archived: "bg-slate-50 text-slate-400 border-slate-200",
};

function VersionCard({ v, actions, highlight }: { v: StrukturVersi; actions?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between ${highlight ? "bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl" : ""}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-extrabold text-slate-800 text-sm">{v.nama}</h3>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${STATUS_STYLE[v.status]}`}>{v.status}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200">{v.versi}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">SK: {v.nomor_sk} &bull; Tanggal SK: {v.tanggal_sk} &bull; Berlaku: {v.tanggal_berlaku}</p>
        {v.keterangan && <p className="text-xs text-slate-500 mt-1">{v.keterangan}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/**
 * Struktur Organisasi (SK): versi struktur organisasi yang disahkan lewat SK
 * Direksi — hanya satu versi yang bisa "Approved" (live) di satu waktu.
 */
export default function StrukturSkPage() {
  const [versions, setVersions] = useState<StrukturVersi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [nama, setNama] = useState("");
  const [nomorSk, setNomorSk] = useState("");
  const [tanggalSk, setTanggalSk] = useState("");
  const [tanggalBerlaku, setTanggalBerlaku] = useState("");
  const [versi, setVersi] = useState("V1.0");
  const [keterangan, setKeterangan] = useState("");

  const fetchData = async () => {
    const data = await getStrukturVersions();
    setVersions(data);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const fd = new FormData();
    fd.append("nama", nama); fd.append("nomor_sk", nomorSk); fd.append("tanggal_sk", tanggalSk);
    fd.append("tanggal_berlaku", tanggalBerlaku); fd.append("versi", versi); fd.append("keterangan", keterangan);
    const res = await createStrukturVersion(fd);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setNama(""); setNomorSk(""); setTanggalSk(""); setTanggalBerlaku(""); setVersi("V1.0"); setKeterangan("");
    setShowForm(false);
    showSuccess("Versi struktur baru berhasil dibuat.");
    await fetchData();
  };

  const doAction = async (fn: (id: string) => Promise<{ error?: string; success?: boolean }>, id: string, okMsg: string) => {
    setError("");
    try {
      const res = await fn(id);
      if (res.error) { setError(res.error); return; }
      showSuccess(okMsg);
      await fetchData();
    } catch {
      setError("Aksi ini memerlukan izin Direktur/Superadmin.");
    }
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  const activeVersion = versions.find(v => v.status === "Approved") || null;
  const pendingVersions = versions.filter(v => v.status === "Draft" || v.status === "Review");
  const archivedVersions = versions.filter(v => v.status === "Archived");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Struktur Organisasi (SK)</h1>
          <p className="text-sm text-gray-500">Setiap perubahan struktur organisasi harus disahkan lewat SK Direksi. Hanya satu versi yang bisa berstatus Approved (berlaku) dalam satu waktu.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl transition-colors">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Batal" : "Versi Baru"}
        </button>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Struktur Organisasi *</label>
              <input required value={nama} onChange={e => setNama(e.target.value)} placeholder="Contoh: Struktur Organisasi PT PGP Tahun 2026"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor SK Direksi *</label>
              <input required value={nomorSk} onChange={e => setNomorSk(e.target.value)} placeholder="SK-001/DIR/VII/2026"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal SK *</label>
              <input required type="date" value={tanggalSk} onChange={e => setTanggalSk(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal Berlaku *</label>
              <input required type="date" value={tanggalBerlaku} onChange={e => setTanggalBerlaku(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Versi</label>
              <input value={versi} onChange={e => setVersi(e.target.value)} placeholder="V1.0"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Keterangan</label>
              <input value={keterangan} onChange={e => setKeterangan(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Struktur"}
            </button>
          </div>
        </form>
      )}

      {versions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <EmptyState icon={FileText} title="Belum ada versi struktur organisasi." description="Buat versi pertama dengan SK Direksi untuk mulai." />
        </div>
      ) : (
        <>
          {/* Versi Aktif — satu-satunya versi Approved, ditonjolkan terpisah dari
              draft/riwayat supaya tidak ada kebingungan "yang mana yang berlaku". */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ShieldCheck size={12} /> Versi Aktif Saat Ini (Berlaku)</p>
            {activeVersion ? (
              <VersionCard v={activeVersion} highlight
                actions={<button onClick={() => doAction(archiveStruktur, activeVersion.id, "Versi struktur diarsipkan.")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors">
                  <Archive size={13} /> Arsipkan
                </button>} />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-700 font-semibold">
                Belum ada versi struktur organisasi yang disahkan (Approved). Struktur organisasi yang tampil ke seluruh sistem masih memakai data lama sampai salah satu versi di bawah ini disetujui Direktur.
              </div>
            )}
          </div>

          {pendingVersions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Draft & Sedang Diajukan ({pendingVersions.length})</p>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
                {pendingVersions.map(v => (
                  <VersionCard key={v.id} v={v} actions={<>
                    {v.status === "Draft" && (
                      <button onClick={() => doAction(submitForReview, v.id, "Diajukan untuk review.")}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold transition-colors">
                        <Send size={13} /> Ajukan Review
                      </button>
                    )}
                    <button onClick={() => doAction(approveStruktur, v.id, "Versi struktur disetujui & berlaku. Versi aktif sebelumnya otomatis diarsipkan.")}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition-colors">
                      <CheckCircle2 size={13} /> Approve — Jadikan Aktif
                    </button>
                  </>} />
                ))}
              </div>
            </div>
          )}

          {archivedVersions.length > 0 && (
            <div>
              <button onClick={() => setShowArchived(s => !s)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-2 hover:text-slate-600">
                {showArchived ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Riwayat Versi Lama ({archivedVersions.length})
              </button>
              {showArchived && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden opacity-70">
                  {archivedVersions.map(v => <VersionCard key={v.id} v={v} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
