"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createJob } from "@/app/actions/hrd";

export default function NewRecruitmentForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    try {
      const res = await createJob(formData);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        window.location.href = "/hrd/recruitment";
      }
    } catch (err) {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/hrd/recruitment" className="inline-flex items-center text-sm text-gray-500 hover:text-pgp-red transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Rekrutmen
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Buat Lowongan Baru</h1>
        <p className="text-sm text-gray-500 mt-1">Publikasikan lowongan kerja baru untuk ditampilkan di halaman karir publik.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-sm text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Judul Pekerjaan</label>
                <input type="text" name="title" required className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="Cth: Logistics Manager" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Departemen</label>
                <select name="department" className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors bg-white">
                  <option>Operasional</option>
                  <option>Administrasi</option>
                  <option>Keuangan</option>
                  <option>IT & Sistem</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Tipe Pekerjaan</label>
                <select name="type" className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors bg-white">
                  <option>Penuh Waktu (Full Time)</option>
                  <option>Paruh Waktu (Part Time)</option>
                  <option>Magang (Internship)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Lokasi Penempatan</label>
                <input type="text" name="location" required className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="Cth: Jakarta Utara" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Batas Akhir Lamaran</label>
                <input type="date" name="deadline" className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Deskripsi & Persyaratan</label>
                <textarea name="description" rows={6} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" placeholder="Tuliskan deskripsi pekerjaan, tanggung jawab, dan kualifikasi yang dibutuhkan..."></textarea>
              </div>
            </div>
          </div>

          <div className="p-8 flex justify-end gap-4 bg-gray-50 border-t border-gray-100">
            <Link href="/hrd/recruitment" className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm transition-colors">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-sm transition-colors disabled:opacity-50">
              {loading ? "Mempublikasikan..." : "Publikasikan Lowongan"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
