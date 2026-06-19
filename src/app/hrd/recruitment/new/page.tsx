"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Send } from "lucide-react";

function JobPostingForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [dept, setDept] = useState(params.get("dept") || "");
  const [position, setPosition] = useState(params.get("pos") || "");
  const [quantity, setQuantity] = useState(Number(params.get("qty")) || 1);
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [ageMin, setAgeMin] = useState<number | "">("");
  const [ageMax, setAgeMax] = useState<number | "">("");
  const [location, setLocation] = useState("");
  const [requirements, setRequirements] = useState("");
  const [jobDesk, setJobDesk] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/recruitment/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position, department: dept, quantity,
          education, experience,
          age_min: ageMin || null, age_max: ageMax || null,
          location, requirements, job_desk: jobDesk,
          status: "Open",
          source_request_id: params.get("req") || null,
        }),
      });
      const data = await res.json();
      if (data.error) { setToast(data.error); return; }
      setToast("Lowongan berhasil dibuat!");
      setTimeout(() => router.push("/hrd/recruitment"), 1000);
    } catch { setToast("Gagal membuat lowongan."); }
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-lg">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <Link href="/hrd/workforce/requests" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} className="mr-1" /> Kembali ke Permintaan SDM
      </Link>

      <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Buat Lowongan Kerja</h1>
      <p className="text-sm text-gray-500 mb-6">Permintaan sudah disetujui Director. Isi detail lowongan untuk dipublikasikan.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-slate-100 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen</label>
            <input value={dept} onChange={e => setDept(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50" disabled />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Posisi</label>
            <input value={position} onChange={e => setPosition(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50" disabled />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Jumlah Dibutuhkan</label>
          <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Pendidikan</label>
          <select value={education} onChange={e => setEducation(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20">
            <option value="">Pilih</option>
            <option>SMA/SMK</option><option>D3</option><option>S1</option><option>S2</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Pengalaman</label>
          <input value={experience} onChange={e => setExperience(e.target.value)} placeholder="Min. 2 tahun"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Usia Min</label>
            <input type="number" value={ageMin} onChange={e => setAgeMin(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Usia Max</label>
            <input type="number" value={ageMax} onChange={e => setAgeMax(e.target.value ? Number(e.target.value) : "")}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Lokasi</label>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Jakarta Utara"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Deskripsi Pekerjaan (Job Desk)</label>
          <textarea value={jobDesk} onChange={e => setJobDesk(e.target.value)} rows={5}
            placeholder="Melakukan pencatatan keuangan harian&#10;Menyusun laporan keuangan bulanan&#10;Memeriksa dan memverifikasi dokumen transaksi&#10;Berkolaborasi dengan tim audit"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Persyaratan (1 per baris)</label>
          <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={4}
            placeholder="Pengalaman di bidang terkait&#10;Mampu bekerja dalam tim&#10;Bersedia ditempatkan di luar kota"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-50 transition-colors">
          <Send size={14} /> {loading ? "Menyimpan..." : "Publikasikan Lowongan"}
        </button>
      </form>
    </div>
  );
}

export default function NewJobPostingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat...</div>}>
      <JobPostingForm />
    </Suspense>
  );
}
