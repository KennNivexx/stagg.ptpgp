"use client";

import { useState, useEffect } from "react";
import { Truck, X, Wallet } from "lucide-react";
import { getPengiriman, savePengiriman, voidPengiriman } from "@/app/actions/pengiriman";
import EmptyState from "@/components/EmptyState";

interface Pengiriman {
  id: string; klien: string; tujuan: string; tanggal: string; nilai_omset: number;
  deskripsi: string | null; status: string; dicatat_oleh_nama: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  Selesai: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Dibatalkan: "bg-red-50 text-red-700 border-red-200",
};

export default function PengirimanClient() {
  const [rows, setRows] = useState<Pengiriman[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const data = await getPengiriman();
    setRows(data as unknown as Pengiriman[]);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await savePengiriman(new FormData(e.currentTarget));
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    showSuccess("Pengiriman & omset dicatat."); (e.target as HTMLFormElement).reset(); await fetchData();
  };

  const handleVoid = async (id: string) => {
    if (!window.confirm("Batalkan pencatatan pengiriman ini? Nilainya tidak akan dihitung di laporan Laba/Rugi.")) return;
    await voidPengiriman(id);
    showSuccess("Dibatalkan."); await fetchData();
  };

  const totalOmset = rows.filter((r) => r.status === "Selesai").reduce((s, r) => s + (Number(r.nilai_omset) || 0), 0);

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengiriman & Omset</h1>
        <p className="text-sm text-gray-500">Catat setiap pengiriman/proyek yang selesai beserta nilai tagihannya — otomatis masuk ke Laporan Laba/Rugi.</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm w-fit">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><Wallet size={18} /></div>
          <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Omset Tercatat</p><p className="text-xl font-extrabold text-slate-800">Rp {totalOmset.toLocaleString("id-ID")}</p></div>
        </div>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <input name="klien" placeholder="Nama Klien" required className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="tujuan" placeholder="Tujuan/Rute" required className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="tanggal" type="date" required className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="nilai_omset" type="number" min="0" step="1000" placeholder="Nilai Tagihan (Rp)" required className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="deskripsi" placeholder="Deskripsi (opsional)" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <button type="submit" disabled={saving} className="md:col-span-5 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl disabled:opacity-50">{saving ? "Menyimpan..." : "Catat Pengiriman"}</button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Pengiriman</h3>
        </div>
        {rows.length === 0 ? <EmptyState icon={Truck} title="Belum ada pengiriman tercatat." /> : (
          <div className="divide-y divide-slate-50">
            {rows.map((r) => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.klien} — {r.tujuan}</p>
                  <p className="text-[11px] text-slate-400">{r.tanggal} &bull; Rp {Number(r.nilai_omset).toLocaleString("id-ID")}{r.deskripsi ? ` · ${r.deskripsi}` : ""}{r.dicatat_oleh_nama ? ` · dicatat oleh ${r.dicatat_oleh_nama}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold border ${STATUS_STYLE[r.status] || "bg-slate-50 text-slate-500 border-slate-200"}`}>{r.status}</span>
                  {r.status === "Selesai" && (
                    <button onClick={() => handleVoid(r.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600" title="Batalkan">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
