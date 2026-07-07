"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText, Clock, CheckCircle2, XCircle, Users, Trash2, Plus,
  Eye, X, ChevronRight, Briefcase, Tag, AlignLeft, AlertCircle,
} from "lucide-react";
import { getRequests, addRequest, updateRequestStatus, deleteRequest } from "@/app/actions/requests";
import EmptyState from "@/components/EmptyState";

interface Request {
  id: string; department: string; position: string; quantity: number;
  reason: string; urgency: string; status: string; requested_by: string;
  created_at: string; grade_code?: string; job_desc?: string;
}

interface Props {
  departments: string[];
  positions: string[];
  userRole: string;
  userName: string;
}

const URGENCY_OPTS = ["Rendah", "Sedang", "Tinggi"];

export default function RequestsClient({ departments, positions, userRole, userName }: Props) {
  const [data, setData] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<Request | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customPosition, setCustomPosition] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const closeForm = () => {
    setShowForm(false);
    setCustomPosition(false);
  };

  const isManager = userRole === "department_manager" || userRole === "superadmin";
  const isHRD = userRole === "hrd" || userRole === "superadmin";
  const isDirector = userRole === "director" || userRole === "superadmin";

  useEffect(() => { getRequests().then(setData).finally(() => setLoading(false)); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const doStatus = async (id: string, status: string) => {
    const result = await updateRequestStatus(id, status);
    if ("error" in result) { showToast(result.error as string); return; }
    setData(prev => {
      const req = prev.find(r => r.id === id);
      if (status === "Disetujui" && req) showToast(`Disetujui! Headcount ${req.department} +${req.quantity}.`);
      else if (status === "Direview Direktur") showToast("Diteruskan ke Direktur.");
      else if (status === "Ditolak") showToast("Permintaan ditolak.");
      return prev.map(r => r.id === id ? { ...r, status } : r);
    });
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status } : prev);
  };

  const doDelete = async (id: string) => {
    if (!confirm("Hapus permintaan ini?")) return;
    const result = await deleteRequest(id);
    if (result?.error) { showToast(result.error); return; }
    setData(prev => prev.filter(r => r.id !== id));
    if (detail?.id === id) setDetail(null);
    showToast("Permintaan dihapus.");
  };

  const doSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setSubmitting(true);
    const fd = new FormData(formRef.current);
    fd.set("requested_by", userName);
    const result = await addRequest(fd);
    setSubmitting(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Permintaan berhasil diajukan.");
    closeForm();
    formRef.current?.reset();
    getRequests().then(setData);
  };

  const pending = data.filter(r => r.status === "Pending").length;
  const approved = data.filter(r => r.status === "Disetujui").length;
  const rejected = data.filter(r => r.status === "Ditolak").length;

  const urgencyClass = (u: string) =>
    u === "Tinggi" ? "bg-red-50 text-red-700 border-red-200"
    : u === "Sedang" ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-blue-50 text-blue-700 border-blue-200";

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      "Direview Direktur": "bg-blue-50 text-blue-700 border-blue-200",
      Disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Ditolak: "bg-red-50 text-red-700 border-red-200",
    };
    return m[s] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-1">Pengajuan SDM</h1>
          <p className="text-sm text-gray-500">Ajukan dan pantau permintaan penambahan tenaga kerja.</p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#CC0000] hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Plus size={15} /> Ajukan SDM
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: data.length, icon: <FileText size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: pending, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", value: approved, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", value: rejected, icon: <XCircle size={18} />, color: "bg-red-50 text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Permintaan</h3>
          <span className="text-[10px] text-slate-400">Klik baris untuk lihat detail</span>
        </div>
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" />
            </div>
          ) : data.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada permintaan." />
          ) : data.map(req => (
            <div
              key={req.id}
              className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={() => setDetail(req)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{req.position}</span>
                    {req.grade_code && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-violet-50 text-violet-700 border-violet-200">
                        Grade {req.grade_code}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${urgencyClass(req.urgency)}`}>
                      {req.urgency}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Users size={10} /> {req.department}</span>
                    <span>Jumlah: {req.quantity}</span>
                    {req.requested_by && <span>{req.requested_by}</span>}
                  </p>
                  {req.reason && (
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-md">{req.reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setDetail(req)}
                    className="p-1.5 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-colors"
                    title="Lihat detail"
                  >
                    <Eye size={13} />
                  </button>
                  {(isHRD || isDirector) && (
                    <button onClick={() => doDelete(req.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Detail Modal ─────────────────────────────────────────── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">{detail.position}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{detail.department} · {new Date(detail.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <button onClick={() => setDetail(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusBadge(detail.status)}`}>
                  {detail.status}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${urgencyClass(detail.urgency)}`}>
                  Urgensi: {detail.urgency}
                </span>
                <span className="px-2 py-1 rounded-lg text-xs font-bold border bg-slate-50 text-slate-700 border-slate-200">
                  Jumlah: {detail.quantity} orang
                </span>
              </div>

              {/* Grade Code */}
              {detail.grade_code && (
                <div className="flex gap-3">
                  <div className="p-2 bg-violet-50 rounded-lg shrink-0"><Tag size={15} className="text-violet-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Kode Grade</p>
                    <p className="text-sm font-bold text-slate-800">{detail.grade_code}</p>
                  </div>
                </div>
              )}

              {/* Job Description */}
              {detail.job_desc && (
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0"><Briefcase size={15} className="text-blue-500" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Deskripsi Pekerjaan</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{detail.job_desc}</p>
                  </div>
                </div>
              )}

              {/* Reason */}
              {detail.reason && (
                <div className="flex gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg shrink-0"><AlignLeft size={15} className="text-amber-500" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Alasan Pengajuan</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{detail.reason}</p>
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Diajukan oleh: <span className="font-semibold text-slate-600">{detail.requested_by || "-"}</span></span>
                <span className="font-mono text-[10px]">{detail.id.slice(0, 12)}</span>
              </div>

              {/* Actions */}
              {(isHRD || isDirector) && (
                <div className="pt-2 space-y-2">
                  {isHRD && detail.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => doStatus(detail.id, "Direview Direktur")}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <ChevronRight size={13} /> Teruskan ke Director
                      </button>
                      <button
                        onClick={() => doStatus(detail.id, "Ditolak")}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                  {isDirector && detail.status === "Direview Direktur" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => doStatus(detail.id, "Disetujui")}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Setujui
                      </button>
                      <button
                        onClick={() => doStatus(detail.id, "Ditolak")}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                  {detail.status === "Disetujui" && (
                    isHRD ? (
                      <Link
                        href={`/hrd/recruitment/new?dept=${encodeURIComponent(detail.department)}&pos=${encodeURIComponent(detail.position)}&qty=${detail.quantity}&req=${detail.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Plus size={13} /> Buat Lowongan Rekrutmen
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold">
                        Menunggu HRD membuat lowongan rekrutmen
                      </div>
                    )
                  )}
                  {(isHRD || isDirector) && (
                    <button
                      onClick={() => doDelete(detail.id)}
                      className="w-full py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} /> Hapus Permintaan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Form Modal (Ajukan SDM) ──────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-800">Ajukan Permintaan SDM</h2>
              <button onClick={closeForm} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <form ref={formRef} onSubmit={doSubmit} className="p-6 space-y-4">
              {/* Departemen */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen <span className="text-red-500">*</span></label>
                {departments.length > 0 ? (
                  <select name="department" required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                    <option value="">Pilih departemen</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <input name="department" required placeholder="Nama departemen" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                )}
              </div>

              {/* Posisi + Grade berdampingan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Posisi / Jabatan <span className="text-red-500">*</span></label>
                  {positions.length > 0 ? (
                    <>
                      <select
                        name={customPosition ? undefined : "position"}
                        required={!customPosition}
                        defaultValue=""
                        onChange={(e) => setCustomPosition(e.target.value === "__custom__")}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
                      >
                        <option value="">Pilih posisi</option>
                        {positions.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="__custom__">+ Posisi Baru (ketik manual)</option>
                      </select>
                      {customPosition && (
                        <input
                          name="position"
                          required
                          autoFocus
                          placeholder="Ketik posisi baru"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
                        />
                      )}
                    </>
                  ) : (
                    <input name="position" required placeholder="cth. Staff Ekspor" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Kode Grade
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input name="grade_code" placeholder="cth. G3, M2" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                </div>
              </div>

              {/* Jumlah + Urgensi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Jumlah <span className="text-red-500">*</span></label>
                  <input name="quantity" type="number" min={1} defaultValue={1} required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Urgensi</label>
                  <select name="urgency" defaultValue="Sedang" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                    {URGENCY_OPTS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Deskripsi Pekerjaan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Deskripsi Pekerjaan
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                </label>
                <textarea
                  name="job_desc"
                  rows={3}
                  placeholder="Jelaskan tugas, tanggung jawab, dan kualifikasi yang dibutuhkan..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 resize-none"
                />
              </div>

              {/* Alasan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Alasan Pengajuan
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                </label>
                <textarea
                  name="reason"
                  rows={3}
                  placeholder="Mengapa posisi ini perlu diisi? Beban kerja meningkat, ekspansi, dll."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 resize-none"
                />
              </div>

              {/* Info */}
              <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">Permintaan akan direview oleh HRD sebelum diteruskan ke Direktur untuk persetujuan akhir.</p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#CC0000] hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                  {submitting ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
