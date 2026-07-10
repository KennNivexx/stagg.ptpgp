"use client";

import { useState } from "react";
import { Siren, X } from "lucide-react";
import { triggerSOS } from "@/app/actions/incidents";

export default function SOSButton() {
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSOS = async () => {
    setSending(true);
    setError("");
    let lat: number | undefined, lng: number | undefined;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 })
        );
        lat = pos.coords.latitude; lng = pos.coords.longitude;
      } catch { /* kirim tanpa lokasi kalau GPS gagal/ditolak */ }
    }
    const result = await triggerSOS(lat, lng);
    setSending(false);
    if ("error" in result) { setError(result.error); return; }
    setSent(true);
    setTimeout(() => { setConfirming(false); setSent(false); }, 2500);
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        title="SOS Darurat"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 flex items-center justify-center transition-colors"
      >
        <Siren size={22} />
      </button>

      {confirming && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            {sent ? (
              <>
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Siren size={28} />
                </div>
                <p className="font-bold text-emerald-700">SOS terkirim!</p>
                <p className="text-xs text-slate-500 mt-1">Kepala departemen dan HRD sudah diberi tahu beserta lokasi Anda.</p>
              </>
            ) : (
              <>
                <button onClick={() => setConfirming(false)} className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Siren size={28} />
                </div>
                <h3 className="font-extrabold text-slate-800 mb-1">Kirim SOS Darurat?</h3>
                <p className="text-xs text-slate-500 mb-5">Kepala departemen dan HRD akan segera diberi tahu beserta lokasi Anda saat ini. Gunakan hanya untuk keadaan darurat.</p>
                {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setConfirming(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Batal</button>
                  <button onClick={handleSOS} disabled={sending} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold disabled:opacity-60">
                    {sending ? "Mengirim..." : "Ya, Kirim SOS"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
