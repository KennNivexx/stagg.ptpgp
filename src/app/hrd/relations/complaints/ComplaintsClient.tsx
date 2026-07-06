"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Clock, Search, CheckCircle2, AlertTriangle, Reply, X } from "lucide-react";
import { updateComplaintStatus } from "@/app/actions/relations";
import EmptyState from "@/components/EmptyState";

const STATUSES = ["Diselidiki", "Selesai"];

interface Complaint { id: string; employee_id: string; employee_name: string; subject: string; category: string; description: string; status: string; notes?: string; resolved_by?: string; created_at: string; }

export default function ComplaintsClient({
  initialComplaints,
}: {
  initialComplaints: Complaint[];
}) {
  const router = useRouter();
  const complaints = initialComplaints;
  const [toast, setToast] = useState("");
  const [replyId, setReplyId] = useState("");
  const [replyStatus, setReplyStatus] = useState("Diselidiki");
  const [replyNotes, setReplyNotes] = useState("");
  const [replying, setReplying] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const counts = {
    diajukan: complaints.filter(c => c.status === "Diajukan").length,
    diselidiki: complaints.filter(c => c.status === "Diselidiki").length,
    selesai: complaints.filter(c => c.status === "Selesai").length,
  };

  const openReply = (c: Complaint) => {
    setReplyId(c.id);
    setReplyStatus(c.status === "Diajukan" ? "Diselidiki" : c.status);
    setReplyNotes(c.notes || "");
  };

  const handleReply = async () => {
    if (!replyId) return;
    setReplying(true);
    const result = await updateComplaintStatus(replyId, replyStatus, replyNotes);
    setReplying(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Balasan terkirim ke karyawan.");
    setReplyId(""); setReplyNotes("");
    router.refresh();
  };

  const statusBadge = (status: string) => {
    if (status === "Selesai") return "bg-emerald-50 text-emerald-700";
    if (status === "Diselidiki") return "bg-blue-50 text-blue-700";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Diajukan", count: counts.diajukan, icon: <Clock size={18} />, color: "amber" },
          { label: "Diselidiki", count: counts.diselidiki, icon: <Search size={18} />, color: "blue" },
          { label: "Selesai", count: counts.selesai, icon: <CheckCircle2 size={18} />, color: "emerald" },
          { label: "Total", count: complaints.length, icon: <AlertTriangle size={18} />, color: "red" },
        ].map(({ label, count, icon, color }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 bg-${color}-50 text-${color}-600 rounded-xl`}>{icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-xl font-extrabold text-slate-800">{count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Keluhan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Keluhan hanya dapat diajukan oleh karyawan. HRD meninjau dan membalas satu per satu di sini.</p>
        </div>
        {complaints.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="Belum ada keluhan tercatat."
            className="border-none"
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {complaints.map(c => (
              <div key={c.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-slate-800">{c.employee_name}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{c.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge(c.status)}`}>{c.status}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{c.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(c.created_at).toLocaleDateString("id-ID")}</p>
                    {c.notes && (
                      <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Balasan HRD{c.resolved_by ? ` — ${c.resolved_by}` : ""}</p>
                        <p className="text-xs text-slate-600">{c.notes}</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => openReply(c)}
                    className="shrink-0 px-3 py-1.5 bg-[#CC0000] text-white text-[10px] font-bold rounded-lg hover:bg-[#aa0000] transition-colors flex items-center gap-1.5">
                    <Reply size={12} /> Balas
                  </button>
                </div>

                {replyId === c.id && (
                  <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-700">Balas keluhan {c.employee_name}</p>
                      <button onClick={() => setReplyId("")} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X size={14} /></button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status</label>
                      <select value={replyStatus} onChange={e => setReplyStatus(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none">
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Balasan / Tindakan</label>
                      <textarea rows={3} value={replyNotes} onChange={e => setReplyNotes(e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none resize-none"
                        placeholder="Tuliskan balasan atau tindakan yang diambil..." />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setReplyId("")} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
                      <button onClick={handleReply} disabled={replying}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                        {replying ? "Mengirim..." : "Kirim Balasan"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
