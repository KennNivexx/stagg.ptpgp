"use client";

import { useMemo, useState } from "react";
import { Package, Plus, X, Save, Search, ArrowLeftRight, CalendarClock } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  createPeralatan, recordFPB, returnFPB, extendLoan,
  type Peralatan, type FormPengeluaranBarang,
} from "@/app/actions/ga-peralatan";

const FIFO_DOT: Record<string, string> = { Hijau: "bg-emerald-500", Kuning: "bg-amber-500", Merah: "bg-red-500" };
const STATUS_STYLE: Record<string, string> = {
  Dipinjam: "bg-blue-50 text-blue-700 border-blue-200",
  Dikembalikan: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Rusak/Hilang": "bg-red-50 text-red-700 border-red-200",
};

const emptyPeralatanForm = { nama_peralatan: "", jenis: "", kendaraan_atau_lokasi: "", jumlah_stok: "0", satuan: "unit", fifo_color: "" };
const emptyFpbForm = { peralatan_id: "", jenis: "Peminjaman", jumlah: "1", peminjam: "", tanggal_kembali_rencana: "" };

export default function PeralatanClient({ initialPeralatan, initialFpbLog }: { initialPeralatan: Peralatan[]; initialFpbLog: FormPengeluaranBarang[] }) {
  const [tab, setTab] = useState<"stock" | "fpb">("stock");
  const [peralatan, setPeralatan] = useState<Peralatan[]>(initialPeralatan);
  const [fpbLog, setFpbLog] = useState<FormPengeluaranBarang[]>(initialFpbLog);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFpbForm, setShowFpbForm] = useState(false);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [extendDate, setExtendDate] = useState("");
  const [beritaAcara, setBeritaAcara] = useState("");
  const [form, setForm] = useState(emptyPeralatanForm);
  const [fpbForm, setFpbForm] = useState(emptyFpbForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return peralatan;
    return peralatan.filter(p => `${p.nama_peralatan} ${p.jenis || ""} ${p.kendaraan_atau_lokasi || ""}`.toLowerCase().includes(q));
  }, [peralatan, search]);

  const flash = (type: "success" | "error", text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    const result = await createPeralatan(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowAddForm(false);
    flash("success", "Peralatan berhasil ditambahkan.");
    window.location.reload();
  };

  const handleFpbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(fpbForm).forEach(([k, v]) => fd.append(k, v));
    const result = await recordFPB(fd);
    setSaving(false);
    if ("error" in result) { flash("error", result.error); return; }
    setShowFpbForm(false);
    setFpbForm(emptyFpbForm);
    flash("success", "Transaksi berhasil dicatat.");
    window.location.reload();
  };

  const openReturn = (id: string) => { setReturningId(id); setBeritaAcara(""); };

  const handleReturn = async (kondisi: "Dikembalikan" | "Rusak/Hilang") => {
    if (!returningId) return;
    const result = await returnFPB(returningId, kondisi, beritaAcara);
    if ("error" in result) { flash("error", result.error); return; }
    flash("success", "Pengembalian berhasil dicatat.");
    setReturningId(null);
    window.location.reload();
  };

  const openExtend = (id: string, current: string | null) => { setExtendingId(id); setExtendDate(current || ""); };

  const handleExtend = async () => {
    if (!extendingId || !extendDate) return;
    const result = await extendLoan(extendingId, extendDate);
    if ("error" in result) { flash("error", result.error); return; }
    setFpbLog(prev => prev.map(f => f.id === extendingId ? { ...f, tanggal_kembali_rencana: extendDate } : f));
    setExtendingId(null);
    flash("success", "Waktu pinjam diperpanjang.");
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Pengendalian Peralatan</h1>
          <p className="text-sm text-gray-500 mt-1">Stok peralatan kendaraan/lokasi dan Form Pengeluaran Barang (PR-PRL-01).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowFpbForm(true)} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
            <ArrowLeftRight size={14} /> Pinjam/Keluarkan
          </button>
          <button onClick={() => { setForm(emptyPeralatanForm); setShowAddForm(true); }} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
            <Plus size={14} /> Tambah Peralatan
          </button>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
      )}

      <div className="flex items-center gap-1 border-b border-slate-200 mb-6">
        <button onClick={() => setTab("stock")} className={`px-4 py-2.5 text-xs font-bold border-b-2 ${tab === "stock" ? "border-[#CC0000] text-[#CC0000]" : "border-transparent text-slate-500"}`}>Stok Peralatan</button>
        <button onClick={() => setTab("fpb")} className={`px-4 py-2.5 text-xs font-bold border-b-2 ${tab === "fpb" ? "border-[#CC0000] text-[#CC0000]" : "border-transparent text-slate-500"}`}>Log FPB</button>
      </div>

      {tab === "stock" ? (
        <>
          <div className="relative mb-4">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama peralatan, jenis, atau lokasi..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="Belum ada peralatan." description="Tambahkan peralatan pertama untuk mulai mengelola stok." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-700"><Package size={22} /></div>
                    {p.fifo_color && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                        <span className={`h-2.5 w-2.5 rounded-full ${FIFO_DOT[p.fifo_color]}`} /> {p.fifo_color}
                      </span>
                    )}
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">{p.nama_peralatan}</h3>
                  <p className="text-xs text-slate-500 mb-3">{p.jenis || "-"} {p.kendaraan_atau_lokasi ? `• ${p.kendaraan_atau_lokasi}` : ""}</p>
                  <div className="pt-3 border-t border-slate-50 text-xs text-slate-600 font-bold">
                    Stok: {p.jumlah_stok} {p.satuan}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        fpbLog.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title="Belum ada transaksi peminjaman/pengeluaran." />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left font-bold px-4 py-3">Peralatan</th>
                  <th className="text-left font-bold px-4 py-3">Jenis</th>
                  <th className="text-left font-bold px-4 py-3">Jumlah</th>
                  <th className="text-left font-bold px-4 py-3">Peminjam</th>
                  <th className="text-left font-bold px-4 py-3">Rencana Kembali</th>
                  <th className="text-left font-bold px-4 py-3">Status</th>
                  <th className="text-right font-bold px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fpbLog.map(f => {
                  const item = peralatan.find(p => p.id === f.peralatan_id);
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-700">{item?.nama_peralatan || f.peralatan_id}</td>
                      <td className="px-4 py-3 text-slate-600">{f.jenis}</td>
                      <td className="px-4 py-3 text-slate-600">{f.jumlah}</td>
                      <td className="px-4 py-3 text-slate-600">{f.peminjam || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{f.tanggal_kembali_rencana || "-"}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_STYLE[f.status]}`}>{f.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        {f.status === "Dipinjam" && (
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => openExtend(f.id, f.tanggal_kembali_rencana)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600" title="Perpanjang"><CalendarClock size={14} /></button>
                            <button onClick={() => openReturn(f.id)} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Kembalikan</button>
                          </div>
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

      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Peralatan</h3>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Peralatan</label>
                <input required value={form.nama_peralatan} onChange={e => setForm({ ...form, nama_peralatan: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis</label>
                  <input value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })} placeholder="cth. Kayu, Tools" className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kendaraan/Lokasi</label>
                  <input value={form.kendaraan_atau_lokasi} onChange={e => setForm({ ...form, kendaraan_atau_lokasi: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Stok</label>
                  <input type="number" min={0} value={form.jumlah_stok} onChange={e => setForm({ ...form, jumlah_stok: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
                  <input value={form.satuan} onChange={e => setForm({ ...form, satuan: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warna FIFO (khusus Kayu/Fumigasi)</label>
                <select value={form.fifo_color} onChange={e => setForm({ ...form, fifo_color: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Tidak berlaku</option>
                  <option value="Hijau">Hijau</option>
                  <option value="Kuning">Kuning</option>
                  <option value="Merah">Merah</option>
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showFpbForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Peminjaman / Pengeluaran Barang</h3>
              <button onClick={() => setShowFpbForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleFpbSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peralatan</label>
                <select required value={fpbForm.peralatan_id} onChange={e => setFpbForm({ ...fpbForm, peralatan_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih peralatan...</option>
                  {peralatan.map(p => <option key={p.id} value={p.id}>{p.nama_peralatan} (stok: {p.jumlah_stok})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis</label>
                  <select value={fpbForm.jenis} onChange={e => setFpbForm({ ...fpbForm, jenis: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    <option value="Peminjaman">Peminjaman</option>
                    <option value="Pengeluaran">Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah</label>
                  <input type="number" min={1} value={fpbForm.jumlah} onChange={e => setFpbForm({ ...fpbForm, jumlah: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Peminjam</label>
                <input value={fpbForm.peminjam} onChange={e => setFpbForm({ ...fpbForm, peminjam: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Tanggal Kembali</label>
                <input type="date" value={fpbForm.tanggal_kembali_rencana} onChange={e => setFpbForm({ ...fpbForm, tanggal_kembali_rencana: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {returningId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Konfirmasi Pengembalian</h3>
              <button onClick={() => setReturningId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Berita Acara (wajib jika rusak/hilang)</label>
              <textarea value={beritaAcara} onChange={e => setBeritaAcara(e.target.value)} rows={3} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm resize-none" />
              <div className="flex gap-2">
                <button onClick={() => handleReturn("Dikembalikan")} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700">Kondisi Baik</button>
                <button onClick={() => handleReturn("Rusak/Hilang")} className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-red-700">Rusak/Hilang</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {extendingId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Perpanjang Waktu Pinjam</h3>
              <button onClick={() => setExtendingId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kembali Baru</label>
              <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              <button onClick={handleExtend} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#aa0000]">Simpan Perpanjangan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
