"use client";

import { useState } from "react";
import { Plus, X, Send, Camera, MapPin } from "lucide-react";
import { submitIncident } from "@/app/actions/incidents";
import { uploadFileToStorage } from "@/lib/storage-upload";

const SEVERITY_OPTS = ["Ringan", "Sedang", "Berat"];

export default function IncidentReportButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const openModal = () => {
    setOpen(true);
    setPhotoUrl(""); setLocation(null); setError("");
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => { setLocating(false); setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        () => setLocating(false),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }
  };

  const handlePhotoChange = async (file: File) => {
    setUploading(true);
    const result = await uploadFileToStorage(file, "incident-photos", "reports", { acceptPrefix: "image/", maxSizeMB: 10 });
    setUploading(false);
    if ("error" in result) { setError(result.error); return; }
    setPhotoUrl(result.url);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    if (photoUrl) formData.set("photo_url", photoUrl);
    if (location) { formData.set("latitude", String(location.lat)); formData.set("longitude", String(location.lng)); }
    const result = await submitIncident(formData);

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
        onClick={openModal}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-pgp-red hover:bg-pgp-red/80 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-red-900/10"
      >
        <Plus size={14} /> Lapor Insiden
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-pgp-navy">Laporkan Insiden</h2>
              <button onClick={() => !loading && setOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={24} />
                </div>
                <p className="font-bold text-emerald-700">Laporan berhasil dikirim!</p>
                <p className="text-xs text-slate-500 mt-1">Atasan Anda akan menindaklanjuti.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="incident-title">Judul</label>
                  <input id="incident-title" name="title" required placeholder="cth. Kerusakan ban truk saat pengiriman" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="incident-severity">Tingkat Keparahan</label>
                  <select id="incident-severity" name="severity" defaultValue="Ringan" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none bg-white">
                    {SEVERITY_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="incident-description">Deskripsi</label>
                  <textarea id="incident-description" name="description" rows={3} placeholder="Jelaskan kejadian, lokasi, dan dampaknya..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Foto <span className="font-normal text-slate-400">(opsional)</span></label>
                  <label className="flex items-center gap-2 justify-center border border-dashed border-slate-300 rounded-lg py-3 text-xs text-slate-500 cursor-pointer hover:bg-slate-50">
                    <Camera size={14} /> {uploading ? "Mengunggah..." : photoUrl ? "Foto terunggah ✓" : "Ambil/Unggah Foto"}
                    <input type="file" accept="image/*" capture="environment" className="hidden" disabled={uploading}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoChange(f); }} />
                  </label>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <MapPin size={12} className={location ? "text-emerald-500" : "text-slate-400"} />
                  {locating ? "Mendeteksi lokasi..." : location ? "Lokasi GPS terlampir" : "Lokasi tidak terdeteksi (laporan tetap bisa dikirim)"}
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button type="submit" disabled={loading || uploading} className="w-full bg-pgp-red hover:bg-pgp-red/80 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? "Mengirim..." : "Kirim Laporan"}
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
