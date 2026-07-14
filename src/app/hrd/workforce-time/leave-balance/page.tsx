"use client";

import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import { getSaldoCuti, saveSaldoCuti, getActiveEmployeesForSelect } from "@/app/actions/workforce-time";
import EmptyState from "@/components/EmptyState";

interface Saldo {
  id: string; karyawan_nama: string; tahun: number; jenis_cuti: string; total_hari: number; terpakai: number;
}

export default function SaldoCutiPage() {
  const [rows, setRows] = useState<Saldo[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [s, e] = await Promise.all([getSaldoCuti(), getActiveEmployeesForSelect()]);
    setRows(s as Saldo[]); setEmployees(e); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await saveSaldoCuti(new FormData(e.currentTarget));
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    showSuccess("Saldo cuti disimpan."); (e.target as HTMLFormElement).reset(); await fetchData();
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div><h1 className="text-2xl font-bold text-[#1A2530] mb-2">Saldo Cuti</h1><p className="text-sm text-gray-500">Kelola kuota cuti tahunan per karyawan.</p></div>
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <select name="karyawan_id" required className="border border-gray-200 p-3 rounded-xl text-sm bg-white"><option value="">Pilih Karyawan</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
        <input name="tahun" type="number" required defaultValue={new Date().getFullYear()} className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="jenis_cuti" defaultValue="Tahunan" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="total_hari" type="number" defaultValue={12} placeholder="Total Hari" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="terpakai" type="number" defaultValue={0} placeholder="Terpakai" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <button type="submit" disabled={saving} className="md:col-span-5 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Saldo"}</button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? <EmptyState icon={Wallet} title="Belum ada saldo cuti." /> : (
          <div className="divide-y divide-slate-50">
            {rows.map(r => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div><p className="text-sm font-bold text-slate-800">{r.karyawan_nama}</p><p className="text-[11px] text-slate-400">{r.jenis_cuti} {r.tahun}</p></div>
                <span className="text-xs font-bold text-slate-600">{r.total_hari - r.terpakai} / {r.total_hari} hari tersisa</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
