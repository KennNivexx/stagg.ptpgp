"use client";

import { useState, useMemo } from "react";
import { Truck, Plus, X, Save, Trash2, Pencil, AlertTriangle, Search, User } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { saveVehicle, deleteVehicle, assignVehicleDriver, type Vehicle } from "@/app/actions/vehicles";

type Employee = { id: string; full_name: string; department: string };

const VEHICLE_TYPES = ["Truk", "Tronton", "Box", "Pickup", "Trailer", "Van"];

const emptyForm = {
  id: "", plate_number: "", type: "Truk", brand: "", model: "", year: "",
  status: "Aktif", stnk_expiry: "", kir_expiry: "", insurance_expiry: "", notes: "",
};

function expiryInfo(expiry: string | null): { label: string; className: string; daysLeft: number } | null {
  if (!expiry) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(expiry); target.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: `Terlewat ${Math.abs(daysLeft)}h`, className: "bg-red-50 text-red-700 border-red-200", daysLeft };
  if (daysLeft <= 30) return { label: `Sisa ${daysLeft}h`, className: "bg-amber-50 text-amber-700 border-amber-200", daysLeft };
  return { label: `Sisa ${daysLeft}h`, className: "bg-emerald-50 text-emerald-700 border-emerald-200", daysLeft };
}

export default function VehiclesClient({ initialVehicles, employees }: { initialVehicles: Vehicle[]; employees: Employee[] }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");
  const [reassigning, setReassigning] = useState<string | null>(null);

  const employeeName = (id: string | null) => employees.find(e => e.id === id)?.full_name || null;

  const expiringDocsCount = vehicles.filter(v =>
    [v.stnk_expiry, v.kir_expiry, v.insurance_expiry].some(d => { const info = expiryInfo(d); return info && info.daysLeft <= 30; })
  ).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(v => `${v.plate_number} ${v.brand} ${v.model} ${employeeName(v.assigned_driver_id) || ""}`.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, search]);

  const openAdd = () => { setFormData(emptyForm); setShowForm(true); };
  const openEdit = (v: Vehicle) => {
    setFormData({
      id: v.id, plate_number: v.plate_number, type: v.type, brand: v.brand, model: v.model,
      year: v.year ? String(v.year) : "", status: v.status,
      stnk_expiry: v.stnk_expiry || "", kir_expiry: v.kir_expiry || "", insurance_expiry: v.insurance_expiry || "",
      notes: v.notes,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    const result = await saveVehicle(fd);
    setSaving(false);
    if ("error" in result) { setSaveMsg({ type: "error", text: result.error }); return; }

    const saved: Vehicle = {
      id: formData.id || "veh-" + Date.now(),
      plate_number: formData.plate_number, type: formData.type, brand: formData.brand, model: formData.model,
      year: formData.year ? parseInt(formData.year) : null, status: formData.status,
      stnk_expiry: formData.stnk_expiry || null, kir_expiry: formData.kir_expiry || null, insurance_expiry: formData.insurance_expiry || null,
      assigned_driver_id: formData.id ? (vehicles.find(v => v.id === formData.id)?.assigned_driver_id ?? null) : null,
      notes: formData.notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setVehicles(prev => formData.id ? prev.map(v => v.id === formData.id ? saved : v) : [...prev, saved]);
    setSaveMsg({ type: "success", text: "Kendaraan berhasil disimpan." });
    setShowForm(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kendaraan ini?")) return;
    await deleteVehicle(id);
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const handleReassign = async (vehicleId: string, employeeId: string) => {
    setReassigning(vehicleId);
    const result = await assignVehicleDriver(vehicleId, employeeId || null);
    setReassigning(null);
    if ("error" in result) { setSaveMsg({ type: "error", text: result.error }); return; }
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, assigned_driver_id: employeeId || null } : v));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Armada Kendaraan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data kendaraan, penugasan supir, dan masa berlaku STNK/KIR/asuransi.</p>
        </div>
        <button onClick={openAdd} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
          <Plus size={14} /> Tambah Kendaraan
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
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Truck size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Kendaraan</p><p className="text-xl font-extrabold text-slate-800">{vehicles.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Truck size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Aktif</p><p className="text-xl font-extrabold text-slate-800">{vehicles.filter(v => v.status === "Aktif").length}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Dokumen Segera Expired</p><p className="text-xl font-extrabold text-slate-800">{expiringDocsCount}</p></div>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari plat, merek, atau nama supir..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">{formData.id ? "Edit Kendaraan" : "Tambah Kendaraan Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Plat</label>
                  <input required value={formData.plate_number} onChange={e => setFormData({ ...formData, plate_number: e.target.value })} placeholder="cth. B 1234 XYZ" className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Merek</label>
                  <input value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model</label>
                  <input value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tahun</label>
                  <input type="number" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="Aktif">Aktif</option>
                  <option value="Servis">Servis</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-bold text-slate-700 mb-2">Masa Berlaku Dokumen</p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">STNK</label>
                    <input type="date" value={formData.stnk_expiry} onChange={e => setFormData({ ...formData, stnk_expiry: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">KIR</label>
                    <input type="date" value={formData.kir_expiry} onChange={e => setFormData({ ...formData, kir_expiry: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Asuransi</label>
                    <input type="date" value={formData.insurance_expiry} onChange={e => setFormData({ ...formData, insurance_expiry: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                  </div>
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
        <EmptyState icon={Truck} title="Belum ada kendaraan." description="Tambahkan kendaraan pertama untuk mulai mengelola armada." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(v => {
            const docs = [
              { label: "STNK", info: expiryInfo(v.stnk_expiry) },
              { label: "KIR", info: expiryInfo(v.kir_expiry) },
              { label: "Asuransi", info: expiryInfo(v.insurance_expiry) },
            ];
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-700"><Truck size={22} /></div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(v)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mb-0.5">{v.plate_number}</h3>
                <p className="text-xs text-slate-500 mb-3">{v.brand} {v.model} {v.year ? `(${v.year})` : ""}</p>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700">{v.type}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${v.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : v.status === "Servis" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{v.status}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {docs.filter(d => d.info).map(d => (
                    <span key={d.label} className={`px-2 py-0.5 rounded text-[9px] font-bold border ${d.info!.className}`}>{d.label}: {d.info!.label}</span>
                  ))}
                </div>
                <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                  <User size={12} className="text-slate-400 shrink-0" />
                  <select
                    value={v.assigned_driver_id || ""}
                    disabled={reassigning === v.id}
                    onChange={(e) => handleReassign(v.id, e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none disabled:opacity-50"
                  >
                    <option value="">Belum ada supir</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
