"use client";

import { useState, useEffect } from "react";
import { Route, Wallet, IdCard, Truck, AlertTriangle } from "lucide-react";
import { getMyTrips, type Trip } from "@/app/actions/trips";
import { getMyLicenses, type EmployeeLicense } from "@/app/actions/licenses";
import { getMyVehicle, type Vehicle } from "@/app/actions/vehicles";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLES: Record<string, string> = {
  Berjalan: "bg-blue-50 text-blue-700",
  Selesai: "bg-emerald-50 text-emerald-700",
  Dibatalkan: "bg-slate-100 text-slate-500",
};

function expiryInfo(expiry: string | null): { label: string; className: string; daysLeft: number } | null {
  if (!expiry) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(expiry); target.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: `Terlewat ${Math.abs(daysLeft)} hari`, className: "bg-red-50 text-red-700 border-red-200", daysLeft };
  if (daysLeft <= 30) return { label: `Sisa ${daysLeft} hari`, className: "bg-amber-50 text-amber-700 border-amber-200", daysLeft };
  return { label: `Sisa ${daysLeft} hari`, className: "bg-emerald-50 text-emerald-700 border-emerald-200", daysLeft };
}

export default function EmployeeTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [licenses, setLicenses] = useState<EmployeeLicense[]>([]);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyTrips(), getMyLicenses(), getMyVehicle()]).then(([t, l, v]) => {
      setTrips(t); setLicenses(l); setVehicle(v); setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-40 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const totalEarned = trips.reduce((s, t) => s + (t.distance_km || 0) * (t.rate_per_km || 0), 0);
  const remindersLicenses = licenses.filter(l => { const i = expiryInfo(l.expiry_date); return i && i.daysLeft <= 30; });
  const vehicleReminders = vehicle ? [
    { label: "STNK", info: expiryInfo(vehicle.stnk_expiry) },
    { label: "KIR", info: expiryInfo(vehicle.kir_expiry) },
    { label: "Asuransi", info: expiryInfo(vehicle.insurance_expiry) },
  ].filter(d => d.info && d.info.daysLeft <= 30) : [];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Trip & Insentif Saya</h1>
        <p className="text-sm text-gray-500">Jadwal trip Anda, riwayat insentif per-trip, dan reminder pribadi.</p>
      </div>

      {(remindersLicenses.length > 0 || vehicleReminders.length > 0) && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <p className="text-xs font-extrabold text-amber-700 mb-2 flex items-center gap-1.5"><AlertTriangle size={14} /> Perlu Perhatian</p>
          <div className="space-y-1.5">
            {remindersLicenses.map(l => (
              <p key={l.id} className="text-xs text-amber-700">
                <IdCard size={11} className="inline mr-1" /> {l.license_type} Anda: <span className={`px-1.5 py-0.5 rounded font-bold ${expiryInfo(l.expiry_date)!.className}`}>{expiryInfo(l.expiry_date)!.label}</span>
              </p>
            ))}
            {vehicleReminders.map(d => (
              <p key={d.label} className="text-xs text-amber-700">
                <Truck size={11} className="inline mr-1" /> {d.label} kendaraan {vehicle?.plate_number}: <span className={`px-1.5 py-0.5 rounded font-bold ${d.info!.className}`}>{d.info!.label}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Trip" value={trips.length} icon={Route} color="bg-blue-50 text-blue-600" />
        <StatCard label="Trip Selesai" value={trips.filter(t => t.status === "Selesai").length} icon={Route} color="bg-emerald-50 text-emerald-600" />
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Insentif Trip</p><p className="text-xl font-extrabold text-slate-800">Rp {Math.round(totalEarned).toLocaleString("id-ID")}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Trip</h3>
        </div>
        {trips.length === 0 ? (
          <EmptyState icon={Route} title="Belum ada trip tercatat." description="Trip Anda akan muncul di sini setelah dicatat oleh HRD." />
        ) : (
          <div className="divide-y divide-slate-50">
            {trips.map(t => (
              <div key={t.id} className="p-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-bold text-slate-800">{t.origin ? `${t.origin} → ` : ""}{t.destination}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${STATUS_STYLES[t.status] || "bg-slate-100 text-slate-500"}`}>{t.status}</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(t.trip_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    {t.vehicle_plate && ` · Kendaraan ${t.vehicle_plate}`}
                    {t.distance_km != null && ` · ${t.distance_km} km`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-600">Rp {Math.round((t.distance_km || 0) * (t.rate_per_km || 0)).toLocaleString("id-ID")}</p>
                  {t.status === "Selesai" && (
                    <p className="text-[9px] text-slate-400">{t.incentive_generated ? "Sudah masuk payroll" : "Menunggu proses payroll"}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}><Icon size={18} /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
          <p className="text-xl font-extrabold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
