"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MapPin, Building2, Warehouse, Store, Users, Plus, X, Save, Pencil } from "lucide-react";

type Location = {
  id: string;
  name: string;
  address: string;
  type: string;
  status: string;
  totalEmployees: number;
};

const INITIAL_LOCATIONS: Location[] = [
  { id: "1", name: "Kantor Pusat", address: "Jl. Sudirman No. 123, Jakarta Pusat", type: "Kantor", status: "Aktif", totalEmployees: 0 },
  { id: "2", name: "Gudang Utama", address: "Jl. Industri Raya No. 45, Bekasi", type: "Gudang", status: "Aktif", totalEmployees: 0 },
  { id: "3", name: "Kantor Cabang Bandung", address: "Jl. Asia Afrika No. 78, Bandung", type: "Cabang", status: "Aktif", totalEmployees: 0 },
  { id: "4", name: "Kantor Cabang Surabaya", address: "Jl. Tunjungan No. 56, Surabaya", type: "Cabang", status: "Aktif", totalEmployees: 0 },
  { id: "5", name: "Gudang Regional", address: "Jl. Raya Semarang No. 90, Semarang", type: "Gudang", status: "Aktif", totalEmployees: 0 },
];

export default function LokasiKerja() {
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", address: "", type: "Kantor", status: "Aktif" });

  useEffect(() => {
    supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .then(({ count }) => {
        setTotalEmployees(count || 0);
        setLocations((prev) => prev.map((l, i) => ({
          ...l,
          totalEmployees: Math.floor((count || 0) / (i === 0 ? 2 : 4)),
        })));
      });
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setLocations((prev) => prev.map((l) => l.id === editingId ? { ...l, ...formData } : l));
      setEditingId(null);
    } else {
      const newLoc: Location = {
        id: Date.now().toString(),
        ...formData,
        totalEmployees: 0,
      };
      setLocations([...locations, newLoc]);
    }
    setShowForm(false);
    setFormData({ name: "", address: "", type: "Kantor", status: "Aktif" });
  };

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    setFormData({ name: loc.name, address: loc.address, type: loc.type, status: loc.status });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setLocations(locations.filter((l) => l.id !== id));
  };

  const activeLocations = locations.filter((l) => l.status === "Aktif").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Lokasi Kerja</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola lokasi kerja: kantor, gudang, dan cabang perusahaan.</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setFormData({ name: "", address: "", type: "Kantor", status: "Aktif" }); setShowForm(true); }}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Lokasi
        </button>
      </div>

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
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEmployees}</p>
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
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> {editingId ? "Simpan Perubahan" : "Simpan Lokasi"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((loc) => {
          const Icon = typeIcon(loc.type);
          return (
            <div key={loc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${typeColor(loc.type)}`}>
                  <Icon size={22} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(loc)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(loc.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm mb-1">{loc.name}</h3>
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{loc.address}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${typeColor(loc.type)}`}>{loc.type}</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                  loc.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>{loc.status}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                <Users size={12} className="text-slate-400" />
                <span className="text-xs text-slate-500">{loc.totalEmployees} karyawan</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
