"use client";

import { useState, useEffect } from "react";
import { Truck, Plus, X, Send } from "lucide-react";
import { getVehicleRequests, submitVehicleRequest, type VehicleProcurementRequest } from "@/app/actions/vehicle-procurement";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLES: Record<string, string> = {
  Disetujui: "bg-emerald-50 text-emerald-600",
  Ditolak: "bg-red-50 text-red-600",
  Pending: "bg-amber-50 text-amber-600",
};

const VEHICLE_TYPES = ["Truk", "Tronton", "Box", "Pickup", "Trailer", "Van"];

export default function HRDVehicleRequestsPage() {
  const [data, setData] = useState<VehicleProcurementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = () => getVehicleRequests().then(d => { setData(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    const result = await submitVehicleRequest(new FormData(e.currentTarget));
    setSubmitting(false);
    if ("error" in result) { setError(result.error); return; }
    showToast("Pengajuan pengadaan kendaraan terkirim.");
    setShowForm(false);
    load();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengadaan Kendaraan</h1>
          <p className="text-sm text-gray-500">Ajukan pembelian kendaraan baru untuk persetujuan Direktur.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
          <Plus size={14} /> Ajukan Pengadaan
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" /></div>
      ) : data.length === 0 ? (
        <EmptyState icon={Truck} title="Belum ada pengajuan pengadaan kendaraan." className="bg-white border-slate-100" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Jenis</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Jumlah</th>
                <th className="text-right py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Estimasi Biaya</th>
                <th className="text-center py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Status</th>
                <th className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-500 uppercase">Disetujui/Ditolak Oleh</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {data.map(r => (
                  <tr key={r.id}>
                    <td className="py-2.5 px-4 text-xs font-bold text-slate-800">{r.vehicle_type}</td>
                    <td className="py-2.5 px-4 text-xs text-center">{r.quantity}</td>
                    <td className="py-2.5 px-4 text-xs text-right">{r.estimated_cost != null ? `Rp ${r.estimated_cost.toLocaleString("id-ID")}` : "-"}</td>
                    <td className="py-2.5 px-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-500"}`}>{r.status}</span></td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">{r.approved_by || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-pgp-navy">Ajukan Pengadaan Kendaraan</h2>
              <button onClick={() => !submitting && setShowForm(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Jenis Kendaraan</label>
                <select name="vehicle_type" required defaultValue="" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm">
                  <option value="" disabled>Pilih jenis</option>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Jumlah</label>
                  <input type="number" name="quantity" min={1} defaultValue={1} required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Estimasi Biaya (Rp)</label>
                  <input type="number" name="estimated_cost" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Alasan</label>
                <textarea name="reason" rows={3} placeholder="Kenapa perlu tambahan kendaraan?" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none" />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full bg-pgp-red hover:bg-pgp-red/80 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2">
                {submitting ? "Mengirim..." : "Kirim Pengajuan"} <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
