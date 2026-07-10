"use client";

import { useState, useEffect, useMemo } from "react";
import { Route, Clock, Wallet, Search } from "lucide-react";
import { getTripsForDept, type Trip } from "@/app/actions/trips";
import EmptyState from "@/components/EmptyState";

function daysAgoISO(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString("en-CA"); }
function todayISO() { return new Date().toLocaleDateString("en-CA"); }

function tripHours(t: Trip): number {
  if (!t.end_time) return 0;
  return (new Date(t.end_time).getTime() - new Date(t.start_time).getTime()) / (1000 * 60 * 60);
}
function tripCost(t: Trip): number {
  return (t.distance_km || 0) * (t.rate_per_km || 0);
}

export default function DeptTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [department, setDepartment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(daysAgoISO(30));
  const [to, setTo] = useState(todayISO());
  const [search, setSearch] = useState("");

  const fetchTrips = () => getTripsForDept({ from, to }).then(({ trips: t, department: d }) => { setTrips(t); setDepartment(d); setLoading(false); });

  const load = () => { setLoading(true); fetchTrips(); };

  useEffect(() => { fetchTrips(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter(t => `${t.driver_name} ${t.destination} ${t.vehicle_plate}`.toLowerCase().includes(q));
  }, [trips, search]);

  const perDriver = useMemo(() => {
    const m: Record<string, { name: string; hours: number; km: number; cost: number; tripCount: number }> = {};
    for (const t of filtered) {
      const entry = (m[t.driver_id] ||= { name: t.driver_name, hours: 0, km: 0, cost: 0, tripCount: 0 });
      entry.hours += tripHours(t);
      entry.km += t.distance_km || 0;
      entry.cost += tripCost(t);
      entry.tripCount += 1;
    }
    return Object.values(m).sort((a, b) => b.cost - a.cost);
  }, [filtered]);

  const totalHours = perDriver.reduce((s, d) => s + d.hours, 0);
  const totalCost = perDriver.reduce((s, d) => s + d.cost, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Lembur & Biaya Trip Tim</h1>
        <p className="text-sm text-gray-500">Pantau beban jam kerja dan biaya trip (insentif jarak) tim {department || "Anda"} untuk kontrol biaya.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
        <span className="text-xs text-slate-400">s/d</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
        <button onClick={load} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold">Muat Ulang</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Route size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Trip</p><p className="text-xl font-extrabold text-slate-800">{filtered.length}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Jam Kerja</p><p className="text-xl font-extrabold text-slate-800">{Math.round(totalHours)}h</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Wallet size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Biaya Trip</p><p className="text-xl font-extrabold text-slate-800">Rp {Math.round(totalCost).toLocaleString("id-ID")}</p></div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari supir, tujuan, atau plat kendaraan..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mx-auto mb-2" /></div>
      ) : perDriver.length === 0 ? (
        <EmptyState icon={Route} title="Belum ada trip tim Anda pada rentang ini." className="bg-white border-slate-100" />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100"><h3 className="font-extrabold text-slate-800 text-sm">Rekap per Supir</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Supir</th>
                  <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Jml Trip</th>
                  <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Total Jam</th>
                  <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Total Km</th>
                  <th className="text-right py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Biaya Trip</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {perDriver.map(d => (
                    <tr key={d.name}>
                      <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{d.name}</td>
                      <td className="py-2.5 px-4 text-xs text-center">{d.tripCount}</td>
                      <td className="py-2.5 px-4 text-xs text-center">{Math.round(d.hours * 10) / 10}h</td>
                      <td className="py-2.5 px-4 text-xs text-center">{Math.round(d.km)} km</td>
                      <td className="py-2.5 px-4 text-xs text-right font-bold text-emerald-600">Rp {Math.round(d.cost).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100"><h3 className="font-extrabold text-slate-800 text-sm">Detail Trip</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Supir</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tujuan</th>
                  <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Tanggal</th>
                  <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                  <th className="text-right py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Biaya</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(t => (
                    <tr key={t.id}>
                      <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{t.driver_name}</td>
                      <td className="py-2.5 px-4 text-xs text-slate-600">{t.destination}</td>
                      <td className="py-2.5 px-4 text-xs text-slate-500">{new Date(t.trip_date).toLocaleDateString("id-ID")}</td>
                      <td className="py-2.5 px-4 text-xs text-center">{t.status}</td>
                      <td className="py-2.5 px-4 text-xs text-right text-slate-600">Rp {Math.round(tripCost(t)).toLocaleString("id-ID")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
