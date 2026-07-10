"use client";

import { useState, useMemo } from "react";
import { Route, Plus, X, Save, Trash2, Pencil, Search, Clock, Wallet } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { saveTrip, deleteTrip, getDriverHoursSummary, generateTripIncentives, type Trip, type DriverHoursSummary } from "@/app/actions/trips";
import { FATIGUE_WARN_HOURS, FATIGUE_CRITICAL_HOURS } from "@/lib/trip-constants";
import type { Vehicle } from "@/app/actions/vehicles";

type Employee = { id: string; full_name: string; department: string };

const emptyForm = {
  id: "", driver_id: "", vehicle_id: "", origin: "", destination: "",
  trip_date: "", start_time: "", end_time: "", distance_km: "", rate_per_km: "2000",
  status: "Berjalan", notes: "",
};

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayISO() { return new Date().toLocaleDateString("en-CA"); }
function daysAgoISO(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString("en-CA"); }

const STATUS_STYLES: Record<string, string> = {
  Berjalan: "bg-blue-50 text-blue-700",
  Selesai: "bg-emerald-50 text-emerald-700",
  Dibatalkan: "bg-slate-100 text-slate-500",
};

export default function TripsClient({ initialTrips, employees, vehicles }: { initialTrips: Trip[]; employees: Employee[]; vehicles: Vehicle[] }) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  const [hoursFrom, setHoursFrom] = useState(daysAgoISO(7));
  const [hoursTo, setHoursTo] = useState(todayISO());
  const [hoursSummary, setHoursSummary] = useState<DriverHoursSummary[] | null>(null);
  const [loadingHours, setLoadingHours] = useState(false);

  const [incMonth, setIncMonth] = useState(new Date().getMonth() + 1);
  const [incYear, setIncYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const showToast = (type: "success" | "error", text: string) => { setToast({ type, text }); setTimeout(() => setToast(null), 4000); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter(t => `${t.driver_name} ${t.destination} ${t.vehicle_plate}`.toLowerCase().includes(q));
  }, [trips, search]);

  const ongoing = trips.filter(t => t.status === "Berjalan").length;

  const openAdd = () => { setFormData({ ...emptyForm, trip_date: todayISO() }); setShowForm(true); };
  const openEdit = (t: Trip) => {
    setFormData({
      id: t.id, driver_id: t.driver_id, vehicle_id: t.vehicle_id || "", origin: t.origin, destination: t.destination,
      trip_date: t.trip_date, start_time: toDatetimeLocal(t.start_time), end_time: toDatetimeLocal(t.end_time),
      distance_km: t.distance_km != null ? String(t.distance_km) : "", rate_per_km: String(t.rate_per_km),
      status: t.status, notes: t.notes,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    const result = await saveTrip(fd);
    setSaving(false);
    if ("error" in result) { showToast("error", result.error); return; }

    const emp = employees.find(e => e.id === formData.driver_id);
    const veh = vehicles.find(v => v.id === formData.vehicle_id);
    const saved: Trip = {
      id: formData.id || "trip-" + Date.now(),
      driver_id: formData.driver_id, driver_name: emp?.full_name || "", department: emp?.department || "",
      vehicle_id: formData.vehicle_id || null, vehicle_plate: veh?.plate_number || "",
      origin: formData.origin, destination: formData.destination, trip_date: formData.trip_date,
      start_time: new Date(formData.start_time).toISOString(),
      end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      distance_km: formData.distance_km ? parseFloat(formData.distance_km) : null,
      rate_per_km: parseFloat(formData.rate_per_km) || 2000,
      status: formData.status,
      incentive_generated: formData.id ? (trips.find(t => t.id === formData.id)?.incentive_generated ?? false) : false,
      notes: formData.notes, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setTrips(prev => formData.id ? prev.map(t => t.id === formData.id ? saved : t) : [saved, ...prev]);
    showToast("success", "Trip berhasil disimpan.");
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data trip ini?")) return;
    await deleteTrip(id);
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  const loadHoursSummary = async () => {
    setLoadingHours(true);
    const result = await getDriverHoursSummary({ from: hoursFrom, to: hoursTo });
    setHoursSummary(result);
    setLoadingHours(false);
  };

  const doGenerateIncentives = async () => {
    setGenerating(true);
    const result = await generateTripIncentives(incMonth, incYear);
    setGenerating(false);
    if ("error" in result) { showToast("error", result.error); return; }
    if (result.generated === 0) { showToast("success", "Tidak ada trip selesai yang belum digenerate pada periode ini."); return; }
    showToast("success", `${result.generated} supir mendapat insentif, total Rp ${result.totalAmount.toLocaleString("id-ID")}. Cek halaman Insentif untuk approval.`);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg border text-sm font-bold ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
          {toast.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Data Trip Supir</h1>
          <p className="text-sm text-gray-500 mt-1">Catat perjalanan supir untuk rekap jam mengemudi dan insentif trip-based.</p>
        </div>
        <button onClick={openAdd} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
          <Plus size={14} /> Tambah Trip
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Route size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Trip</p><p className="text-xl font-extrabold text-slate-800">{trips.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Sedang Berjalan</p><p className="text-xl font-extrabold text-slate-800">{ongoing}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Belum Digenerate Insentif</p><p className="text-xl font-extrabold text-slate-800">{trips.filter(t => t.status === "Selesai" && !t.incentive_generated).length}</p></div>
          </div>
        </div>
      </div>

      {/* Rekap Jam Mengemudi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-2"><Clock size={15} /> Rekap Jam Mengemudi (Fatigue Compliance)</h3>
        <p className="text-[11px] text-slate-400 mb-3">Menandai supir dengan jam mengemudi tertinggi dalam satu hari pada rentang ini. Kuning: &ge;{FATIGUE_WARN_HOURS} jam, Merah: &ge;{FATIGUE_CRITICAL_HOURS} jam.</p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input type="date" value={hoursFrom} onChange={e => setHoursFrom(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
          <span className="text-xs text-slate-400">s/d</span>
          <input type="date" value={hoursTo} onChange={e => setHoursTo(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
          <button onClick={loadHoursSummary} disabled={loadingHours} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold disabled:opacity-50">
            {loadingHours ? "Memuat..." : "Muat Rekap"}
          </button>
        </div>
        {hoursSummary && (
          hoursSummary.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Tidak ada trip selesai pada rentang ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Supir</th>
                  <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Departemen</th>
                  <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Jml Trip</th>
                  <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Total Jam</th>
                  <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">Jam Terpanjang/Hari</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {hoursSummary.map(d => {
                    const level = d.maxDailyHours >= FATIGUE_CRITICAL_HOURS ? "bg-red-50 text-red-700 border-red-200"
                      : d.maxDailyHours >= FATIGUE_WARN_HOURS ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200";
                    return (
                      <tr key={d.driver_id}>
                        <td className="py-2 px-3 text-xs font-bold text-slate-800">{d.driver_name}</td>
                        <td className="py-2 px-3 text-xs text-slate-500">{d.department}</td>
                        <td className="py-2 px-3 text-xs text-center">{d.tripCount}</td>
                        <td className="py-2 px-3 text-xs text-center">{d.totalHours}h</td>
                        <td className="py-2 px-3 text-center"><span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${level}`}>{d.maxDailyHours}h</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Generate Insentif */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-2"><Wallet size={15} /> Generate Insentif Trip</h3>
        <p className="text-[11px] text-slate-400 mb-3">Menjumlahkan jarak &times; rate/km dari trip berstatus &quot;Selesai&quot; yang belum pernah digenerate, lalu masuk ke halaman Insentif (status Pending) untuk di-approve sebelum ikut payroll.</p>
        <div className="flex flex-wrap items-center gap-2">
          <select value={incMonth} onChange={e => setIncMonth(Number(e.target.value))} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{new Date(2000, m - 1).toLocaleDateString("id-ID", { month: "long" })}</option>)}
          </select>
          <input type="number" value={incYear} onChange={e => setIncYear(Number(e.target.value))} className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
          <button onClick={doGenerateIncentives} disabled={generating} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50">
            {generating ? "Menghitung..." : "Generate Insentif"}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari supir, tujuan, atau plat kendaraan..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">{formData.id ? "Edit Trip" : "Tambah Trip Baru"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supir</label>
                  <select required value={formData.driver_id} onChange={e => setFormData({ ...formData, driver_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    <option value="">Pilih supir</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.department}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kendaraan <span className="font-normal text-slate-400">(opsional)</span></label>
                  <select value={formData.vehicle_id} onChange={e => setFormData({ ...formData, vehicle_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    <option value="">Tidak ada</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate_number}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Asal <span className="font-normal text-slate-400">(opsional)</span></label>
                  <input value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan</label>
                  <input required value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Trip</label>
                <input required type="date" value={formData.trip_date} onChange={e => setFormData({ ...formData, trip_date: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai</label>
                  <input required type="datetime-local" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai <span className="font-normal text-slate-400">(opsional)</span></label>
                  <input type="datetime-local" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jarak (km)</label>
                  <input type="number" step="any" value={formData.distance_km} onChange={e => setFormData({ ...formData, distance_km: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rate/km (Rp)</label>
                  <input type="number" value={formData.rate_per_km} onChange={e => setFormData({ ...formData, rate_per_km: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                    <option value="Berjalan">Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
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
        <EmptyState icon={Route} title="Belum ada data trip." description="Tambahkan trip pertama untuk mulai memantau jam mengemudi dan insentif." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Supir</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Kendaraan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tujuan</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tanggal</th>
                <th className="text-right py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Jarak</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase w-24">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/30">
                    <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{t.driver_name}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{t.vehicle_plate || "-"}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-600">{t.origin ? `${t.origin} → ` : ""}{t.destination}</td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{new Date(t.trip_date).toLocaleDateString("id-ID")}</td>
                    <td className="py-2.5 px-4 text-xs text-right text-slate-600">{t.distance_km != null ? `${t.distance_km} km` : "-"}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${STATUS_STYLES[t.status] || "bg-slate-100 text-slate-500"}`}>{t.status}</span>
                      {t.status === "Selesai" && t.incentive_generated && (
                        <span className="block text-[9px] text-emerald-500 mt-0.5">Insentif ✓</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
