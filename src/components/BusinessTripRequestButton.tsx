"use client";

import { useState } from "react";
import { Plus, X, Send } from "lucide-react";
import { submitBusinessTrip } from "@/app/actions/business-trips";

export default function BusinessTripRequestButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await submitBusinessTrip(formData);

    if ("error" in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
    }, 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-pgp-red hover:bg-pgp-red/80 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-red-900/10"
      >
        <Plus size={14} /> Ajukan Dinas
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-pgp-navy">Ajukan Perjalanan Dinas</h2>
              <button onClick={() => !loading && setOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={24} />
                </div>
                <p className="font-bold text-emerald-700">Pengajuan berhasil dikirim!</p>
                <p className="text-xs text-slate-500 mt-1">Atasan Anda akan meninjau pengajuan ini.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="trip-destination">Tujuan Dinas</label>
                  <input id="trip-destination" name="destination" required placeholder="cth. Kunjungan klien Surabaya" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="trip-start">Tanggal Mulai</label>
                    <input id="trip-start" type="date" name="start_date" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="trip-end">Tanggal Selesai</label>
                    <input id="trip-end" type="date" name="end_date" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="trip-reason">Keperluan</label>
                  <textarea id="trip-reason" name="reason" rows={3} placeholder="Keperluan perjalanan dinas..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none resize-none" />
                </div>

                <div className="text-[11px] text-slate-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                  Selama tanggal dinas ini disetujui, Anda tidak perlu berada di lokasi kerja untuk bisa absen.
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button type="submit" disabled={loading} className="w-full bg-pgp-red hover:bg-pgp-red/80 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? "Mengirim..." : "Kirim Pengajuan"}
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
