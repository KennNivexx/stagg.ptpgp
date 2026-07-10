"use client";

import { useState, useMemo } from "react";
import { IdCard, Plus, X, Save, Trash2, Pencil, AlertTriangle, Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { saveLicense, deleteLicense, type EmployeeLicense } from "@/app/actions/licenses";

type Employee = { id: string; full_name: string; department: string };

const SIM_TYPES = ["SIM A", "SIM B1", "SIM B2", "SIM B3", "SIM C"];
const CERT_TYPE_PLACEHOLDER = "cth. Sertifikat K3, Defensive Driving";

const emptyForm = {
  id: "", employee_id: "", category: "SIM", license_type: "SIM B2",
  license_number: "", issued_date: "", expiry_date: "", notes: "",
};

function expiryInfo(expiry: string): { label: string; className: string; daysLeft: number } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(expiry); target.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: `Kedaluwarsa ${Math.abs(daysLeft)} hari lalu`, className: "bg-red-50 text-red-700 border-red-200", daysLeft };
  if (daysLeft <= 30) return { label: `Sisa ${daysLeft} hari`, className: "bg-amber-50 text-amber-700 border-amber-200", daysLeft };
  return { label: `Sisa ${daysLeft} hari`, className: "bg-emerald-50 text-emerald-700 border-emerald-200", daysLeft };
}

export default function LicensesClient({ initialLicenses, employees }: { initialLicenses: EmployeeLicense[]; employees: Employee[] }) {
  const [licenses, setLicenses] = useState<EmployeeLicense[]>(initialLicenses);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const expired = licenses.filter(l => expiryInfo(l.expiry_date).daysLeft < 0).length;
  const expiringSoon = licenses.filter(l => { const d = expiryInfo(l.expiry_date).daysLeft; return d >= 0 && d <= 30; }).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return licenses.filter(l => {
      if (categoryFilter && l.category !== categoryFilter) return false;
      if (q && !`${l.employee_name} ${l.license_type} ${l.license_number}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [licenses, search, categoryFilter]);

  const openAdd = () => { setFormData(emptyForm); setShowForm(true); };
  const openEdit = (l: EmployeeLicense) => {
    setFormData({
      id: l.id, employee_id: l.employee_id, category: l.category, license_type: l.license_type,
      license_number: l.license_number, issued_date: l.issued_date || "", expiry_date: l.expiry_date, notes: l.notes,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    const result = await saveLicense(fd);
    setSaving(false);
    if ("error" in result) { setSaveMsg({ type: "error", text: result.error }); return; }

    const emp = employees.find(e => e.id === formData.employee_id);
    const saved: EmployeeLicense = {
      id: formData.id || "lic-" + Date.now(),
      employee_id: formData.employee_id,
      employee_name: emp?.full_name || "",
      category: formData.category, license_type: formData.license_type,
      license_number: formData.license_number, issued_date: formData.issued_date || null,
      expiry_date: formData.expiry_date, document_url: "", notes: formData.notes,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setLicenses(prev => formData.id ? prev.map(l => l.id === formData.id ? saved : l) : [...prev, saved]);
    setSaveMsg({ type: "success", text: "Data berhasil disimpan." });
    setShowForm(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data ini?")) return;
    await deleteLicense(id);
    setLicenses(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">SIM & Sertifikasi</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau masa berlaku SIM dan sertifikasi (K3, Defensive Driving, dll) karyawan.</p>
        </div>
        <button onClick={openAdd} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
          <Plus size={14} /> Tambah Data
        </button>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {saveMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><IdCard size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Data</p><p className="text-xl font-extrabold text-slate-800">{licenses.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Segera Expired (&le;30 hari)</p><p className="text-xl font-extrabold text-slate-800">{expiringSoon}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Sudah Kedaluwarsa</p><p className="text-xl font-extrabold text-slate-800">{expired}</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama karyawan / jenis / nomor..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs">
          <option value="">Semua Kategori</option>
          <option value="SIM">SIM</option>
          <option value="Sertifikasi">Sertifikasi</option>
        </select>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">{formData.id ? "Edit Data" : "Tambah Data Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
                <select required value={formData.employee_id} onChange={e => setFormData({ ...formData, employee_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih karyawan</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.department}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value, license_type: e.target.value === "SIM" ? "SIM B2" : "" })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  >
                    <option value="SIM">SIM</option>
                    <option value="Sertifikasi">Sertifikasi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis</label>
                  {formData.category === "SIM" ? (
                    <select value={formData.license_type} onChange={e => setFormData({ ...formData, license_type: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                      {SIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <input required value={formData.license_type} onChange={e => setFormData({ ...formData, license_type: e.target.value })} placeholder={CERT_TYPE_PLACEHOLDER} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor <span className="font-normal text-slate-400">(opsional)</span></label>
                <input value={formData.license_number} onChange={e => setFormData({ ...formData, license_number: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Terbit</label>
                  <input type="date" value={formData.issued_date} onChange={e => setFormData({ ...formData, issued_date: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Expiry</label>
                  <input required type="date" value={formData.expiry_date} onChange={e => setFormData({ ...formData, expiry_date: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm resize-none" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={IdCard} title="Belum ada data SIM/Sertifikasi." description="Tambahkan data pertama untuk mulai memantau masa berlaku." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Kategori</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Jenis</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Nomor</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Expiry</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase w-24">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(l => {
                  const info = expiryInfo(l.expiry_date);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/30">
                      <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{l.employee_name}</td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">{l.category}</td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">{l.license_type}</td>
                      <td className="py-2.5 px-4 text-xs text-slate-500">{l.license_number || "-"}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${info.className}`}>{info.label}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(l)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                          <button onClick={() => handleDelete(l.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
