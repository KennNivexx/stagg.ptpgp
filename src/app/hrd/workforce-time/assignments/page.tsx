"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, Briefcase } from "lucide-react";
import { getPenugasanKerja, savePenugasan, selesaikanPenugasan, deletePenugasan, getActiveEmployeesForSelect } from "@/app/actions/workforce-time";
import { getOrgStructure } from "@/app/actions/org";
import type { OrgUnit } from "@/types/org";
import EmptyState from "@/components/EmptyState";

function flattenUnits(tree: OrgUnit[]): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  const walk = (n: OrgUnit) => { if (!n.isEmployee) { out.push({ id: n.id, name: n.name }); n.children.forEach(walk); } };
  tree.forEach(walk);
  return out;
}

interface Penugasan {
  id: string; karyawan_nama: string; unit_nama: string | null; nama_project: string | null;
  nama_klien: string | null; supervisor_nama: string | null; tanggal_mulai: string | null;
  tanggal_selesai: string | null; status: string;
}

export default function PenugasanKerjaPage() {
  const [rows, setRows] = useState<Penugasan[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    const [p, e, tree] = await Promise.all([getPenugasanKerja(), getActiveEmployeesForSelect(), getOrgStructure()]);
    setRows(p as Penugasan[]); setEmployees(e); setUnits(flattenUnits(tree));
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await savePenugasan(fd);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setShowForm(false); showSuccess("Penugasan ditambahkan."); await fetchData();
    (e.target as HTMLFormElement).reset();
  };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold text-[#1A2530] mb-2">Penugasan Kerja</h1><p className="text-sm text-gray-500">Penempatan karyawan ke site/project — referensi unit dari Desain Organisasi, bukan diketik ulang.</p></div>
        <button onClick={() => setShowForm(v => !v)} className="px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl">{showForm ? "Batal" : "+ Tambah Penugasan"}</button>
      </div>
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select name="karyawan_id" required className="border border-gray-200 p-3 rounded-xl text-sm bg-white"><option value="">Pilih Karyawan</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
          <select name="unit_organisasi_id" className="border border-gray-200 p-3 rounded-xl text-sm bg-white"><option value="">Site/Unit (opsional)</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <select name="supervisor_karyawan_id" className="border border-gray-200 p-3 rounded-xl text-sm bg-white"><option value="">Supervisor (opsional)</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
          <input name="nama_project" placeholder="Nama Project" className="border border-gray-200 p-3 rounded-xl text-sm" />
          <input name="nama_klien" placeholder="Nama Klien" className="border border-gray-200 p-3 rounded-xl text-sm" />
          <div />
          <input name="tanggal_mulai" type="date" className="border border-gray-200 p-3 rounded-xl text-sm" />
          <input name="tanggal_selesai" type="date" className="border border-gray-200 p-3 rounded-xl text-sm" />
          <button type="submit" disabled={saving} className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan"}</button>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? <EmptyState icon={Briefcase} title="Belum ada penugasan." /> : (
          <div className="divide-y divide-slate-50">
            {rows.map(r => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.karyawan_nama} {r.nama_project ? `— ${r.nama_project}` : ""}</p>
                  <p className="text-[11px] text-slate-400">{r.unit_nama || "—"} {r.supervisor_nama ? `· Supervisor: ${r.supervisor_nama}` : ""} {r.nama_klien ? `· Klien: ${r.nama_klien}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold border ${r.status === "Aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}>{r.status}</span>
                  {r.status === "Aktif" && <button onClick={() => selesaikanPenugasan(r.id).then(fetchData)} className="p-2 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600" title="Selesaikan"><CheckCircle2 size={14} /></button>}
                  <button onClick={() => deletePenugasan(r.id).then(fetchData)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
