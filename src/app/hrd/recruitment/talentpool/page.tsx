"use client";

import { useState, useEffect } from "react";
import { getTalentPool, removeFromTalentPool } from "@/app/actions/recruitment";
import { Star, Search, X, FileText, Mail, Phone, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
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

// ── Popup detail ──────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={2} className="pt-3 pb-1 px-3 bg-slate-50 border-y border-slate-200">
        <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">{title}</span>
      </td>
    </tr>
  );
}

function TalentPopup({ app, onClose }: { app: Record<string, unknown>; onClose: () => void }) {
  const p = parseProfile(app.resume_url);
  const job = app.job as Record<string, string> | null;
  const tulis = app.test_tulis_result as Record<string, unknown> | null;
  const psikotes = app.test_psikotes_result as Record<string, unknown> | null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 border-b border-slate-100">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {(app.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-extrabold text-slate-800">{app.full_name as string}</h2>
            <p className="text-sm text-slate-500">{job?.position || "-"} · {job?.department || "-"}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={11} /> {app.email as string}</span>
              {!!app.phone && <span className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} /> {app.phone as string}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Talent pool notes */}
          {!!app.talent_pool_notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-700 mb-1 flex items-center gap-1"><Star size={11} /> Catatan Talent Pool</p>
              <p className="text-sm text-amber-800">{app.talent_pool_notes as string}</p>
            </div>
          )}

          {/* Full profile table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
            <table className="w-full border-collapse">
              <tbody>
                <SectionHeader title="Informasi Pribadi" />
                {p.headline && <tr className="border-b border-slate-100"><td className="py-2 px-3 w-36 text-slate-500 font-semibold bg-slate-50/50 align-top">Headline</td><td className="py-2 px-3 text-slate-800 font-medium">{p.headline}</td></tr>}
                {p.location && <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Lokasi</td><td className="py-2 px-3 text-slate-700">{p.location}</td></tr>}
                {p.linkedin && <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">LinkedIn</td><td className="py-2 px-3 text-slate-700">{p.linkedin}</td></tr>}
                {p.portfolio && <tr className="border-b border-slate-100"><td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Portfolio</td><td className="py-2 px-3 text-slate-700">{p.portfolio}</td></tr>}
                {!p.headline && !p.location && !p.linkedin && !p.portfolio && (
                  <tr className="border-b border-slate-100"><td colSpan={2} className="py-2 px-3 text-slate-400 italic">Tidak ada data profil</td></tr>
                )}

                {(p.educations?.length ?? 0) > 0 && <>
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

                {(p.experiences?.length ?? 0) > 0 && <>
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

                {((p.skills?.length ?? 0) > 0 || (p.languages?.length ?? 0) > 0 || (p.certifications?.length ?? 0) > 0) && <>
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
                    <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50">CV</td>
                    <td className="py-2 px-3">
                      <a href={p.cv_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#CC0000] border border-red-100 rounded-lg text-[11px] font-bold hover:bg-red-100 transition-colors">
                        <FileText size={12} /> Lihat / Download CV
                      </a>
                    </td>
                  </tr>
                </>}

                {(tulis || psikotes) && <>
                  <SectionHeader title="Hasil Tes Rekrutmen" />
                  {tulis && (
                    <tr className="border-b border-slate-100">
                      <td className="py-2 px-3 w-36 text-slate-500 font-semibold bg-slate-50/50 align-top">Tes Tulis</td>
                      <td className="py-2 px-3 flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${(tulis.passed as boolean) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {(tulis.passed as boolean) ? "Lulus" : "Tidak Lulus"}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{tulis.score as number}%</span>
                        <span className="text-slate-400 text-[10px]">{tulis.test_title as string}</span>
                      </td>
                    </tr>
                  )}
                  {psikotes && (() => {
                    const dims = psikotes.dimensions as Record<string, number> | undefined;
                    return (
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3 text-slate-500 font-semibold bg-slate-50/50 align-top">Psikotes</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="font-bold text-slate-800 text-xs">Overall: {psikotes.overall as number}%</span>
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
                </>}
              </tbody>
            </table>
          </div>

          {/* Added date */}
          {!!app.talent_pool_added_at && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Star size={10} className="text-amber-400" />
              Ditambahkan ke Talent Pool: {new Date(app.talent_pool_added_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TalentPoolPage() {
  const [talents, setTalents] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getTalentPool().then(data => {
      setTalents(data as Record<string, unknown>[]);
      setLoading(false);
    });
  }, []);

  const filtered = talents.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    const profile = parseProfile(t.resume_url);
    const skillMatch = profile.skills?.some(s => s.toLowerCase().includes(q)) || false;
    return (
      (t.full_name as string)?.toLowerCase().includes(q) ||
      (t.email as string)?.toLowerCase().includes(q) ||
      skillMatch
    );
  });

  const handleRemove = async (id: string) => {
    if (!confirm("Hapus dari Talent Pool?")) return;
    setRemoving(id);
    const res = await removeFromTalentPool(id);
    if ("error" in res) { showToast("err", res.error!); }
    else { setTalents(prev => prev.filter(t => t.id !== id)); showToast("ok", "Dihapus dari Talent Pool."); }
    setRemoving(null);
  };

  const getSkillChips = (app: Record<string, unknown>) => {
    const p = parseProfile(app.resume_url);
    return p.skills?.slice(0, 4) || [];
  };

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

      {/* Popup */}
      {selected && <TalentPopup app={selected} onClose={() => setSelected(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Talent Pool</h1>
        <p className="text-sm text-gray-500 mt-1">
          Arsip kandidat berkualitas untuk kebutuhan rekrutmen di masa depan.
        </p>
      </div>

      {/* Penjelasan tujuan halaman */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0"><Star size={16} /></div>
        <div className="text-xs text-amber-800 leading-relaxed">
          <p className="font-bold mb-1">Apa itu Talent Pool?</p>
          <p>
            Talent Pool berisi kandidat yang <strong>sudah melewati tahap interview</strong> namun belum cocok untuk
            posisi yang dilamar saat itu (misalnya kuota sudah terisi, atau lebih cocok di posisi lain). Kandidat di sini
            tersimpan bersama data profil dan hasil tes rekrutmennya, sehingga sewaktu-waktu ada lowongan baru yang
            sesuai, HRD bisa langsung menghubungi mereka tanpa perlu proses lamaran dari awal.
          </p>
          <p className="mt-1.5">
            <strong>Aksi yang tersedia:</strong> klik kartu kandidat untuk melihat profil &amp; hasil tes lengkap,
            atau tekan &quot;Hapus&quot; jika kandidat tidak lagi relevan untuk disimpan.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Star size={18} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Talent Pool</p>
            <p className="text-xl font-extrabold text-slate-800">{talents.length}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl"><Users size={18} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Hasil Pencarian</p>
            <p className="text-xl font-extrabold text-slate-800">{filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau keahlian..."
          className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs w-full focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={12} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Star}
          title={search ? "Tidak ada kandidat yang sesuai pencarian." : "Talent Pool masih kosong."}
          description={!search ? "Kandidat yang ditolak setelah tahap Interview dapat disimpan ke sini dari halaman Pipeline." : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(t => {
            const job = t.job as Record<string, string> | null;
            const skills = getSkillChips(t);
            const hasTes = !!(t.test_tulis_result || t.test_psikotes_result);

            return (
              <div
                key={t.id as string}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelected(t)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {(t.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-800 group-hover:text-amber-700 transition-colors">{t.full_name as string}</h3>
                      <p className="text-[10px] text-slate-500">{job?.position || "-"} · {job?.department || "-"}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Mail size={9} /> {t.email as string}</p>
                    </div>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[9px] font-semibold">{s}</span>
                      ))}
                    </div>
                  )}

                  {!!t.talent_pool_notes && (
                    <p className="text-[10px] text-slate-500 bg-amber-50 rounded-lg p-2 mb-3 line-clamp-2">{t.talent_pool_notes as string}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      {hasTes && (
                        <span className="text-[9px] text-indigo-600 font-bold flex items-center gap-0.5">
                          ✓ Ada data tes
                        </span>
                      )}
                      {!!t.talent_pool_added_at && (
                        <span className="text-[9px] text-slate-400">
                          {new Date(t.talent_pool_added_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(t.id as string); }}
                      disabled={removing === (t.id as string)}
                      className="text-[9px] text-slate-300 hover:text-red-500 transition-colors flex items-center gap-0.5 disabled:opacity-50"
                    >
                      <X size={10} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
