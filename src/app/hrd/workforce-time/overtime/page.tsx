"use client";

import { useState, useEffect } from "react";
import { Check, X, Clock3 } from "lucide-react";
import { getLembur, ajukanLembur, reviewLembur, getActiveEmployeesForSelect } from "@/app/actions/workforce-time";
import EmptyState from "@/components/EmptyState";

interface Lembur {
  id: string; karyawan_nama: string; tanggal: string; jam_mulai: string | null; jam_selesai: string | null; alasan: string | null; status: string;
}

const STATUS_STYLE: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Ditolak: "bg-red-50 text-red-700 border-red-200",
};

export default function LemburPage() {
  const [rows, setRows] = useState<Lembur[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [l, e] = await Promise.all([getLembur(), getActiveEmployeesForSelect()]);
    setRows(l as Lembur[]); setEmployees(e); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await ajukanLembur(new FormData(e.currentTarget));
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    showSuccess("Lembur diajukan."); (e.target as HTMLFormElement).reset(); await fetchData();
  };
  const handleReview = async (id: string, approve: boolean) => {
    await reviewLembur(id, approve);
    showSuccess(approve ? "Disetujui." : "Ditolak."); await fetchData();
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div><h1 className="text-2xl font-bold text-[#1A2530] mb-2">Lembur</h1><p className="text-sm text-gray-500">Ajukan & setujui jam lembur karyawan.</p></div>
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <select name="karyawan_id" required className="border border-gray-200 p-3 rounded-xl text-sm bg-white"><option value="">Pilih Karyawan</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
        <input name="tanggal" type="date" required className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="jam_mulai" type="time" placeholder="Jam Mulai" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="jam_selesai" type="time" placeholder="Jam Selesai" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="alasan" placeholder="Alasan" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <button type="submit" disabled={saving} className="md:col-span-5 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl disabled:opacity-50">{saving ? "Menyimpan..." : "Ajukan Lembur"}</button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? <EmptyState icon={Clock3} title="Belum ada pengajuan lembur." /> : (
          <div className="divide-y divide-slate-50">
            {rows.map(r => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div><p className="text-sm font-bold text-slate-800">{r.karyawan_nama}</p><p className="text-[11px] text-slate-400">{r.tanggal} &bull; {r.jam_mulai || "—"}–{r.jam_selesai || "—"} {r.alasan ? `· ${r.alasan}` : ""}</p></div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold border ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  {r.status === "Pending" && (<>
                    <button onClick={() => handleReview(r.id, true)} className="p-2 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600"><Check size={14} /></button>
                    <button onClick={() => handleReview(r.id, false)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><X size={14} /></button>
                  </>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
