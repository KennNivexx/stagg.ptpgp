"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Send, Briefcase, MapPin, GraduationCap,
  Users, FileText, ClipboardList, CheckCircle2,
} from "lucide-react";

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
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recruitment/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position, department: dept, quantity,
          education, experience,
          age_min: ageMin || null, age_max: ageMax || null,
          location, requirements, job_desk: jobDesk,
          description,
          status: "Open",
          source_request_id: params.get("req") || null,
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setDone(true);
      setTimeout(() => router.push("/hrd/recruitment"), 1500);
    } catch {
      setError("Gagal membuat lowongan. Coba lagi.");
      setLoading(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/50 transition-all";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <CheckCircle2 size={48} className="text-emerald-500" />
        <p className="text-lg font-bold text-slate-700">Lowongan berhasil dipublikasikan!</p>
        <p className="text-sm text-slate-400">Mengalihkan ke halaman rekrutmen...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/hrd/workforce/requests" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ArrowLeft size={14} /> Kembali ke Permintaan SDM
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-800">Buat Lowongan Kerja</h1>
        <p className="text-sm text-slate-400 mt-1">Permintaan sudah disetujui. Isi detail lowongan untuk dipublikasikan ke halaman karir.</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Posisi & Departemen */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Briefcase size={16} /></div>
            <h3 className="font-extrabold text-slate-800 text-sm">Informasi Posisi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>Posisi / Jabatan</label>
              <input value={position} onChange={e => setPosition(e.target.value)} required
                placeholder="Staff Akuntansi" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Jumlah Dibutuhkan</label>
              <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Departemen</label>
              <input value={dept} onChange={e => setDept(e.target.value)} required
                placeholder="Keuangan" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Lokasi</label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="Cilegon, Banten" className={`${inputCls} pl-8`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tipe Pekerjaan</label>
              <select className={`${inputCls} bg-white`}>
                <option>Penuh Waktu</option>
                <option>Paruh Waktu</option>
                <option>Kontrak</option>
                <option>Magang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Kualifikasi */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><GraduationCap size={16} /></div>
            <h3 className="font-extrabold text-slate-800 text-sm">Kualifikasi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className={labelCls}>Pendidikan Minimum</label>
              <select value={education} onChange={e => setEducation(e.target.value)} className={`${inputCls} bg-white`}>
                <option value="">Pilih</option>
                <option>SMA/SMK</option>
                <option>D1</option>
                <option>D2</option>
                <option>D3</option>
                <option>S1</option>
                <option>S2</option>
                <option>S3</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>Pengalaman Kerja</label>
              <input value={experience} onChange={e => setExperience(e.target.value)}
                placeholder="Min. 2 tahun di bidang terkait" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Usia Minimum</label>
              <div className="relative">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={ageMin} onChange={e => setAgeMin(e.target.value ? Number(e.target.value) : "")}
                  placeholder="20" className={`${inputCls} pl-8`} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Usia Maksimum</label>
              <div className="relative">
                <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={ageMax} onChange={e => setAgeMax(e.target.value ? Number(e.target.value) : "")}
                  placeholder="40" className={`${inputCls} pl-8`} />
              </div>
            </div>
          </div>
        </div>

        {/* Deskripsi & Job Desk */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><FileText size={16} /></div>
            <h3 className="font-extrabold text-slate-800 text-sm">Deskripsi Pekerjaan</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ringkasan Posisi</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                placeholder="Ceritakan secara singkat tentang posisi ini, tim, dan konteks pekerjaan..."
                className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>Tanggung Jawab / Job Desk</label>
              <textarea value={jobDesk} onChange={e => setJobDesk(e.target.value)} rows={5}
                placeholder={"Melakukan pencatatan keuangan harian\nMenyusun laporan keuangan bulanan\nBerkoordinasi dengan tim audit"}
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {/* Persyaratan */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><ClipboardList size={16} /></div>
            <h3 className="font-extrabold text-slate-800 text-sm">Persyaratan Khusus</h3>
          </div>
          <div>
            <label className={labelCls}>Persyaratan (1 poin per baris)</label>
            <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={6}
              placeholder={"Menguasai Microsoft Excel tingkat lanjut\nMampu bekerja di bawah tekanan\nBersedia lembur jika dibutuhkan\nMemiliki SIM A aktif"}
              className={`${inputCls} resize-none`} />
            <p className="text-[10px] text-slate-400 mt-1.5">Setiap baris = satu poin persyaratan. Ini yang ditampilkan di halaman karir publik kepada pelamar.</p>
          </div>
        </div>

        <div className="flex justify-end pb-8">
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-50 transition-colors shadow-md shadow-red-900/10">
            <Send size={14} /> {loading ? "Menyimpan..." : "Publikasikan Lowongan"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewJobPostingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Memuat formulir...</div>}>
      <JobPostingForm />
    </Suspense>
  );
}
