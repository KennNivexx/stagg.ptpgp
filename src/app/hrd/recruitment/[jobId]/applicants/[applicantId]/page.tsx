"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, UserCheck, ChevronDown } from "lucide-react";
import { convertApplicantToEmployee, getApplicantDetail } from "@/app/actions/hrd";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Experience { position?: string; company?: string; start?: string; end?: string; current?: boolean; description?: string; }
interface Education  { school?: string; degree?: string; field?: string; start?: string; end?: string; }
interface ProfileData {
  headline?: string; summary?: string; location?: string;
  linkedin?: string; portfolio?: string; coverLetter?: string; cv_url?: string;
  skills?: string[]; experiences?: Experience[]; educations?: Education[];
  languages?: string[]; certifications?: string[];
}

function parseProfile(raw?: string): ProfileData {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw);
    if (typeof p === "object" && p !== null && !Array.isArray(p)) return p as ProfileData;
  } catch { /* ignore */ }
  if (raw.startsWith("http") || raw.startsWith("/")) return { cv_url: raw };
  return {};
}

// ── Tabel seksi ────────────────────────────────────────────────────────────────
function SecHead({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={2} className="px-4 pt-3 pb-1.5 bg-slate-50 border-y border-slate-200">
        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">{title}</span>
      </td>
    </tr>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2.5 px-4 w-36 text-[11px] text-slate-500 font-semibold bg-slate-50/40 align-top whitespace-nowrap">{label}</td>
      <td className="py-2.5 px-4 text-[11px] text-slate-800 align-top">{children}</td>
    </tr>
  );
}

function ProfileTable({ raw, email, phone, appliedAt }: { raw?: string; email: string; phone?: string; appliedAt?: string }) {
  const p = parseProfile(raw);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <table className="w-full border-collapse text-[11px]">
        <tbody>

          {/* Informasi Pribadi */}
          <SecHead title="Informasi Pribadi" />
          <Row label="Email">{email}</Row>
          <Row label="Telepon">{phone || <span className="text-slate-300">—</span>}</Row>
          <Row label="Tanggal Lamar">
            {appliedAt
              ? new Date(appliedAt).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
              : "—"}
          </Row>
          {p.location  && <Row label="Lokasi">{p.location}</Row>}
          {p.headline  && <Row label="Headline"><span className="font-semibold">{p.headline}</span></Row>}
          {(p.linkedin || p.portfolio) && (
            <Row label="Tautan">
              <div className="space-y-0.5">
                {p.linkedin  && <div><span className="text-slate-400">LinkedIn: </span>{p.linkedin}</div>}
                {p.portfolio && <div><span className="text-slate-400">Portfolio: </span>{p.portfolio}</div>}
              </div>
            </Row>
          )}

          {/* Pendidikan */}
          {!!p.educations?.length && (
            <>
              <SecHead title="Pendidikan" />
              <tr className="border-b border-slate-100">
                <td colSpan={2} className="p-0">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80">
                        {["Gelar", "Jurusan", "Institusi", "Tahun"].map(h => (
                          <th key={h} className="py-1.5 px-4 text-left text-[9px] font-bold text-slate-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.educations.map((e, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                          <td className="py-2 px-4 text-slate-700 font-semibold">{e.degree  || "—"}</td>
                          <td className="py-2 px-4 text-slate-600">{e.field  || "—"}</td>
                          <td className="py-2 px-4 text-slate-600">{e.school || "—"}</td>
                          <td className="py-2 px-4 text-slate-500 whitespace-nowrap">{e.start ? `${e.start}${e.end ? `–${e.end}` : ""}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </>
          )}

          {/* Pengalaman Kerja */}
          {!!p.experiences?.length && (
            <>
              <SecHead title="Pengalaman Kerja" />
              <tr className="border-b border-slate-100">
                <td colSpan={2} className="p-0">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80">
                        {["Jabatan", "Perusahaan", "Periode"].map(h => (
                          <th key={h} className="py-1.5 px-4 text-left text-[9px] font-bold text-slate-400 uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {p.experiences.map((e, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                          <td className="py-2 px-4 text-slate-700 font-semibold">{e.position || "—"}</td>
                          <td className="py-2 px-4 text-slate-600">{e.company  || "—"}</td>
                          <td className="py-2 px-4 text-slate-500 whitespace-nowrap">{e.start ? `${e.start}–${e.current ? "sekarang" : e.end || ""}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </>
          )}

          {/* Keahlian & Bahasa */}
          {(!!p.skills?.length || !!p.languages?.length || !!p.certifications?.length) && (
            <>
              <SecHead title="Keahlian & Bahasa" />
              {!!p.skills?.length && (
                <Row label="Keahlian">
                  <div className="flex flex-wrap gap-1">
                    {p.skills.map((s, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-semibold">{s}</span>)}
                  </div>
                </Row>
              )}
              {!!p.languages?.length && (
                <Row label="Bahasa">
                  <div className="flex flex-wrap gap-1">
                    {p.languages.map((l, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-semibold">{l}</span>)}
                  </div>
                </Row>
              )}
              {!!p.certifications?.length && (
                <Row label="Sertifikasi">
                  <div className="flex flex-wrap gap-1">
                    {p.certifications.map((c, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-semibold">{c}</span>)}
                  </div>
                </Row>
              )}
            </>
          )}

          {/* Ringkasan & Motivasi */}
          {(p.summary || p.coverLetter) && (
            <>
              <SecHead title="Ringkasan & Motivasi" />
              {p.summary    && <Row label="Ringkasan"><span className="leading-relaxed">{p.summary}</span></Row>}
              {p.coverLetter && <Row label="Motivasi"><span className="leading-relaxed whitespace-pre-line">{p.coverLetter}</span></Row>}
            </>
          )}

          {/* Dokumen */}
          {p.cv_url && (
            <>
              <SecHead title="Dokumen" />
              <Row label="File CV">
                <a href={p.cv_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#CC0000] border border-red-100 rounded-lg text-[11px] font-bold hover:bg-red-100 transition-colors">
                  <FileText size={12} /> Lihat / Download CV
                </a>
              </Row>
            </>
          )}

        </tbody>
      </table>
    </div>
  );
}

// ── Halaman utama ──────────────────────────────────────────────────────────────
export default function ApplicantDetailPage() {
  const params = useParams();
  const jobId      = params.jobId as string;
  const applicantId = params.applicantId as string;

  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState("");
  const [success,           setSuccess]           = useState("");
  const [showConvert,       setShowConvert]       = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [application,       setApplication]       = useState<Record<string, unknown> | null>(null);
  const [job,               setJob]               = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!jobId || !applicantId) return;
    getApplicantDetail(applicantId, jobId)
      .then(d => { setApplication(d.application); setJob(d.job); })
      .catch(() => setError("Gagal memuat data."));
  }, [jobId, applicantId]);

  const handleConvert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setLoading(true); setError(""); setSuccess("");
    const res = await convertApplicantToEmployee(applicantId, new FormData(e.currentTarget));
    if (res?.error) { setError(res.error); }
    else if ("success" in res) {
      setSuccess("Pelamar berhasil dikonversi menjadi karyawan!");
      if (res.password) setGeneratedPassword(res.password as string);
      setShowConvert(false);
    }
    setLoading(false);
  };

  if (!application) {
    return (
      <div className="p-8">
        <Link href="/hrd/recruitment/interviews" className="inline-flex items-center text-sm text-gray-500 hover:text-[#CC0000] mb-4">
          <ArrowLeft size={16} className="mr-1" /> Kembali
        </Link>
        {error
          ? <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm">{error}</div>
          : <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center animate-pulse text-slate-400">Memuat data...</div>}
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === "Diterima")             return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "Ditolak")              return "bg-red-50 text-red-700 border-red-200";
    if (s === "Interview")            return "bg-blue-50 text-blue-700 border-blue-200";
    if (s === "Tes Tulis & Psikotes") return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link href="/hrd/recruitment/interviews" className="inline-flex items-center text-sm text-gray-500 hover:text-[#CC0000] transition-colors mb-5">
        <ArrowLeft size={16} className="mr-1" /> Kembali ke Interview
      </Link>

      {/* Notifikasi */}
      {error && <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* ── Kiri: profil ── */}
        <div className="space-y-4">
          {/* Header nama */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xl shrink-0">
              {(application.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-800">{application.full_name as string}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Melamar: <span className="font-semibold text-slate-700">{job?.title as string || job?.position as string || "—"}</span>
                {(job?.department as string) && <span className="text-slate-400"> · {job?.department as string}</span>}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 ${statusColor(application.status as string)}`}>
              {application.status as string || "Menunggu Review"}
            </span>
          </div>

          {/* Tabel profil lengkap */}
          <ProfileTable
            raw={application.resume_url as string | undefined}
            email={application.email as string}
            phone={application.phone as string | undefined}
            appliedAt={application.applied_at as string | undefined}
          />
        </div>

        {/* ── Kanan: aksi ── */}
        <div className="space-y-4">

          {/* Konversi ke karyawan */}
          {application.status === "Diterima" && !showConvert && (
            <button onClick={() => setShowConvert(true)}
              className="w-full bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-2xl p-5 text-left transition-all shadow-md shadow-red-600/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl"><UserCheck size={18} /></div>
                <div>
                  <p className="font-bold text-sm">Konversi ke Karyawan</p>
                  <p className="text-xs text-red-100 mt-0.5">Buat akun dari pelamar ini</p>
                </div>
                <ChevronDown size={16} className="ml-auto" />
              </div>
            </button>
          )}

          {showConvert && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-4">Data Karyawan Baru</p>
              <form onSubmit={handleConvert} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama</label>
                  <input type="text" defaultValue={application.full_name as string} disabled className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email</label>
                  <input type="text" defaultValue={application.email as string} disabled className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 text-slate-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Departemen</label>
                  <select name="department" required className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-white">
                    <option value="">Pilih Departemen</option>
                    {["Operasional","Administrasi","Keuangan","IT & Sistem","HRD"].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jabatan</label>
                  <input type="text" name="position" required className="w-full border border-slate-200 p-2.5 rounded-xl text-xs" placeholder="Cth: Staff Gudang" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password Akun</label>
                  <input type="text" name="password" className="w-full border border-slate-200 p-2.5 rounded-xl text-xs" placeholder="Kosongkan untuk auto-generate" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowConvert(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                    Batal
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 px-4 py-2.5 text-xs font-bold bg-[#CC0000] text-white rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50">
                    {loading ? "Menyimpan..." : "Konversi"}
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
