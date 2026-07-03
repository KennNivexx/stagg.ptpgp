"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  getApplicationsForPipeline, moveApplicationStatus,
  hireCandidateFromPipeline, rejectApplicant, addToTalentPool,
} from "@/app/actions/recruitment";
import {
  Users, Mail, Phone, Calendar, CalendarClock, UserPlus, XCircle,
  Star, CheckCircle2, AlertTriangle, X, FileText, Search, ClipboardList,
} from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

// ── Profile types ─────────────────────────────────────────────────────────────

interface Experience { position?: string; company?: string; start?: string; end?: string; current?: boolean; }
interface Education { school?: string; degree?: string; field?: string; start?: string; end?: string; current?: boolean; }
interface ProfileData {
  headline?: string; summary?: string; location?: string; linkedin?: string;
  portfolio?: string; coverLetter?: string; cv_url?: string;
  skills?: string[]; experiences?: Experience[]; educations?: Education[];
  languages?: string[]; certifications?: string[];
}

function parseProfile(raw?: unknown): ProfileData {
  if (!raw) return {};
  const str = typeof raw === "string" ? raw : JSON.stringify(raw);
  if (str.startsWith("http")) return { cv_url: str };
  try { return JSON.parse(str) as ProfileData; } catch { return {}; }
}

// ── ProfileDetail ─────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={2} className="pt-3 pb-1 px-3 bg-slate-50 border-y border-slate-200">
        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">{title}</span>
      </td>
    </tr>
  );
}

function ProfileDetail({ app }: { app: Record<string, unknown> }) {
  const p = parseProfile(app.resume_url);
  const hasEdu = (p.educations?.length ?? 0) > 0;
  const hasExp = (p.experiences?.length ?? 0) > 0;
  const hasSkill = (p.skills?.length ?? 0) > 0 || (p.languages?.length ?? 0) > 0 || (p.certifications?.length ?? 0) > 0;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mt-2 text-[11px]">
      <table className="w-full border-collapse">
        <tbody>
          <SectionHeader title="Informasi Pribadi" />
          {p.headline && <tr className="border-b border-slate-100"><td className="py-2 px-3 w-36 text-slate-500 font-semibold bg-slate-50/50 align-top">Headline</td><td className="py-2 px-3 text-slate-800 font-medium">{p.headline}</td></tr>}
          {p.location && <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Lokasi</td><td className="py-2 px-3 text-slate-700">{p.location}</td></tr>}
          {p.linkedin && <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">LinkedIn</td><td className="py-2 px-3 text-slate-700">{p.linkedin}</td></tr>}
          {!p.headline && !p.location && !p.linkedin && (
            <tr className="border-b border-slate-100"><td colSpan={2} className="py-2 px-3 text-slate-400 italic">Tidak ada data profil tambahan</td></tr>
          )}

          {hasEdu && <>
            <SectionHeader title="Pendidikan" />
            <tr className="border-b border-slate-100"><td colSpan={2} className="p-0">
              <table className="w-full border-collapse"><thead><tr className="bg-slate-50/80">
                <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase w-1/4">Gelar</th>
                <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase w-1/3">Jurusan</th>
                <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase">Institusi</th>
                <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase">Tahun</th>
              </tr></thead><tbody>
                {p.educations!.map((e, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                    <td className="py-2 px-3 text-slate-700 font-semibold">{e.degree || "—"}</td>
                    <td className="py-2 px-3 text-slate-600">{e.field || "—"}</td>
                    <td className="py-2 px-3 text-slate-600">{e.school || "—"}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{e.start || "?"} – {e.current ? "Sekarang" : e.end || "?"}</td>
                  </tr>
                ))}
              </tbody></table>
            </td></tr>
          </>}

          {hasExp && <>
            <SectionHeader title="Pengalaman Kerja" />
            <tr className="border-b border-slate-100"><td colSpan={2} className="p-0">
              <table className="w-full border-collapse"><thead><tr className="bg-slate-50/80">
                <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase w-1/3">Jabatan</th>
                <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase w-1/3">Perusahaan</th>
                <th className="py-1.5 px-3 text-left text-[9px] font-bold text-slate-400 uppercase">Periode</th>
              </tr></thead><tbody>
                {p.experiences!.map((e, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                    <td className="py-2 px-3 text-slate-700 font-semibold">{e.position || "—"}</td>
                    <td className="py-2 px-3 text-slate-600">{e.company || "—"}</td>
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{e.start || "?"} – {e.current ? "Sekarang" : e.end || "?"}</td>
                  </tr>
                ))}
              </tbody></table>
            </td></tr>
          </>}

          {hasSkill && <>
            <SectionHeader title="Keahlian & Bahasa" />
            {!!p.skills?.length && (
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Keahlian</td>
                <td className="py-2 px-3"><div className="flex flex-wrap gap-1">
                  {p.skills.map((s, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">{s}</span>)}
                </div></td>
              </tr>
            )}
            {!!p.languages?.length && (
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Bahasa</td>
                <td className="py-2 px-3"><div className="flex flex-wrap gap-1">
                  {p.languages.map((l, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">{l}</span>)}
                </div></td>
              </tr>
            )}
            {!!p.certifications?.length && (
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Sertifikasi</td>
                <td className="py-2 px-3"><div className="flex flex-wrap gap-1">
                  {p.certifications.map((c, i) => <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">{c}</span>)}
                </div></td>
              </tr>
            )}
          </>}

          {(p.summary || p.coverLetter) && <>
            <SectionHeader title="Ringkasan & Motivasi" />
            {p.summary && <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Ringkasan</td><td className="py-2 px-3 text-slate-700 leading-relaxed whitespace-pre-wrap">{p.summary}</td></tr>}
            {p.coverLetter && <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Motivasi</td><td className="py-2 px-3 text-slate-700 leading-relaxed whitespace-pre-wrap">{p.coverLetter}</td></tr>}
          </>}

          {p.cv_url && <>
            <SectionHeader title="Dokumen" />
            <tr>
              <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50">CV / Resume</td>
              <td className="py-2 px-3">
                <a href={p.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#CC0000] border border-red-100 rounded-lg text-[11px] font-bold hover:bg-red-100 transition-colors">
                  <FileText size={12} /> Lihat / Download CV
                </a>
              </td>
            </tr>
          </>}
        </tbody>
      </table>
    </div>
  );
}

// ── Test results ──────────────────────────────────────────────────────────────

function TestResults({ app }: { app: Record<string, unknown> }) {
  const tulis = app.test_tulis_result as Record<string, unknown> | null;
  const psikotes = app.test_psikotes_result as Record<string, unknown> | null;

  if (!tulis && !psikotes) {
    if (app.status !== "Tes Tulis & Psikotes") return null;
    return (
      <div className="border border-amber-200 bg-amber-50 rounded-xl mt-2 px-3 py-2.5 text-[11px] text-amber-700 font-semibold flex items-center gap-2">
        <AlertTriangle size={12} /> Kandidat belum mengerjakan tes. Hasil akan muncul di sini setelah dikerjakan.
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mt-2 text-[11px]">
      <table className="w-full border-collapse">
        <tbody>
          <SectionHeader title="Hasil Tes" />
          {tulis && (
            <tr className="border-b border-slate-100">
              <td className="py-2 px-3 w-36 text-slate-500 font-semibold bg-slate-50/50 align-top">Tes Tulis</td>
              <td className="py-2 px-3 text-slate-700 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${(tulis.passed as boolean) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {(tulis.passed as boolean) ? "Lulus" : "Tidak Lulus"}
                </span>
                <span className="font-bold text-slate-800">{tulis.score as number}%</span>
                <span className="text-slate-400 text-[10px]">({tulis.test_title as string})</span>
              </td>
            </tr>
          )}
          {psikotes && (() => {
            const dims = psikotes.dimensions as Record<string, number> | undefined;
            return (
              <tr className="border-b border-slate-100">
                <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Psikotes</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">Overall: {psikotes.overall as number}%</span>
                    {dims && Object.entries(dims).map(([dim, val]) => (
                      <span key={dim} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-semibold border border-slate-200">
                        {dim}: {val}%
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </div>
  );
}

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGES = [
  { key: "Menunggu Review", label: "Menunggu Review", chip: "bg-amber-50 text-amber-700 border-amber-200", tab: "border-amber-400" },
  { key: "Tes Tulis & Psikotes", label: "Tes Tulis & Psikotes", chip: "bg-purple-50 text-purple-700 border-purple-200", tab: "border-purple-400" },
  { key: "Interview", label: "Interview", chip: "bg-blue-50 text-blue-700 border-blue-200", tab: "border-blue-400" },
  { key: "Diterima", label: "Diterima", chip: "bg-emerald-50 text-emerald-700 border-emerald-200", tab: "border-emerald-400" },
  { key: "Ditolak", label: "Ditolak", chip: "bg-red-50 text-red-700 border-red-200", tab: "border-red-400" },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PipelineKandidat() {
  const [apps, setApps] = useState<Record<string, unknown>[]>([]);
  const [jobs, setJobs] = useState<Record<string, { position: string; department: string }>>({});
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState("Menunggu Review");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [talentDialog, setTalentDialog] = useState<Record<string, unknown> | null>(null);
  const [hiredCred, setHiredCred] = useState<{ name: string; email: string; password: string; warning?: string } | null>(null);
  const [talentNotes, setTalentNotes] = useState("");
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const [jobFilter, setJobFilter] = useState(() => searchParams.get("job") || "");

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getApplicationsForPipeline().then(({ apps: a, jobs: j }) => {
      setApps(a as Record<string, unknown>[]);
      setJobs(j);
      setLoading(false);
    });
  }, []);

  // Apply job/search filters (but not stage) so tab counts stay in sync with
  // what the candidate list below actually shows for each stage.
  const visibleApps = useMemo(() => {
    return apps.filter(a => {
      if (jobFilter && a.job_id !== jobFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const name = ((a.full_name as string) || "").toLowerCase();
        const email = ((a.email as string) || "").toLowerCase();
        if (!name.includes(s) && !email.includes(s)) return false;
      }
      return true;
    });
  }, [apps, jobFilter, search]);

  const counts: Record<string, number> = {};
  STAGES.forEach(s => { counts[s.key] = visibleApps.filter(a => a.status === s.key).length; });

  const filtered = useMemo(() => {
    return visibleApps.filter(a => a.status === activeStage);
  }, [visibleApps, activeStage]);

  const jobOptions = useMemo(() => {
    return Object.entries(jobs)
      .map(([id, j]) => ({ id, label: `${j.position} · ${j.department}` }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [jobs]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleAdvanceToTest = async (app: Record<string, unknown>) => {
    setActionLoading(app.id as string);
    const res = await moveApplicationStatus(app.id as string, "Tes Tulis & Psikotes");
    if ("error" in res) { showToast("err", res.error!); }
    else {
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "Tes Tulis & Psikotes" } : a));
      showToast("ok", "Kandidat maju ke tahap Tes Tulis & Psikotes. Tes akan otomatis terbuka di akun pelamar.");
    }
    setActionLoading(null);
  };

  const handleInterview = async (app: Record<string, unknown>) => {
    setActionLoading(app.id as string);
    const res = await moveApplicationStatus(app.id as string, "Interview");
    if ("error" in res) { showToast("err", res.error!); }
    else { setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "Interview", reached_interview: true } : a)); }
    setActionLoading(null);
  };

  const handleReject = async (app: Record<string, unknown>) => {
    setActionLoading(app.id as string);
    const res = await rejectApplicant(app.id as string, app.email as string);
    if ("error" in res) { showToast("err", res.error!); }
    else { setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "Ditolak" } : a)); }
    setActionLoading(null);
  };

  const handleHire = async (app: Record<string, unknown>) => {
    if (!confirm(`Rekrut ${app.full_name as string} sebagai karyawan? Email login akan dikirim otomatis.`)) return;
    setActionLoading(app.id as string);
    const res = await hireCandidateFromPipeline(app.id as string);
    if ("error" in res) { showToast("err", res.error!); }
    else {
      setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: "Diterima" } : a));
      showToast("ok", `${app.full_name as string} berhasil direkrut!`);
      if (res.password) {
        setHiredCred({ name: app.full_name as string, email: app.email as string, password: res.password, warning: res.warning });
      }
    }
    setActionLoading(null);
  };

  const handleTalentPool = async () => {
    if (!talentDialog) return;
    setActionLoading(talentDialog.id as string);
    const res = await addToTalentPool(talentDialog.id as string, talentNotes);
    if ("error" in res) { showToast("err", res.error!); }
    else {
      setApps(prev => prev.map(a => a.id === talentDialog.id ? { ...a, in_talent_pool: true } : a));
      showToast("ok", "Disimpan ke Talent Pool.");
    }
    setTalentDialog(null);
    setTalentNotes("");
    setActionLoading(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "err" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "err" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      {/* Talent Pool dialog */}
      {talentDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800">Simpan ke Talent Pool</h3>
                <p className="text-xs text-slate-500 mt-0.5">{talentDialog.full_name as string}</p>
              </div>
              <button onClick={() => { setTalentDialog(null); setTalentNotes(""); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan (opsional)</label>
              <textarea
                value={talentNotes}
                onChange={e => setTalentNotes(e.target.value)}
                placeholder="Misal: Kandidat potensial untuk posisi marketing di masa depan..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setTalentDialog(null); setTalentNotes(""); }}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleTalentPool}
                disabled={!!actionLoading}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Star size={14} /> Simpan ke Talent Pool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kredensial karyawan baru */}
      {hiredCred && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Karyawan Berhasil Dibuat</h3>
                <p className="text-xs text-slate-500 mt-0.5">{hiredCred.name}</p>
              </div>
              <button onClick={() => setHiredCred(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={16} />
              </button>
            </div>

            {hiredCred.warning && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {hiredCred.warning}
              </div>
            )}

            <p className="text-xs text-slate-500 mb-3">
              Email login sudah otomatis dikirim ke karyawan. Kalau perlu, kredensial berikut juga bisa diberikan manual:
            </p>

            <div className="space-y-2 mb-4">
              <div className="border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Email</p>
                <p className="text-sm font-mono text-slate-800">{hiredCred.email}</p>
              </div>
              <div className="border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Password</p>
                <p className="text-lg font-mono font-bold text-slate-800">{hiredCred.password}</p>
              </div>
            </div>

            <button
              onClick={() => setHiredCred(null)}
              className="w-full px-4 py-2 bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-xl text-sm font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Pipeline Kandidat</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola keputusan rekrutmen — pindahkan kandidat antar tahap dari sini.</p>
      </div>

      {/* Stage tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {STAGES.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveStage(s.key)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              activeStage === s.key
                ? `bg-white shadow-md ${s.tab} border-2`
                : "bg-white border-slate-100 shadow-sm hover:shadow-md"
            }`}
          >
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{s.label}</p>
            <p className={`text-2xl font-extrabold ${activeStage === s.key ? "text-slate-800" : "text-slate-500"}`}>
              {counts[s.key] || 0}
            </p>
          </button>
        ))}
      </div>

      {/* Search + filter (dari Data Pelamar) */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama atau email pelamar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30"
          />
        </div>
        <select
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30"
        >
          <option value="">Semua Lowongan</option>
          {jobOptions.map((j) => (
            <option key={j.id} value={j.id}>{j.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Tidak ada kandidat dalam tahap ini." />
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const job = jobs[app.job_id as string];
            const isLoading = actionLoading === (app.id as string);
            const canTalentPool = app.status === "Ditolak" && !!app.reached_interview && !app.in_talent_pool;

            return (
              <div key={app.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-[2fr_2fr_1.5fr_auto] gap-0 border-b border-slate-100">
                  {/* Nama */}
                  <div className="px-5 py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {(app.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{app.full_name as string}</p>
                      <p className="text-[10px] text-slate-400">{job?.position || "-"} · {job?.department || "-"}</p>
                    </div>
                  </div>

                  {/* Kontak */}
                  <div className="px-5 py-3 flex flex-col justify-center gap-0.5">
                    <p className="text-[11px] text-slate-600 flex items-center gap-1"><Mail size={10} /> {app.email as string}</p>
                    {!!app.phone && <p className="text-[11px] text-slate-400 flex items-center gap-1"><Phone size={10} /> {app.phone as string}</p>}
                  </div>

                  {/* Tanggal */}
                  <div className="px-5 py-3 flex items-center">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar size={10} />
                      {app.applied_at ? new Date(app.applied_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </p>
                  </div>

                  {/* Aksi */}
                  <div className="px-5 py-3 flex items-center gap-2">
                    {app.status === "Menunggu Review" && (
                      <>
                        <button onClick={() => handleAdvanceToTest(app)} disabled={isLoading}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          <ClipboardList size={11} /> Tes Tulis & Psikotes
                        </button>
                        <button onClick={() => handleReject(app)} disabled={isLoading}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          <XCircle size={11} /> Tolak
                        </button>
                      </>
                    )}
                    {app.status === "Tes Tulis & Psikotes" && (
                      <>
                        <button onClick={() => handleInterview(app)} disabled={isLoading}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          <CalendarClock size={11} /> Lanjut Interview
                        </button>
                        <button onClick={() => handleReject(app)} disabled={isLoading}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          <XCircle size={11} /> Tolak
                        </button>
                      </>
                    )}
                    {app.status === "Interview" && (
                      <>
                        <button onClick={() => handleHire(app)} disabled={isLoading}
                          className="px-3 py-1.5 bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          <UserPlus size={11} /> Rekrut
                        </button>
                        <button onClick={() => handleReject(app)} disabled={isLoading}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                          <XCircle size={11} /> Tolak
                        </button>
                      </>
                    )}
                    {app.status === "Diterima" && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 size={11} /> Sudah Direkrut
                      </span>
                    )}
                    {canTalentPool && (
                      <button onClick={() => { setTalentDialog(app); setTalentNotes(""); }} disabled={isLoading}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                        <Star size={11} /> Talent Pool
                      </button>
                    )}
                    {!!app.in_talent_pool && app.status === "Ditolak" && (
                      <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        <Star size={11} /> Di Talent Pool
                      </span>
                    )}
                    {!!app.job_id && (
                      <Link href={`/hrd/recruitment/${app.job_id as string}/applicants/${app.id as string}`}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors" title="Lihat detail">
                        <FileText size={14} />
                      </Link>
                    )}
                    {isLoading && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />}
                  </div>
                </div>

                {/* Profile + Tests */}
                <div className="px-5 pb-4 bg-slate-50/40">
                  <ProfileDetail app={app} />
                  <TestResults app={app} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
