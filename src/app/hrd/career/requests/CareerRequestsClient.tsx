"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, MessageSquare, CheckCircle2, X } from "lucide-react";
import { updateCareerRequestStatus } from "@/app/actions/career-hrd";
import EmptyState from "@/components/EmptyState";

type CareerRequest = Record<string, unknown>;

const STATUSES = ["Reviewed", "Completed", "Rejected"] as const;

function statusBadge(status: string) {
  if (status === "Completed") return "bg-emerald-50 text-emerald-700";
  if (status === "Reviewed") return "bg-blue-50 text-blue-700";
  if (status === "Rejected") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700"; // Pending
}

export default function CareerRequestsClient({ initialRequests }: { initialRequests: CareerRequest[] }) {
  const router = useRouter();
  const requests = initialRequests;
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyStatus, setReplyStatus] = useState<(typeof STATUSES)[number]>("Reviewed");
  const [replyNotes, setReplyNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const openReply = (req: CareerRequest) => {
    setReplyId(req.id as string);
    setReplyStatus(req.status === "Pending" ? "Reviewed" : (req.status as (typeof STATUSES)[number]) || "Reviewed");
    setReplyNotes((req.notes as string) || "");
  };

  const handleReply = async () => {
    if (!replyId) return;
    setSaving(true);
    const result = await updateCareerRequestStatus(replyId, replyStatus, replyNotes);
    setSaving(false);
    if ("error" in result) { showToast(result.error ?? "Terjadi kesalahan"); return; }
    showToast("Status permintaan diperbarui.");
    setReplyId(null);
    router.refresh();
  };

  const counts = {
    pending: requests.filter((r) => r.status === "Pending").length,
    reviewed: requests.filter((r) => r.status === "Reviewed").length,
    completed: requests.filter((r) => r.status === "Completed").length,
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-slate-800 text-white text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Menunggu", count: counts.pending, color: "bg-amber-50 text-amber-600" },
          { label: "Direview", count: counts.reviewed, color: "bg-blue-50 text-blue-600" },
          { label: "Selesai", count: counts.completed, color: "bg-emerald-50 text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
            <p className={`text-xl font-extrabold mt-1 ${s.color.split(" ")[1]}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Permintaan</h3>
        </div>

        {requests.length === 0 ? (
          <EmptyState icon={Briefcase} title="Belum ada lamaran atau permintaan konsultasi karir." />
        ) : (
          <div className="divide-y divide-slate-50">
            {requests.map((req) => {
              const isApplication = req.type === "application";
              return (
                <div key={req.id as string} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-slate-800">{req.employee_name as string}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isApplication ? "bg-purple-50 text-purple-700" : "bg-cyan-50 text-cyan-700"}`}>
                          {isApplication ? "Lamaran Internal" : "Konsultasi Karir"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge(req.status as string)}`}>{req.status as string}</span>
                      </div>
                      {isApplication && (
                        <p className="text-xs text-slate-600">
                          Melamar: <span className="font-semibold">{req.job_title as string}</span>
                          {req.job_department ? ` — ${req.job_department as string}` : ""}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">{req.employee_email as string} · {req.created_at ? new Date(req.created_at as string).toLocaleDateString("id-ID") : "-"}</p>
                      {!!req.notes && (
                        <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan HRD</p>
                          <p className="text-xs text-slate-600">{req.notes as string}</p>
                        </div>
                      )}
                    </div>
                    <button onClick={() => openReply(req)}
                      className="shrink-0 px-3 py-1.5 bg-[#CC0000] text-white text-[10px] font-bold rounded-lg hover:bg-[#aa0000] transition-colors flex items-center gap-1.5">
                      <MessageSquare size={12} /> Tindak Lanjuti
                    </button>
                  </div>

                  {replyId === req.id && (
                    <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-700">Perbarui status {req.employee_name as string}</p>
                        <button onClick={() => setReplyId(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X size={14} /></button>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status</label>
                        <select value={replyStatus} onChange={(e) => setReplyStatus(e.target.value as (typeof STATUSES)[number])}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan</label>
                        <textarea rows={3} value={replyNotes} onChange={(e) => setReplyNotes(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none resize-none"
                          placeholder="Tuliskan tindak lanjut atau alasan..." />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setReplyId(null)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
                        <button onClick={handleReply} disabled={saving}
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> {saving ? "Menyimpan..." : "Simpan"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
