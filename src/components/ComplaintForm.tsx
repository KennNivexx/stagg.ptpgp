"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { submitComplaint } from "@/app/actions/employee";

export default function ComplaintForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await submitComplaint(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    e.currentTarget.reset();
    setTimeout(() => setSuccess(false), 4000);
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} />
        </div>
        <h3 className="font-bold text-emerald-700 mb-1">Laporan berhasil dikirim!</h3>
        <p className="text-xs text-slate-500">HRD akan meninjau laporan Anda.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm">Ajukan Keluhan atau Saran</h3>
        <p className="text-xs text-slate-400 mt-0.5">Isi formulir di bawah untuk menyampaikan laporan Anda</p>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="comp-cat">Kategori</label>
          <select id="comp-cat" name="category" required className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-pgp-red bg-white">
            <option value="">Pilih Kategori</option>
            <option value="Keluhan">Keluhan</option>
            <option value="Saran">Saran</option>
            <option value="Masukan">Masukan</option>
            <option value="Pelanggaran">Pelanggaran</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="comp-subject">Subjek</label>
          <input id="comp-subject" type="text" name="subject" required placeholder="Judul singkat laporan Anda" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-pgp-red" />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" htmlFor="comp-desc">Deskripsi</label>
          <textarea id="comp-desc" name="description" rows={4} required placeholder="Jelaskan keluhan atau saran Anda secara detail..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-pgp-red resize-none" />
        </div>
        {error && (
          <div className="md:col-span-2">
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          </div>
        )}
        <div className="md:col-span-2">
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-pgp-red text-white text-xs font-bold rounded-xl hover:bg-pgp-red/80 disabled:opacity-60 transition-colors flex items-center gap-2">
            <Send size={14} /> {loading ? "Mengirim..." : "Kirim Laporan"}
          </button>
        </div>
      </div>
    </form>
  );
}
