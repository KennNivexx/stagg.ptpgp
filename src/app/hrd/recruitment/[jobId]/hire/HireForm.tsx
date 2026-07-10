"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, CheckCircle2, Mail, Calendar, CalendarClock, XCircle, FileText } from "lucide-react";
import Link from "next/link";
import { hireCandidate, rejectApplicant } from "@/app/actions/recruitment";
import { supabase } from "@/lib/supabase";
import EmptyState from "@/components/EmptyState";

interface Experience {
  position?: string;
  company?: string;
  start?: string;
  end?: string;
  current?: boolean;
  description?: string;
}

interface Education {
  school?: string;
  degree?: string;
  field?: string;
  start?: string;
  end?: string;
}

interface ProfileData {
  headline?: string;
  summary?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  skills?: string[];
  experiences?: Experience[];
  educations?: Education[];
  languages?: string[];
  certifications?: string[];
  coverLetter?: string;
  cv_url?: string;
}

interface Applicant {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  applied_at?: string;
  created_at?: string;
  status: string;
  job_id: string;
  resume_url?: string;
}

function parseProfile(resumeUrl?: string): ProfileData {
  if (!resumeUrl) return {};
  try {
    const parsed = JSON.parse(resumeUrl);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed as ProfileData;
  } catch { /* not JSON */ }
  // Legacy: raw URL string (CV overwrote profile data before this fix)
  if (resumeUrl.startsWith("http") || resumeUrl.startsWith("/")) {
    return { cv_url: resumeUrl };
  }
  return {};
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={2} className="pt-3 pb-1 px-3 bg-slate-50 border-y border-slate-200">
        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">{title}</span>
      </td>
    </tr>
  );
}

function ProfileDetail({ app }: { app: Applicant }) {
  const p = parseProfile(app.resume_url);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mt-3 text-[11px]">
      <table className="w-full border-collapse">
        <tbody>

          {/* ── Informasi Pribadi ── */}
          <SectionHeader title="Informasi Pribadi" />
          <tr className="border-b border-slate-100">
            <td className="py-2 px-3 w-36 text-slate-500 font-semibold bg-slate-50/50 align-top">Email</td>
            <td className="py-2 px-3 text-slate-800">{app.email}</td>
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Telepon</td>
            <td className="py-2 px-3 text-slate-800">{app.phone || <span className="text-slate-300">—</span>}</td>
          </tr>
          <tr className="border-b border-slate-100">
            <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Tanggal Lamar</td>
            <td className="py-2 px-3 text-slate-800">
              {new Date((app.applied_at || app.created_at) || new Date()).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </td>
          </tr>
          {p.location && (
            <tr className="border-b border-slate-100">
              <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Lokasi</td>
              <td className="py-2 px-3 text-slate-800">{p.location}</td>
            </tr>
          )}
          {p.headline && (
            <tr className="border-b border-slate-100">
              <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Headline</td>
              <td className="py-2 px-3 text-slate-800 font-medium">{p.headline}</td>
            </tr>
          )}
          {(p.linkedin || p.portfolio) && (
            <tr className="border-b border-slate-100">
              <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Tautan</td>
              <td className="py-2 px-3 space-y-0.5">
                {p.linkedin && <div><span className="text-slate-400">LinkedIn: </span><span className="text-slate-700">{p.linkedin}</span></div>}
                {p.portfolio && <div><span className="text-slate-400">Portfolio: </span><span className="text-slate-700">{p.portfolio}</span></div>}
              </td>
            </tr>
          )}

          {/* ── Pendidikan ── */}
          {!!p.educations?.length && (
            <>
              <SectionHeader title="Pendidikan" />
              <tr className="border-b border-slate-100">
                <td colSpan={2} className="p-0">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase w-1/4">Gelar</th>
                        <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase w-1/3">Jurusan</th>
                        <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase">Institusi</th>
                        <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase">Tahun</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.educations.map((e, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                          <td className="py-2 px-3 text-slate-700 font-semibold">{e.degree || "—"}</td>
                          <td className="py-2 px-3 text-slate-600">{e.field || "—"}</td>
                          <td className="py-2 px-3 text-slate-600">{e.school || "—"}</td>
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{e.start ? `${e.start}${e.end ? `–${e.end}` : ""}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </>
          )}

          {/* ── Pengalaman Kerja ── */}
          {!!p.experiences?.length && (
            <>
              <SectionHeader title="Pengalaman Kerja" />
              <tr className="border-b border-slate-100">
                <td colSpan={2} className="p-0">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase w-1/3">Jabatan</th>
                        <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase w-1/3">Perusahaan</th>
                        <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase">Periode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.experiences.map((e, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                          <td className="py-2 px-3 text-slate-700 font-semibold">{e.position || "—"}</td>
                          <td className="py-2 px-3 text-slate-600">{e.company || "—"}</td>
                          <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{e.start ? `${e.start}–${e.current ? "sekarang" : e.end || ""}` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </td>
              </tr>
            </>
          )}

          {/* ── Keahlian & Bahasa ── */}
          {(!!p.skills?.length || !!p.languages?.length || !!p.certifications?.length) && (
            <>
              <SectionHeader title="Keahlian & Bahasa" />
              {!!p.skills?.length && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Keahlian</td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {p.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">{s}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {!!p.languages?.length && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Bahasa</td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {p.languages.map((l, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">{l}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
              {!!p.certifications?.length && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Sertifikasi</td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {p.certifications.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">{c}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </>
          )}

          {/* ── Ringkasan & Motivasi ── */}
          {(p.summary || p.coverLetter) && (
            <>
              <SectionHeader title="Ringkasan & Motivasi" />
              {p.summary && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Ringkasan</td>
                  <td className="py-2 px-3 text-slate-700 leading-relaxed">{p.summary}</td>
                </tr>
              )}
              {p.coverLetter && (
                <tr className="border-b border-slate-100">
                  <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Motivasi</td>
                  <td className="py-2 px-3 text-slate-700 leading-relaxed whitespace-pre-line">{p.coverLetter}</td>
                </tr>
              )}
            </>
          )}

          {/* ── File CV ── */}
          {p.cv_url && (
            <>
              <SectionHeader title="Dokumen" />
              <tr>
                <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50">File CV</td>
                <td className="py-2 px-3">
                  <a href={p.cv_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#CC0000] border border-red-100 rounded-lg text-[11px] font-bold hover:bg-red-100 transition-colors">
                    <FileText size={12} /> Lihat / Download CV
                  </a>
                </td>
              </tr>
            </>
          )}

        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    Hired:     "bg-emerald-50 text-emerald-700 border-emerald-200",
    Interview: "bg-purple-50  text-purple-700  border-purple-200",
    Rejected:  "bg-red-50     text-red-700     border-red-200",
    Applied:   "bg-amber-50   text-amber-700   border-amber-200",
  };
  const label: Record<string, string> = { Hired: "Direkrut", Interview: "Interview", Rejected: "Ditolak", Applied: "Applied" };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cfg[status] ?? cfg.Applied}`}>
      {label[status] ?? status}
    </span>
  );
}

interface RowProps {
  applicant: Applicant;
  appStatus: string;
  isLoading: boolean;
  isLast: boolean;
  onInterview: () => void;
  onHire: () => void;
  onReject: () => void;
  onUnreject: () => void;
}

function ApplicantRow({ applicant, appStatus, isLoading, isLast, onInterview, onHire, onReject, onUnreject }: RowProps) {
  return (
    <div className={isLast ? "" : "border-b-8 border-slate-100"}>
      {/* Baris header: nama, kontak, tanggal, status, aksi */}
      <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-0 bg-white">
        {/* Nama */}
        <div className="px-4 py-3 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {(applicant.full_name || "?")[0].toUpperCase()}
          </div>
          <p className="text-xs font-bold text-slate-800 truncate">{applicant.full_name}</p>
        </div>

        {/* Kontak */}
        <div className="px-4 py-3 flex flex-col justify-center gap-0.5">
          <span className="text-[11px] text-slate-700">{applicant.email}</span>
          {applicant.phone && <span className="text-[11px] text-slate-400">{applicant.phone}</span>}
        </div>

        {/* Tanggal */}
        <div className="px-4 py-3 flex items-center">
          <span className="text-[11px] text-slate-600">
            {new Date((applicant.applied_at || applicant.created_at) || new Date()).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>

        {/* Status */}
        <div className="px-4 py-3 flex items-center">
          <StatusBadge status={appStatus} />
        </div>

        {/* Aksi */}
        <div className="px-4 py-3 flex items-center gap-1.5 justify-end">
          {appStatus === "Applied" && (
            <>
              <button onClick={onInterview} disabled={isLoading}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                <CalendarClock size={11} />Interview
              </button>
              <button onClick={onReject} disabled={isLoading}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                <XCircle size={11} />Tolak
              </button>
            </>
          )}
          {appStatus === "Interview" && (
            <>
              <button onClick={onHire} disabled={isLoading}
                className="px-3 py-1.5 bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                <UserPlus size={11} />Rekrut
              </button>
              <button onClick={onReject} disabled={isLoading}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                <XCircle size={11} />Tolak
              </button>
            </>
          )}
          {appStatus === "Rejected" && (
            <button onClick={onUnreject} disabled={isLoading}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-colors">
              ↩ Batal
            </button>
          )}
          {appStatus === "Hired" && (
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 size={11} />Selesai
            </span>
          )}
          {isLoading && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />}
        </div>
      </div>

      {/* Detail langsung tampil tanpa toggle */}
      <div className="px-4 pb-4 bg-slate-50/40 border-t border-slate-100">
        <ProfileDetail app={applicant} />
      </div>
    </div>
  );
}

export default function HireForm({ jobPosting }: { jobPosting: Record<string, unknown> }) {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [done, setDone] = useState("");
  const [hiredCred, setHiredCred] = useState<{ email: string; password: string; warning?: string } | null>(null);

  const fetchApplicants = async () => {
    try {
      const { data } = await supabase.from("pelamar")
        .select("*")
        .eq("job_id", jobPosting.id as string)
        .order("applied_at", { ascending: false });
      setApplicants(data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchApplicants(); }, [jobPosting.id]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const updateStatus = async (applicantId: string, status: string) => {
    setActionLoading(applicantId);
    const updates: Record<string, unknown> = { status };
    if (status === "Interview") updates.reached_interview = true;
    const { error } = await supabase.from("pelamar").update(updates).eq("id", applicantId);
    setActionLoading(null);
    if (error) { showToast("Gagal update status."); return; }
    setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status } : a));
    showToast(status === "Interview" ? "Kandidat dijadwalkan interview." : "Status diperbarui.");
  };

  const handleReject = async (applicant: Applicant) => {
    setActionLoading(applicant.id);
    const res = await rejectApplicant(applicant.id, applicant.email || "");
    setActionLoading(null);
    if (res.error) { showToast(res.error); return; }
    setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, status: "Rejected" } : a));
    showToast("Kandidat ditolak. Akun sementara dihapus.");
  };

  const handleHire = async (applicant: Applicant) => {
    setActionLoading(applicant.id);
    const fd = new FormData();
    fd.append("job_posting_id", jobPosting.id as string);
    fd.append("full_name", applicant.full_name as string);
    fd.append("email", (applicant.email || "") as string);
    fd.append("position", jobPosting.position as string);
    fd.append("department", jobPosting.department as string);
    const r = await hireCandidate(fd);
    setActionLoading(null);
    if ("error" in r) { showToast(r.error!); return; }
    setDone(applicant.full_name);
    if ("password" in r && r.password) {
      setHiredCred({ email: (applicant.email || "") as string, password: r.password, warning: r.warning });
    }
    setApplicants(prev => prev.filter(a => a.id !== applicant.id));
    router.refresh();
  };

  const applied = applicants.filter(a => a.status === "Applied" || a.status === "Menunggu Review" || !a.status).length;
  const interviewing = applicants.filter(a => a.status === "Interview").length;

  return (
    <div className="p-6 lg:p-8">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <Link href="/hrd/recruitment" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={16} className="mr-1" /> Kembali ke Lowongan
      </Link>

      <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Rekrut Kandidat</h1>
      <p className="text-sm text-gray-500 mb-6">Review pelamar, jadwalkan interview, lalu tentukan direkrut atau ditolak.</p>

      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-6 space-y-1">
        <p className="text-xs text-sky-600 font-bold">{jobPosting.position as string}</p>
        <p className="text-xs text-sky-500">{jobPosting.department as string} &middot; Kuota: {jobPosting.quantity_filled as number}/{jobPosting.quantity as number}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Pelamar", value: applicants.length, color: "bg-blue-50 text-blue-600", icon: <Mail size={18} /> },
          { label: "Applied", value: applied, color: "bg-amber-50 text-amber-600", icon: <Calendar size={18} /> },
          { label: "Interview", value: interviewing, color: "bg-purple-50 text-purple-600", icon: <CalendarClock size={18} /> },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      {done && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center mb-6">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-4" />
          <p className="text-lg font-bold text-emerald-700">{done} berhasil direkrut!</p>

          {hiredCred?.warning && (
            <div className="mt-4 max-w-md mx-auto p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold text-left">
              {hiredCred.warning}
            </div>
          )}

          {hiredCred && (
            <div className="mt-4 max-w-md mx-auto space-y-2 text-left">
              <div className="border border-emerald-200 bg-white rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
                <p className="text-sm font-mono text-slate-800">{hiredCred.email}</p>
              </div>
              <div className="border border-emerald-200 bg-white rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Password</p>
                <p className="text-lg font-mono font-bold text-slate-800">{hiredCred.password}</p>
              </div>
              <p className="text-[11px] text-slate-500">Email login sudah otomatis terkirim. Kredensial ini bisa diberikan manual kalau perlu.</p>
            </div>
          )}

          <button onClick={() => { setDone(""); setHiredCred(null); }} className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600">Lanjut Rekrut</button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto" /></div>
      ) : applicants.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Belum ada pelamar"
          description="Pelamar akan muncul setelah melamar melalui halaman karir publik."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header tabel */}
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-0 border-b border-slate-200 bg-slate-50">
            <div className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama</div>
            <div className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kontak</div>
            <div className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Lamar</div>
            <div className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
            <div className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</div>
          </div>

          {applicants.map((applicant, idx) => {
            const appStatus = applicant.status === "Menunggu Review" ? "Applied" : (applicant.status || "Applied");
            const isLoading = actionLoading === applicant.id;
            return (
              <ApplicantRow
                key={applicant.id}
                applicant={applicant}
                appStatus={appStatus}
                isLoading={isLoading}
                isLast={idx === applicants.length - 1}
                onInterview={() => updateStatus(applicant.id, "Interview")}
                onHire={() => handleHire(applicant)}
                onReject={() => handleReject(applicant)}
                onUnreject={() => updateStatus(applicant.id, "Applied")}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
