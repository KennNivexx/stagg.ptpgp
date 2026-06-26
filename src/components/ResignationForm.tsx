"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { submitResignation } from "@/app/actions/employee";

export default function ResignationForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin mengajukan pengunduran diri? Tindakan ini tidak dapat dibatalkan."
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await submitResignation(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} />
        </div>
        <h3 className="font-bold text-emerald-700 mb-1">Pengajuan resign berhasil dikirim!</h3>
        <p className="text-xs text-slate-500">HRD akan meninjau pengajuan Anda dan menghubungi untuk proses selanjutnya.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm">Formulir Pengajuan Resign</h3>
        <p className="text-xs text-slate-400 mt-0.5">Isi formulir berikut untuk mengajukan pengunduran diri</p>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="resign-reason">Alasan Pengunduran Diri</label>
          <select id="resign-reason" name="reason" required className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-pgp-red bg-white">
            <option value="">Pilih Alasan</option>
            <option value="Kesempatan karir yang lebih baik">Kesempatan karir yang lebih baik</option>
            <option value="Alasan pribadi/keluarga">Alasan pribadi/keluarga</option>
            <option value="Melanjutkan pendidikan">Melanjutkan pendidikan</option>
            <option value="Masalah kesehatan">Masalah kesehatan</option>
            <option value="Pindah domisili">Pindah domisili</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="resign-lastday">Hari Kerja Terakhir</label>
          <input id="resign-lastday" type="date" name="last_day" required className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-pgp-red" />
          <p className="text-[9px] text-amber-600 mt-1">Minimal 30 hari dari tanggal pengajuan (notice period)</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="resign-notes">Catatan Tambahan</label>
          <textarea id="resign-notes" name="notes" rows={4} placeholder="Sampaikan pesan atau catatan tambahan untuk HRD..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-pgp-red resize-none" />
        </div>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" required className="rounded border-slate-300 text-pgp-red focus:ring-pgp-red" />
            <span className="text-xs text-slate-600">Saya memahami bahwa pengajuan ini bersifat final dan akan diproses sesuai kebijakan perusahaan</span>
          </label>
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button type="submit" disabled={loading} className="px-6 py-2.5 bg-pgp-red text-white text-xs font-bold rounded-xl hover:bg-pgp-red/80 disabled:opacity-60 transition-colors flex items-center gap-2">
          <Send size={14} /> {loading ? "Mengirim..." : "Ajukan Resign"}
        </button>
      </div>
    </form>
  );
}
