"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getDriverCandidatePipeline, setPenunjukanFlag, setDrivingTest,
  setHazmatThirdPartyTest, setJobPostingDriverFlags,
} from "@/app/actions/recruitment-hiring";
import {
  moveApplicationStatus, hireCandidateFromPipeline, rejectApplicant,
} from "@/app/actions/recruitment";
import {
  Truck, AlertTriangle, CheckCircle2, X, UserPlus, XCircle, CalendarClock,
  ClipboardList, ShieldAlert, Award, ExternalLink, Mail, Phone,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";

type JobRow = { id: string; position: string; department: string; is_driver_position: boolean | null; is_hazmat_waste_transport: boolean | null };
type App = Record<string, unknown>;

const STAGES = [
  { key: "Menunggu Review", label: "Menunggu Review" },
  { key: "Tes Tulis & Psikotes", label: "Tes Tulis & Psikotes" },
  { key: "Interview", label: "Interview" },
  { key: "Tes Mengemudi", label: "Tes Mengemudi" },
  { key: "Diterima", label: "Diterima" },
  { key: "Ditolak", label: "Ditolak" },
];

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${className}`}>{children}</span>;
}

function DrivingTestPanel({ app, onChanged }: { app: App; onChanged: () => void }) {
  const [evaluators, setEvaluators] = useState((app.driving_test_evaluators as string) || "");
  const [notes, setNotes] = useState((app.driving_test_notes as string) || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (status: "Proses" | "Lulus" | "Tidak Lulus") => {
    setBusy(true); setMsg("");
    const res = await setDrivingTest(app.id as string, status, evaluators, notes);
    setBusy(false);
    if ("error" in res) { setMsg(res.error); return; }
    onChanged();
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3 space-y-2 text-[11px]">
      <p className="font-bold text-slate-600 flex items-center gap-1.5"><Award size={12} /> Tes Mengemudi / Kompetensi (QC & Pengemudi Senior)</p>
      {msg && <div className="px-2 py-1 bg-red-50 text-red-700 rounded-lg font-semibold">{msg}</div>}
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Status:</span>
        <Badge className={
          app.driving_test_status === "Lulus" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : app.driving_test_status === "Tidak Lulus" ? "bg-red-50 text-red-700 border-red-200"
          : "bg-slate-50 text-slate-500 border-slate-200"
        }>{(app.driving_test_status as string) || "Belum Dilakukan"}</Badge>
      </div>
      <input value={evaluators} onChange={e => setEvaluators(e.target.value)} placeholder="Nama evaluator QC & pengemudi senior"
        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan hasil tes (opsional)" rows={2}
        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20" />
      <div className="flex gap-1.5">
        <button disabled={busy} onClick={() => submit("Lulus")} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold disabled:opacity-50">Lulus</button>
        <button disabled={busy} onClick={() => submit("Tidak Lulus")} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold disabled:opacity-50">Tidak Lulus</button>
        <button disabled={busy} onClick={() => submit("Proses")} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold disabled:opacity-50">Proses</button>
      </div>
    </div>
  );
}

function HazmatTestPanel({ app, onChanged }: { app: App; onChanged: () => void }) {
  const [pihakKetiga, setPihakKetiga] = useState((app.hazmat_test_pihak_ketiga as string) || "");
  const [notes, setNotes] = useState((app.hazmat_test_notes as string) || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (status: "Proses" | "Lulus" | "Tidak Lulus") => {
    setBusy(true); setMsg("");
    const res = await setHazmatThirdPartyTest(app.id as string, status, pihakKetiga, notes);
    setBusy(false);
    if ("error" in res) { setMsg(res.error); return; }
    onChanged();
  };

  return (
    <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-3 space-y-2 text-[11px]">
      <p className="font-bold text-amber-700 flex items-center gap-1.5"><ShieldAlert size={12} /> Tes Kompetensi Pihak Ketiga (Wajib — Angkutan Bahan/Limbah Berbahaya)</p>
      {msg && <div className="px-2 py-1 bg-red-50 text-red-700 rounded-lg font-semibold">{msg}</div>}
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Status:</span>
        <Badge className={
          app.hazmat_test_status === "Lulus" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : app.hazmat_test_status === "Tidak Lulus" ? "bg-red-50 text-red-700 border-red-200"
          : "bg-slate-50 text-slate-500 border-slate-200"
        }>{(app.hazmat_test_status as string) || "Belum Dilakukan"}</Badge>
      </div>
      <input value={pihakKetiga} onChange={e => setPihakKetiga(e.target.value)} placeholder="Nama pihak ketiga penguji"
        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-2 focus:ring-amber-300" />
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan hasil tes (opsional)" rows={2}
        className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" />
      <div className="flex gap-1.5">
        <button disabled={busy} onClick={() => submit("Lulus")} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold disabled:opacity-50">Lulus</button>
        <button disabled={busy} onClick={() => submit("Tidak Lulus")} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-bold disabled:opacity-50">Tidak Lulus</button>
        <button disabled={busy} onClick={() => submit("Proses")} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold disabled:opacity-50">Proses</button>
      </div>
    </div>
  );
}

export default function DriverRecruitmentPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [jobs, setJobs] = useState<Record<string, JobRow>>({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeStage, setActiveStage] = useState("Menunggu Review");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const load = async () => {
    const res = await getDriverCandidatePipeline();
    if ("error" in res && res.error) {
      setErrorMsg(res.error as string);
      setLoading(false);
      return;
    }
    setApps((res.apps as App[]) || []);
    setJobs((res.jobs as Record<string, JobRow>) || {});
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts: Record<string, number> = {};
  STAGES.forEach(s => { counts[s.key] = apps.filter(a => a.status === s.key).length; });
  const filtered = useMemo(() => apps.filter(a => a.status === activeStage), [apps, activeStage]);

  const runAction = async (id: string, fn: () => Promise<{ error?: string } | { success: true }>, okMsg?: string) => {
    setBusyId(id);
    const res = await fn();
    setBusyId(null);
    if (res && "error" in res && res.error) { showToast("err", res.error); return; }
    if (okMsg) showToast("ok", okMsg);
    await load();
  };

  if (errorMsg) {
    return (
      <div className="p-6 lg:p-8">
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-semibold flex items-center gap-3">
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "err" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "err" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] flex items-center gap-2"><Truck size={22} className="text-[#CC0000]" /> Rekrutmen Pengemudi & Operator</h1>
          <p className="text-sm text-gray-500 mt-1">PR-SDM-02 — pipeline khusus supir/operator alat berat, termasuk jalur penunjukan, tes mengemudi, dan tes kompetensi pihak ketiga untuk angkutan B3/limbah.</p>
        </div>
        <Link href="/hrd/workforce/driver-monitoring" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 whitespace-nowrap">
          <ExternalLink size={13} /> Monitoring Kinerja Pengemudi
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAGES.map(s => (
          <button key={s.key} onClick={() => setActiveStage(s.key)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all ${activeStage === s.key ? "bg-white shadow-md border-[#CC0000]/40" : "bg-white border-slate-100 shadow-sm hover:shadow-md"}`}>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{s.label}</p>
            <p className={`text-xl font-extrabold ${activeStage === s.key ? "text-slate-800" : "text-slate-500"}`}>{counts[s.key] || 0}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="Tidak ada kandidat pengemudi/operator dalam tahap ini." description="Kandidat akan muncul di sini otomatis jika lowongan ditandai sebagai posisi pengemudi/operator, atau posisi mengandung kata supir/sopir/driver/operator." />
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const job = jobs[app.job_id as string];
            const isBusy = busyId === (app.id as string);
            const isPenunjukan = !!app.is_penunjukan;
            const isHazmat = !!job?.is_hazmat_waste_transport;
            const hazmatOk = !isHazmat || app.hazmat_test_status === "Lulus";
            const drivingOk = app.driving_test_status === "Lulus";

            return (
              <div key={app.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                      {app.full_name as string}
                      {isPenunjukan && <Badge className="bg-violet-50 text-violet-700 border-violet-200">Penunjukan</Badge>}
                      {isHazmat && <Badge className="bg-amber-50 text-amber-700 border-amber-200">B3/Limbah</Badge>}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{job?.position || "-"} · {job?.department || "-"}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><Mail size={10} /> {app.email as string}</span>
                      {!!app.phone && <span className="flex items-center gap-1"><Phone size={10} /> {app.phone as string}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {app.status !== "Diterima" && app.status !== "Ditolak" && (
                      <button
                        onClick={() => runAction(app.id as string, () => setPenunjukanFlag(app.id as string, !isPenunjukan))}
                        disabled={isBusy}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors disabled:opacity-50 ${isPenunjukan ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"}`}
                      >
                        {isPenunjukan ? "Batalkan Penunjukan" : "Tandai Penunjukan"}
                      </button>
                    )}

                    {app.status === "Menunggu Review" && (
                      <>
                        {!isPenunjukan && (
                          <button onClick={() => runAction(app.id as string, () => moveApplicationStatus(app.id as string, "Tes Tulis & Psikotes"))} disabled={isBusy}
                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                            <ClipboardList size={11} /> Tes Tulis & Psikotes
                          </button>
                        )}
                        <button onClick={() => runAction(app.id as string, () => moveApplicationStatus(app.id as string, "Tes Mengemudi"))} disabled={isBusy}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <Award size={11} /> {isPenunjukan ? "Langsung Tes Mengemudi" : "Lewati ke Tes Mengemudi"}
                        </button>
                        <button onClick={() => runAction(app.id as string, () => rejectApplicant(app.id as string, app.email as string))} disabled={isBusy}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <XCircle size={11} /> Tolak
                        </button>
                      </>
                    )}
                    {app.status === "Tes Tulis & Psikotes" && (
                      <>
                        <button onClick={() => runAction(app.id as string, () => moveApplicationStatus(app.id as string, "Interview"))} disabled={isBusy}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <CalendarClock size={11} /> Lanjut Interview
                        </button>
                        <button onClick={() => runAction(app.id as string, () => rejectApplicant(app.id as string, app.email as string))} disabled={isBusy}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <XCircle size={11} /> Tolak
                        </button>
                      </>
                    )}
                    {app.status === "Interview" && (
                      <>
                        <button onClick={() => runAction(app.id as string, () => moveApplicationStatus(app.id as string, "Tes Mengemudi"))} disabled={isBusy}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <Award size={11} /> Lanjut Tes Mengemudi
                        </button>
                        <button onClick={() => runAction(app.id as string, () => rejectApplicant(app.id as string, app.email as string))} disabled={isBusy}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <XCircle size={11} /> Tolak
                        </button>
                      </>
                    )}
                    {app.status === "Tes Mengemudi" && (
                      <>
                        <button
                          onClick={() => runAction(app.id as string, () => hireCandidateFromPipeline(app.id as string), `${app.full_name as string} berhasil direkrut!`)}
                          disabled={isBusy || !drivingOk || !hazmatOk}
                          title={!drivingOk ? "Tes mengemudi harus Lulus terlebih dahulu" : !hazmatOk ? "Tes kompetensi pihak ketiga harus Lulus terlebih dahulu" : ""}
                          className="px-3 py-1.5 bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-lg text-[10px] font-bold disabled:opacity-40 flex items-center gap-1">
                          <UserPlus size={11} /> Rekrut
                        </button>
                        <button onClick={() => runAction(app.id as string, () => rejectApplicant(app.id as string, app.email as string))} disabled={isBusy}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold disabled:opacity-50 flex items-center gap-1">
                          <XCircle size={11} /> Tolak
                        </button>
                      </>
                    )}
                    {app.status === "Diterima" && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={11} /> Sudah Direkrut</span>
                    )}
                    {isBusy && <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />}
                  </div>
                </div>

                {job && !job.is_driver_position && (
                  <button
                    onClick={() => runAction(app.id as string, () => setJobPostingDriverFlags(job.id, true, !!job.is_hazmat_waste_transport))}
                    className="mb-3 text-[10px] font-semibold text-slate-400 hover:text-slate-600 underline"
                  >
                    Terdeteksi otomatis dari nama posisi — klik untuk menandai lowongan ini secara permanen sebagai posisi pengemudi/operator
                  </button>
                )}

                {["Interview", "Tes Mengemudi", "Diterima", "Ditolak"].includes(app.status as string) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <DrivingTestPanel app={app} onChanged={load} />
                    {isHazmat && <HazmatTestPanel app={app} onChanged={load} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
