"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { getKalenderKerja, saveHariLibur, deleteHariLibur } from "@/app/actions/workforce-time";
import EmptyState from "@/components/EmptyState";

export default function KalenderKerjaClient() {
  const [rows, setRows] = useState<{ id: string; tanggal: string; nama_libur: string; jenis: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [tanggal, setTanggal] = useState("");
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState("Nasional");

  const fetchData = async () => { setRows(await getKalenderKerja() as typeof rows); setLoading(false); };
  useEffect(() => { fetchData(); }, []);
  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSaving(true);
    const fd = new FormData();
    fd.append("tanggal", tanggal); fd.append("nama_libur", nama); fd.append("jenis", jenis);
    const res = await saveHariLibur(fd);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setTanggal(""); setNama(""); setJenis("Nasional");
    showSuccess("Hari libur ditambahkan."); await fetchData();
  };
  const handleDelete = async (id: string) => {
    await deleteHariLibur(id);
    showSuccess("Dihapus."); await fetchData();
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div><h1 className="text-2xl font-bold text-[#1A2530] mb-2">Kalender Kerja</h1><p className="text-sm text-gray-500">Hari libur nasional, perusahaan, dan cuti bersama.</p></div>
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input required type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input required value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama Hari Libur" className="border border-gray-200 p-3 rounded-xl text-sm md:col-span-2" />
        <select value={jenis} onChange={e => setJenis(e.target.value)} className="border border-gray-200 p-3 rounded-xl text-sm bg-white">
          <option value="Nasional">Nasional</option>
          <option value="Perusahaan">Perusahaan</option>
          <option value="Cuti Bersama">Cuti Bersama</option>
        </select>
        <button type="submit" disabled={saving} className="md:col-span-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"><Plus size={14} /> Tambah</button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? <EmptyState icon={CalendarDays} title="Belum ada hari libur." /> : (
          <div className="divide-y divide-slate-50">
            {rows.map(r => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between">
                <div><p className="text-sm font-bold text-slate-800">{r.nama_libur}</p><p className="text-[11px] text-slate-400">{r.tanggal} &bull; {r.jenis}</p></div>
                <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
