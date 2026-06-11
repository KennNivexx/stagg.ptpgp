"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Calendar, FileText, Download, UserCheck, ChevronDown } from "lucide-react";
import { updateApplicationStatus, convertApplicantToEmployee, getApplicantDetail } from "@/app/actions/hrd";

export default function ApplicantDetailPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showConvert, setShowConvert] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const segments = path.split("/");
  const jobId = segments[3] || "";
  const applicantId = segments[5] || "";

  const [application, setApplication] = useState<Record<string, unknown> | null>(null);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!jobId || !applicantId) return;
    getApplicantDetail(applicantId, jobId).then(d => {
      setApplication(d.application);
      setJob(d.job);
    }).catch(() => setError("Gagal memuat data."));
  }, [jobId, applicantId]);

  const handleStatusChange = async (status: string) => {
    setLoading(true);
    setError("");
    const res = await updateApplicationStatus(applicantId, status);
    if (res?.error) {
      setError(res.error);
    } else {
      setApplication(prev => prev ? { ...prev, status } : null);
      setSuccess(`Status diubah menjadi "${status}"`);
    }
    setLoading(false);
  };

  const handleConvert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const formData = new FormData(e.currentTarget);
    const res = await convertApplicantToEmployee(applicantId, formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess("Pelamar berhasil dikonversi menjadi karyawan!");
      if (res?.password) {
        setGeneratedPassword(res.password);
      }
      setShowConvert(false);
    }
    setLoading(false);
  };

  if (!application) {
    return (
      <div className="p-8">
        <Link href={`/hrd/recruitment/${jobId}/applicants`} className="inline-flex items-center text-sm text-gray-500 hover:text-[#CC0000] transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1" /> Kembali
        </Link>
        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="animate-pulse text-slate-400">Memuat data...</div>
          </div>
        )}
      </div>
    );
  }

  const statusOptions = ["Menunggu Review", "Diproses", "Interview", "Diterima", "Ditolak"];

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Link href={`/hrd/recruitment/${jobId}/applicants`} className="inline-flex items-center text-sm text-gray-500 hover:text-[#CC0000] transition-colors mb-4">
        <ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Pelamar
      </Link>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">
          {success}
          {generatedPassword && (
            <div className="mt-2 p-3 bg-white rounded-lg border border-emerald-200">
              <p className="text-xs text-slate-600">Password login karyawan baru:</p>
              <p className="text-lg font-mono font-bold text-slate-800 mt-1">{generatedPassword}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
                  {(application.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{application.full_name as string}</h2>
                  <p className="text-sm text-slate-500">Melamar: {job?.title as string || "-"}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-xl text-xs font-bold ${
                    application.status === "Diterima" ? "bg-emerald-50 text-emerald-700" :
                    application.status === "Ditolak" ? "bg-red-50 text-red-700" :
                    application.status === "Interview" ? "bg-blue-50 text-blue-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {application.status as string || "Menunggu Review"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                  <p className="text-sm text-slate-700">{application.email as string}</p>
                </div>
              </div>
              {!!application.phone && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <Phone size={16} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Telepon</p>
                    <p className="text-sm text-slate-700">{application.phone as string}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Calendar size={16} className="text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Melamar</p>
                  <p className="text-sm text-slate-700">
                    {new Date(application.applied_at as string).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(() => {
            try {
              const resumeData = JSON.parse((application.resume_url as string) || "{}");
              const profile = resumeData.profile;
              if (!profile) return null;
              return (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
                  <h3 className="font-extrabold text-slate-800 text-sm">Profil Lengkap</h3>
                  {profile.headline && <p className="text-sm text-slate-700 font-medium">{profile.headline}</p>}
                  {profile.summary && <p className="text-xs text-slate-500 leading-relaxed">{profile.summary}</p>}
                  {profile.location && <p className="text-xs text-slate-500">Lokasi: {profile.location}</p>}
                  {profile.linkedin && <p className="text-xs text-slate-500">LinkedIn: {profile.linkedin}</p>}
                  {profile.portfolio && <p className="text-xs text-slate-500">Portfolio: {profile.portfolio}</p>}

                  {profile.skills?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Keahlian</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((s: string) => (
                          <span key={s} className="px-2.5 py-1 bg-orange-50 text-pgp-red text-[10px] font-semibold rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.languages?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Bahasa</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.languages.map((l: string) => (
                          <span key={l} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-semibold rounded-full">{l}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.certifications?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Sertifikasi</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.certifications.map((c: string) => (
                          <span key={c} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.experiences?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Pengalaman Kerja</p>
                      {profile.experiences.map((exp: Record<string, unknown>, i: number) => (
                        <div key={i} className="border-l-2 border-pgp-red/30 pl-4 py-2 mb-2 last:mb-0">
                          <p className="text-sm font-bold text-slate-800">{exp.position as string}</p>
                          <p className="text-xs text-slate-500">{exp.company as string} &middot; {exp.start as string} - {exp.current ? "Sekarang" : exp.end as string}</p>
                          {!!exp.description && <p className="text-[11px] text-slate-500 mt-1">{exp.description as string}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {profile.educations?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Pendidikan</p>
                      {profile.educations.map((edu: Record<string, unknown>, i: number) => (
                        <div key={i} className="border-l-2 border-blue-400/30 pl-4 py-2 mb-2 last:mb-0">
                          <p className="text-sm font-bold text-slate-800">{edu.school as string}</p>
                          <p className="text-xs text-slate-500">{edu.degree as string} - {edu.field as string}</p>
                          <p className="text-[10px] text-slate-400">{edu.start as string} - {edu.end as string}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            } catch { return null; }
          })()}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 mb-4">Ubah Status Pelamar</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(status => (
                <button
                  key={status}
                  disabled={loading || application.status === status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                    application.status === status
                      ? "bg-[#0F172A] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {!!application.resume_url && (
            <a
              href={application.resume_url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 block hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Download CV</p>
                  <p className="text-xs text-slate-400 mt-0.5">Lihat dokumen lamaran</p>
                </div>
                <Download size={16} className="ml-auto text-slate-300 group-hover:text-slate-600 transition-colors" />
              </div>
            </a>
          )}

          {application.status === "Diterima" && !showConvert ? (
            <button
              onClick={() => setShowConvert(true)}
              className="w-full bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-2xl p-6 text-left transition-all shadow-md shadow-red-600/10 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 text-white rounded-xl">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">Konversi ke Karyawan</p>
                  <p className="text-xs text-red-100 mt-0.5">Buat akun karyawan dari pelamar ini</p>
                </div>
                <ChevronDown size={16} className="ml-auto" />
              </div>
            </button>
          ) : null}

          {showConvert && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4">Data Karyawan Baru</h3>
              <form onSubmit={handleConvert} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nama</label>
                  <input type="text" defaultValue={application.full_name as string} disabled className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
                  <input type="text" defaultValue={application.email as string} disabled className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-slate-50" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Departemen</label>
                  <select name="department" required className="w-full border border-slate-200 p-2.5 rounded-xl text-sm bg-white">
                    <option value="">Pilih Departemen</option>
                    <option>Operasional</option>
                    <option>Administrasi</option>
                    <option>Keuangan</option>
                    <option>IT & Sistem</option>
                    <option>HRD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Jabatan</label>
                  <input type="text" name="position" required className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Cth: Staff Gudang" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Password Akun</label>
                  <input type="text" name="password" className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Kosongkan untuk auto-generate" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConvert(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-xs font-bold bg-[#CC0000] text-white rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50"
                  >
                    {loading ? "Menyimpan..." : "Konversi ke Karyawan"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
