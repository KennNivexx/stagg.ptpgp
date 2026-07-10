"use client";

import { useState, useMemo, useEffect } from "react";
import { Truck, IdCard, AlertTriangle, Search, Navigation } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { checkAndNotifyFleetExpiry, type VehicleLiveStatus } from "@/app/actions/vehicles";
import type { EmployeeLicense } from "@/app/actions/licenses";

const LIVE_STATUS_STYLES: Record<string, string> = {
  "Sedang Jalan": "bg-blue-50 text-blue-700",
  Tersedia: "bg-emerald-50 text-emerald-700",
  Servis: "bg-amber-50 text-amber-700",
  Nonaktif: "bg-slate-100 text-slate-500",
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

export default function FleetClient({ vehicles, licenses, department }: { vehicles: VehicleLiveStatus[]; licenses: EmployeeLicense[]; department: string | null }) {
  const [search, setSearch] = useState("");

  // Cek & kirim notifikasi dokumen kendaraan yang segera habis saat dashboard
  // dibuka — lihat komentar checkAndNotifyFleetExpiry di actions/vehicles.ts
  // soal kenapa ini "on-view", bukan proaktif di background.
  useEffect(() => { checkAndNotifyFleetExpiry(); }, []);

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(v => `${v.plate_number} ${v.brand} ${v.model}`.toLowerCase().includes(q));
  }, [vehicles, search]);

  const filteredLicenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return licenses;
    return licenses.filter(l => `${l.employee_name} ${l.license_type}`.toLowerCase().includes(q));
  }, [licenses, search]);

  const expiringVehicleDocs = vehicles.filter(v =>
    [v.stnk_expiry, v.kir_expiry, v.insurance_expiry].some(d => { const i = expiryInfo(d); return i && i.daysLeft <= 30; })
  ).length;
  const expiringLicenses = licenses.filter(l => { const i = expiryInfo(l.expiry_date); return i && i.daysLeft <= 30; }).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Armada & SIM Tim</h1>
        <p className="text-sm text-gray-500">Kendaraan yang ditugaskan ke tim {department || "Anda"} dan masa berlaku SIM/sertifikasi mereka.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Truck size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Kendaraan Tim</p><p className="text-xl font-extrabold text-slate-800">{vehicles.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Dokumen Kendaraan Segera Habis</p><p className="text-xl font-extrabold text-slate-800">{expiringVehicleDocs}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><IdCard size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">SIM/Sertifikasi Segera Habis</p><p className="text-xl font-extrabold text-slate-800">{expiringLicenses}</p></div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari plat kendaraan atau nama karyawan..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
      </div>

      <div>
        <h3 className="font-extrabold text-slate-800 text-sm mb-3">Kendaraan Tim</h3>
        {filteredVehicles.length === 0 ? (
          <EmptyState icon={Truck} title="Belum ada kendaraan yang ditugaskan ke tim Anda." description="Hubungi HRD untuk menugaskan kendaraan ke anggota tim." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVehicles.map(v => {
              const docs = [
                { label: "STNK", info: expiryInfo(v.stnk_expiry) },
                { label: "KIR", info: expiryInfo(v.kir_expiry) },
                { label: "Asuransi", info: expiryInfo(v.insurance_expiry) },
              ];
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <p className="font-extrabold text-slate-800 text-sm">{v.plate_number}</p>
                  <p className="text-xs text-slate-500 mb-2">{v.brand} {v.model} {v.year ? `(${v.year})` : ""}</p>
                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold mb-2 flex items-center gap-1 w-fit ${LIVE_STATUS_STYLES[v.live_status] || "bg-slate-100 text-slate-500"}`}>
                    {v.live_status === "Sedang Jalan" && <Navigation size={10} />} {v.live_status}
                  </span>
                  {v.driver_name && <p className="text-[11px] text-slate-500 mb-1">Supir: <span className="font-semibold text-slate-700">{v.driver_name}</span></p>}
                  {v.live_status === "Sedang Jalan" && v.current_trip_destination && (
                    <p className="text-[11px] text-blue-600 mb-2">Menuju {v.current_trip_destination}{v.current_trip_since ? ` sejak ${new Date(v.current_trip_since).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {docs.filter(d => d.info).map(d => (
                      <span key={d.label} className={`px-2 py-0.5 rounded text-[9px] font-bold border ${d.info!.className}`}>{d.label}: {d.info!.label}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-extrabold text-slate-800 text-sm mb-3">SIM & Sertifikasi Tim</h3>
        {filteredLicenses.length === 0 ? (
          <EmptyState icon={IdCard} title="Belum ada data SIM/Sertifikasi tim Anda." description="Hubungi HRD untuk melengkapi data ini." />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Karyawan</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Jenis</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Expiry</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLicenses.map(l => {
                    const info = expiryInfo(l.expiry_date);
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/30">
                        <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{l.employee_name}</td>
                        <td className="py-2.5 px-4 text-xs text-slate-600">{l.license_type}</td>
                        <td className="py-2.5 px-4">
                          {info && <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${info.className}`}>{info.label}</span>}
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
    </div>
  );
}
