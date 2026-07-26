"use client";

import { useState, useEffect } from "react";
import { Trash2, ClipboardList } from "lucide-react";
import { getTimesheet, saveTimesheet, deleteTimesheet, getActiveEmployeesForSelect } from "@/app/actions/workforce-time";
import EmptyState from "@/components/EmptyState";
import EmployeeCombobox, { type EmployeeOption } from "@/components/EmployeeCombobox";

interface Timesheet {
  id: string; karyawan_nama: string; tanggal: string; jam_mulai: string | null; jam_selesai: string | null;
  deskripsi_aktivitas: string; project_site: string | null; jam_kerja: number | null; mode_kerja: string;
}

export default function TimesheetPage() {
  const [rows, setRows] = useState<Timesheet[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  const fetchData = async () => {
    const [t, e] = await Promise.all([getTimesheet(), getActiveEmployeesForSelect()]);
    setRows(t as Timesheet[]); setEmployees(e); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await saveTimesheet(new FormData(e.currentTarget));
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    showSuccess("Timesheet disimpan."); (e.target as HTMLFormElement).reset(); setPickerKey((k) => k + 1); await fetchData();
  };
  const handleDelete = async (id: string) => { await deleteTimesheet(id); await fetchData(); };

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div><h1 className="text-2xl font-bold text-[#1A2530] mb-2">Timesheet / Daily Activity</h1><p className="text-sm text-gray-500">Catatan aktivitas harian, jam kerja, mode kerja (Kantor/WFH/Dinas Luar), dan project/site terkait.</p></div>
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <EmployeeCombobox key={pickerKey} name="karyawan_id" employees={employees} required />
        <input name="tanggal" type="date" required className="border border-gray-200 p-3 rounded-xl text-sm" />
        <select name="mode_kerja" className="border border-gray-200 p-3 rounded-xl text-sm bg-white"><option value="Kantor">Kantor</option><option value="WFH">WFH</option><option value="Dinas Luar">Dinas Luar</option></select>
        <input name="jam_mulai" type="time" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="jam_selesai" type="time" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="jam_kerja" type="number" step="0.5" placeholder="Total Jam Kerja" className="border border-gray-200 p-3 rounded-xl text-sm" />
        <input name="project_site" placeholder="Project/Site" className="border border-gray-200 p-3 rounded-xl text-sm md:col-span-3" />
        <textarea name="deskripsi_aktivitas" required rows={2} placeholder="Deskripsi Aktivitas" className="border border-gray-200 p-3 rounded-xl text-sm md:col-span-3 resize-none" />
        <button type="submit" disabled={saving} className="md:col-span-3 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Timesheet"}</button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? <EmptyState icon={ClipboardList} title="Belum ada timesheet." /> : (
          <div className="divide-y divide-slate-50">
            {rows.map(r => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.karyawan_nama} — {r.deskripsi_aktivitas}</p>
                  <p className="text-[11px] text-slate-400">{r.tanggal} &bull; {r.mode_kerja} {r.project_site ? `· ${r.project_site}` : ""} {r.jam_kerja ? `· ${r.jam_kerja} jam` : ""}</p>
                </div>
                <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
