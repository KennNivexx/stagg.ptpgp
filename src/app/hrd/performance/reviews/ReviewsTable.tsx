"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clipboard, CheckCircle2, RotateCcw } from "lucide-react";
import { updateKpiStatus } from "@/app/actions/performance-hrd";
import EmptyState from "@/components/EmptyState";

type Evaluation = Record<string, unknown>;

interface Props {
  evaluations: Evaluation[];
}

const WORKFLOW_STATUSES = ["Draft", "Reviewed", "Approved", ""];

export default function ReviewsTable({ evaluations: initialEvaluations }: Props) {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [detail, setDetail] = useState<Evaluation | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  function scoreColor(score: number) {
    if (score >= 80) return "bg-emerald-50 text-emerald-700";
    if (score >= 60) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  }

  function gradeLabel(score: number) {
    if (score >= 90) return "A";
    if (score >= 80) return "B+";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  }

  function statusBadgeClass(status: string) {
    if (status === "Approved") return "bg-emerald-50 text-emerald-700";
    if (status === "Reviewed") return "bg-blue-50 text-blue-700";
    if (status === "Draft" || !status) return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-600";
  }

  function statusLabel(status: string) {
    if (status === "Approved") return "Disetujui";
    if (status === "Reviewed") return "Direview";
    return status || "Draft";
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  async function handleStatusChange(id: string, status: "Draft" | "Reviewed" | "Approved", confirmMsg: string) {
    if (!window.confirm(confirmMsg)) return;
    setActingId(id);
    const result = await updateKpiStatus(id, status);
    setActingId(null);
    if ("error" in result) { showToast(result.error ?? "Terjadi kesalahan"); return; }
    setEvaluations((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    if (detail && detail.id === id) setDetail({ ...detail, status });
    showToast("Status evaluasi berhasil diperbarui.");
    router.refresh();
  }

  function ActionButtons({ ev }: { ev: Evaluation }) {
    const status = (ev.status as string) || "Draft";
    if (!WORKFLOW_STATUSES.includes(status)) return null; // e.g. "Final" from succession readiness — not part of this workflow
    const id = ev.id as string;
    const busy = actingId === id;
    return (
      <div className="flex items-center gap-1.5 justify-end flex-wrap">
        {status === "Draft" && (
          <button disabled={busy} onClick={() => handleStatusChange(id, "Reviewed", "Tandai evaluasi ini sebagai sudah direview?")}
            className="px-2.5 py-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1">
            <CheckCircle2 size={11} /> Tandai Direview
          </button>
        )}
        {status === "Reviewed" && (
          <>
            <button disabled={busy} onClick={() => handleStatusChange(id, "Approved", "Setujui evaluasi ini? Status akan menjadi final.")}
              className="px-2.5 py-1.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1">
              <CheckCircle2 size={11} /> Setujui
            </button>
            <button disabled={busy} onClick={() => handleStatusChange(id, "Draft", "Kembalikan evaluasi ini ke Draft untuk direvisi?")}
              className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-1">
              <RotateCcw size={11} /> Kembalikan
            </button>
          </>
        )}
        {status === "Approved" && (
          <button disabled={busy} onClick={() => handleStatusChange(id, "Draft", "Kembalikan evaluasi yang sudah disetujui ini ke Draft untuk direvisi?")}
            className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 flex items-center gap-1">
            <RotateCcw size={11} /> Kembalikan ke Draft
          </button>
        )}
      </div>
    );
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <EmptyState icon={Clipboard} title="Belum ada data review kinerja." description="Lakukan evaluasi KPI untuk melihat review di sini." />
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-slate-800 text-white border border-slate-700 text-sm font-bold">
          {toast}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
            <h3 className="font-extrabold text-slate-800 mb-5 text-sm">Detail Review Kinerja</h3>
            {(() => {
              const emp = detail.karyawan as Record<string, string> | undefined;
              const score = Number(detail.score) || 0;
              return (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Karyawan</span><span className="font-bold text-xs">{emp?.full_name || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Departemen</span><span className="font-bold text-xs">{emp?.department || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Jabatan</span><span className="font-bold text-xs">{emp?.position || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Periode</span><span className="font-bold text-xs">{detail.period as string || "-"}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">Skor</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${scoreColor(score)}`}>{score}</span>
                      <span className="text-xs font-extrabold text-[#CC0000]">Grade {gradeLabel(score)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Status</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusBadgeClass(detail.status as string)}`}>{statusLabel(detail.status as string)}</span>
                  </div>
                  {!!detail.comments && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan Evaluator</p>
                      <p className="text-xs text-slate-700">{detail.comments as string}</p>
                    </div>
                  )}
                  {Array.isArray(detail.metrics) && (detail.metrics as Array<Record<string, unknown>>).length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Breakdown KPI Metrics</p>
                      <div className="space-y-1.5">
                        {(detail.metrics as Array<{ metric: string; weight: number; value: number }>).map((m, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{m.metric} <span className="text-slate-400">(bobot {m.weight})</span></span>
                            <span className="font-bold text-slate-800">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-100">
                    <ActionButtons ev={detail} />
                  </div>
                </div>
              );
            })()}
            <button onClick={() => setDetail(null)} className="mt-6 w-full px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200">Tutup</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Review Kinerja</h3>
          <p className="text-xs text-slate-400 mt-0.5">Hasil penilaian dari evaluasi KPI</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Karyawan", "Departemen", "Periode", "Skor", "Status", ""].map((h) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {evaluations.map((ev) => {
                const emp = ev.karyawan as Record<string, string> | undefined;
                const score = Number(ev.score) || 0;
                return (
                  <tr key={ev.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                      <p className="text-[10px] text-slate-400">{emp?.position || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{emp?.department || "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">{(ev.period as string) || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${scoreColor(score)}`}>{score}</span>
                        <span className="text-[9px] font-bold text-slate-400">{gradeLabel(score)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusBadgeClass(ev.status as string)}`}>
                        {statusLabel(ev.status as string)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <ActionButtons ev={ev} />
                        <button onClick={() => setDetail(ev)}
                          className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
