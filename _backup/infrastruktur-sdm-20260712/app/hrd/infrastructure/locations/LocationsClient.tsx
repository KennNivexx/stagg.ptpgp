"use client";

import { useState, useMemo } from "react";
import { MapPin, Building2, Warehouse, Store, Users, Plus, X, Save, Pencil, Trash2, ChevronDown, ChevronUp, Search, Crosshair, ShieldCheck } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { saveLocation, deleteLocation, assignEmployeeLocation } from "@/app/actions/infrastructure";

type Location = {
  id: string; name: string; address: string; type: string; status: string;
  latitude?: number | null; longitude?: number | null; radius_meters?: number;
};
type Employee = { id: string; full_name: string; department: string; position: string; location_id: string | null };

const emptyForm = { name: "", address: "", type: "Kantor", status: "Aktif", latitude: "", longitude: "", radius_meters: "200" };

const typeIcon = (type: string) => {
  if (type === "Gudang") return Warehouse;
  if (type === "Cabang") return Store;
  return Building2;
};
const typeColor = (type: string) => {
  if (type === "Gudang") return "bg-amber-50 text-amber-700";
  if (type === "Cabang") return "bg-blue-50 text-blue-700";
  return "bg-emerald-50 text-emerald-700";
};

export default function LocationsClient({ initialLocations, employees: initialEmployees }: { initialLocations: Location[]; employees: Employee[] }) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setSaveMsg({ type: "error", text: "GPS tidak didukung di perangkat ini." }); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setFormData((f) => ({ ...f, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }));
      },
      () => { setLocating(false); setSaveMsg({ type: "error", text: "Gagal mengambil lokasi GPS." }); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const employeesByLocation = useMemo(() => {
    const m: Record<string, Employee[]> = {};
    for (const e of employees) {
      if (e.location_id) (m[e.location_id] ||= []).push(e);
    }
    return m;
  }, [employees]);

  const unassignedEmployees = useMemo(() => employees.filter((e) => !e.location_id), [employees]);

  const employeesByDept = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    const filtered = q
      ? employees.filter((e) => [e.full_name, e.department, e.position].some((f) => f?.toLowerCase().includes(q)))
      : employees;
    const m: Record<string, Employee[]> = {};
    for (const e of filtered) { (m[e.department || "Tanpa Departemen"] ||= []).push(e); }
    return m;
  }, [employees, assignSearch]);

  const activeLocations = locations.filter((l) => l.status === "Aktif").length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    const fd = new FormData();
    if (editingId) fd.append("id", editingId);
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    const result = await saveLocation(fd);
    setSaving(false);
    if (result?.error) { setSaveMsg({ type: "error", text: result.error }); return; }
    const savedLoc = {
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      radius_meters: parseInt(formData.radius_meters) || 200,
    };
    if (editingId) {
      setLocations((prev) => prev.map((l) => (l.id === editingId ? { ...l, ...savedLoc } : l)));
    } else {
      setLocations([...locations, { id: "loc-" + Date.now(), ...savedLoc }]);
    }
    setSaveMsg({ type: "success", text: "Lokasi berhasil disimpan." });
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    setFormData({
      name: loc.name, address: loc.address, type: loc.type, status: loc.status,
      latitude: loc.latitude != null ? String(loc.latitude) : "",
      longitude: loc.longitude != null ? String(loc.longitude) : "",
      radius_meters: String(loc.radius_meters ?? 200),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if ((employeesByLocation[id] || []).length > 0) {
      setSaveMsg({ type: "error", text: "Pindahkan karyawan dari lokasi ini sebelum menghapus." });
      setTimeout(() => setSaveMsg(null), 4000);
      return;
    }
    await deleteLocation(id);
    setLocations(locations.filter((l) => l.id !== id));
  };

  const handleReassign = async (employeeId: string, locationId: string) => {
    setReassigning(employeeId);
    const result = await assignEmployeeLocation(employeeId, locationId || null);
    setReassigning(null);
    if (result?.error) { setSaveMsg({ type: "error", text: result.error }); return; }
    setEmployees((prev) => prev.map((e) => (e.id === employeeId ? { ...e, location_id: locationId || null } : e)));
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Lokasi Kerja</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola lokasi kerja dan lihat penempatan karyawan di tiap lokasi.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData(emptyForm); setShowForm(true); }}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Lokasi
        </button>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {saveMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><MapPin size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Lokasi</p>
              <p className="text-xl font-extrabold text-slate-800">{locations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Building2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Lokasi Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{activeLocations}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Karyawan Belum Ditugaskan</p>
              <p className="text-xl font-extrabold text-slate-800">{unassignedEmployees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">{editingId ? "Edit Lokasi" : "Tambah Lokasi Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lokasi</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  placeholder="Contoh: Kantor Pusat"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  rows={2}
                  placeholder="Alamat lengkap lokasi"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  >
                    <option value="Kantor">Kantor</option>
                    <option value="Gudang">Gudang</option>
                    <option value="Cabang">Cabang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><ShieldCheck size={13} className="text-emerald-500" /> Geofence Absensi</label>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Crosshair size={11} /> {locating ? "Mengambil..." : "Gunakan Lokasi Saya"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">Isi titik koordinat agar karyawan hanya bisa absen di dalam radius lokasi ini. Kosongkan untuk menonaktifkan geofence.</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="number" step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="Latitude"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  />
                  <input
                    type="number" step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="Longitude"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Radius (meter)</label>
                  <input
                    type="number" min={10}
                    value={formData.radius_meters}
                    onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Lokasi"}
              </button>
            </form>
          </div>
        </div>
      )}

      {locations.length === 0 ? (
        <EmptyState icon={MapPin} title="Belum ada lokasi kerja" description="Tambahkan lokasi kerja pertama untuk perusahaan." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => {
            const Icon = typeIcon(loc.type);
            const locEmployees = employeesByLocation[loc.id] || [];
            const isExpanded = expandedId === loc.id;
            return (
              <div key={loc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${typeColor(loc.type)}`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(loc)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(loc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mb-1">{loc.name}</h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{loc.address}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${typeColor(loc.type)}`}>{loc.type}</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    loc.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>{loc.status}</span>
                  {loc.latitude != null && loc.longitude != null ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 flex items-center gap-1">
                      <ShieldCheck size={10} /> Geofence {loc.radius_meters ?? 200}m
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-400">Geofence belum diatur</span>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : loc.id)}
                  className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 w-full text-left hover:opacity-70 transition-opacity"
                >
                  <Users size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-500">{locEmployees.length} karyawan</span>
                  <span className="ml-auto text-slate-400">{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
                </button>
                {isExpanded && (
                  <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto">
                    {locEmployees.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-2">Belum ada karyawan di lokasi ini.</p>
                    ) : (
                      locEmployees.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/60">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                            {e.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{e.full_name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{e.department} &middot; {e.position || "-"}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Penempatan karyawan — dikelompokkan per departemen agar lebih mudah dibaca */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Penempatan Karyawan</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Atur lokasi kerja untuk setiap karyawan, dikelompokkan per departemen.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              placeholder="Cari karyawan..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {Object.keys(employeesByDept).length === 0 ? (
            <p className="p-6 text-xs text-slate-400 text-center">Tidak ada karyawan yang cocok.</p>
          ) : (
            Object.keys(employeesByDept).sort().map((dept) => {
              const deptEmployees = employeesByDept[dept];
              const isOpen = expandedDept === dept || assignSearch.trim().length > 0;
              return (
                <div key={dept}>
                  <button
                    onClick={() => setExpandedDept(isOpen && !assignSearch ? null : dept)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50/50 transition-colors text-left"
                  >
                    <span className="text-xs font-bold text-slate-700">{dept}</span>
                    <span className="flex items-center gap-2 text-[10px] text-slate-400">
                      {deptEmployees.length} karyawan
                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {deptEmployees.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                            {e.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold text-slate-800 truncate">{e.full_name}</p>
                            <p className="text-[9px] text-slate-400 truncate">{e.position || "-"}</p>
                          </div>
                          <select
                            value={e.location_id || ""}
                            disabled={reassigning === e.id}
                            onChange={(ev) => handleReassign(e.id, ev.target.value)}
                            className="text-[10px] border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none disabled:opacity-50 shrink-0 max-w-[110px]"
                          >
                            <option value="">Belum ada</option>
                            {locations.map((l) => (
                              <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
