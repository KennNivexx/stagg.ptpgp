import { supabaseAdmin } from "@/lib/supabase";
import { getFleetExecutiveSummary } from "@/app/actions/vehicles";
import { Truck, AlertTriangle, IdCard, Route, Clock, Wallet } from "lucide-react";

function expiryDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function DirectorFleetPage() {
  const fleet = await getFleetExecutiveSummary();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString("en-CA");
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString("en-CA");

  const [{ data: licenses }, { data: incidentsThisMonth }, { data: trips }] = await Promise.all([
    supabaseAdmin.from("sim_sertifikasi_karyawan").select("expiry_date"),
    supabaseAdmin.from("laporan_insiden").select("id, severity").gte("created_at", monthStart),
    supabaseAdmin.from("trip_supir").select("distance_km, rate_per_km, start_time, end_time, status").gte("trip_date", monthStart).lte("trip_date", monthEnd),
  ]);

  const licenseRows = (licenses as Array<{ expiry_date: string }>) || [];
  const expiringLicenses = licenseRows.filter(l => { const d = expiryDaysLeft(l.expiry_date); return d !== null && d <= 30; }).length;
  const expiredLicenses = licenseRows.filter(l => { const d = expiryDaysLeft(l.expiry_date); return d !== null && d < 0; }).length;

  const incidentRows = (incidentsThisMonth as Array<{ id: string; severity: string }>) || [];
  const seriousIncidents = incidentRows.filter(i => i.severity === "Berat").length;

  const tripRows = (trips as Array<{ distance_km: number | null; rate_per_km: number; start_time: string; end_time: string | null; status: string }>) || [];
  const completedTrips = tripRows.filter(t => t.status === "Selesai");
  const totalCost = completedTrips.reduce((s, t) => s + (t.distance_km || 0) * (t.rate_per_km || 0), 0);
  const totalKm = completedTrips.reduce((s, t) => s + (t.distance_km || 0), 0);
  const costPerKm = totalKm > 0 ? totalCost / totalKm : 0;
  const totalHours = completedTrips.reduce((s, t) => t.end_time ? s + (new Date(t.end_time).getTime() - new Date(t.start_time).getTime()) / (1000 * 60 * 60) : s, 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Armada & Kepatuhan</h1>
        <p className="text-sm text-gray-500">Ringkasan eksekutif utilisasi armada, biaya trip, dan risiko kepatuhan bulan ini.</p>
      </div>

      <div>
        <h3 className="font-extrabold text-slate-800 text-sm mb-3">Utilisasi Armada</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Kendaraan" value={fleet.totalVehicles} icon={Truck} color="bg-blue-50 text-blue-600" />
          <StatCard label="Sedang Jalan" value={fleet.onTripNow} icon={Route} color="bg-blue-50 text-blue-600" />
          <StatCard label="Aktif" value={fleet.activeVehicles} icon={Truck} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Sedang Servis" value={fleet.inService} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Tingkat utilisasi: {fleet.totalVehicles > 0 ? Math.round((fleet.onTripNow / fleet.totalVehicles) * 100) : 0}% kendaraan sedang beroperasi saat ini.
        </p>
      </div>

      <div>
        <h3 className="font-extrabold text-slate-800 text-sm mb-3">Biaya Trip Bulan Ini</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Trip Selesai" value={completedTrips.length} icon={Route} color="bg-blue-50 text-blue-600" />
          <StatCard label="Total Jam Kerja" value={`${Math.round(totalHours)}h`} icon={Clock} color="bg-amber-50 text-amber-600" />
          <StatCard label="Total Biaya" value={`Rp ${Math.round(totalCost).toLocaleString("id-ID")}`} icon={Wallet} color="bg-emerald-50 text-emerald-600" />
          <StatCard label="Biaya per Km" value={`Rp ${Math.round(costPerKm).toLocaleString("id-ID")}`} icon={Wallet} color="bg-emerald-50 text-emerald-600" />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Catatan: sistem belum melacak estimasi waktu tiba (ETA), jadi metrik &quot;on-time delivery rate&quot; belum bisa dihitung otomatis.</p>
      </div>

      <div>
        <h3 className="font-extrabold text-slate-800 text-sm mb-3">Risiko Kepatuhan</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Dokumen Kendaraan Segera Habis" value={fleet.expiringDocs30d} icon={AlertTriangle} color="bg-amber-50 text-amber-600" />
          <StatCard label="Dokumen Kendaraan Sudah Habis" value={fleet.expiredDocs} icon={AlertTriangle} color="bg-red-50 text-red-600" />
          <StatCard label="SIM Segera Habis (&le;30 hari)" value={expiringLicenses} icon={IdCard} color="bg-amber-50 text-amber-600" />
          <StatCard label="SIM Sudah Habis" value={expiredLicenses} icon={IdCard} color="bg-red-50 text-red-600" />
        </div>
      </div>

      <div>
        <h3 className="font-extrabold text-slate-800 text-sm mb-3">Insiden Bulan Ini</h3>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Insiden" value={incidentRows.length} icon={AlertTriangle} color="bg-blue-50 text-blue-600" />
          <StatCard label="Tingkat Berat" value={seriousIncidents} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }) {
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
