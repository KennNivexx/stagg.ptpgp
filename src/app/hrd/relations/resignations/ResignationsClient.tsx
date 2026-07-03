"use client";

import { useState } from "react";
import { UserX, Clock, CheckCircle2, XCircle } from "lucide-react";
import { submitResignation, updateResignationStatus } from "@/app/actions/relations";
import EmptyState from "@/components/EmptyState";

interface Employee { id: string; full_name: string; department: string; position: string; }
interface Resignation { id: string; employee_id: string; employee_name: string; reason: string; last_day: string; notes?: string; status: string; reviewed_by?: string; created_at: string; }

export default function ResignationsClient({
  activeEmployees,
  initialResignations,
  resignedCount,
}: {
  activeEmployees: Employee[];
  initialResignations: Resignation[];
  resignedCount: number;
}) {
  const [resignations, setResignations] = useState<Resignation[]>(initialResignations);
  const [empId, setEmpId] = useState("");
  const [lastDay, setLastDay] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [actionId, setActionId] = useState("");
  const [acting, setActing] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const pending = resignations.filter(r => r.status === "Diajukan");
  const approved = resignations.filter(r => r.status === "Disetujui");
  const rejected = resignations.filter(r => r.status === "Ditolak");

  const handleSubmit = async () => {
    if (!empId || !lastDay || !reason) { showToast("Karyawan, tanggal terakhir, dan alasan wajib diisi."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", empId);
    fd.append("last_day", lastDay);
    fd.append("reason", reason);
    fd.append("notes", notes);
    const result = await submitResignation(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Pengajuan resign berhasil dicatat.");
    const emp = activeEmployees.find(e => e.id === empId);
    const newR: Resignation = {
      id: "local-" + Date.now(),
      employee_id: empId,
      employee_name: emp?.full_name || "Karyawan",
      reason, last_day: lastDay, notes, status: "Diajukan",
      created_at: new Date().toISOString(),
    };
    setResignations(prev => [newR, ...prev]);
    setEmpId(""); setLastDay(""); setReason(""); setNotes("");
  };

  const handleAction = async (id: string, status: string) => {
    setActing(true); setActionId(id);
    const result = await updateResignationStatus(id, status);
    setActing(false); setActionId("");
    if (result?.error) { showToast(result.error); return; }
    showToast(status === "Disetujui" ? "Resign disetujui. Akun karyawan akan dihapus permanen dalam 24 jam." : "Resign ditolak.");
    setResignations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const CLEARANCE = [
    "Pengembalian aset perusahaan (laptop, HP, dll)",
    "Serah terima pekerjaan ke atasan",
    "Dokumen exit interview",
    "Penyelesaian administrasi HRD",
    "Pengembalian kartu akses / ID card",
    "Penyelesaian hak dan kewajiban finansial",
    "Penghapusan akses sistem & email",
    "Sertifikat pengalaman kerja",
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Menunggu Proses", count: pending.length, icon: <Clock size={18} />, cls: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", count: approved.length, icon: <CheckCircle2 size={18} />, cls: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", count: rejected.length, icon: <XCircle size={18} />, cls: "bg-red-50 text-red-600" },
          { label: "Telah Resign", count: resignedCount, icon: <UserX size={18} />, cls: "bg-slate-50 text-slate-600" },
        ].map(({ label, count, icon, cls }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${cls} rounded-xl`}>{icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
                <p className="text-xl font-extrabold text-slate-800">{count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Pengajuan Pengunduran Diri</h3>
            <p className="text-xs text-slate-400 mt-0.5">Semua pengajuan resign yang masuk</p>
          </div>
          {resignations.length === 0 ? (
            <EmptyState
              icon={UserX}
              title="Belum ada pengajuan pengunduran diri."
              className="border-none"
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {resignations.map(r => {
                const isPending = r.status === "Diajukan";
                const isApproved = r.status === "Disetujui";
                return (
                  <div key={r.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold text-slate-800">{r.employee_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isApproved ? "bg-emerald-50 text-emerald-700" : r.status === "Ditolak" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Terakhir bekerja: <span className="font-semibold text-slate-700">{new Date(r.last_day).toLocaleDateString("id-ID")}</span></p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{r.reason}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString("id-ID")}</p>
                      </div>
                      {isPending && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => handleAction(r.id, "Disetujui")} disabled={acting && actionId === r.id}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                            Setujui
                          </button>
                          <button onClick={() => handleAction(r.id, "Ditolak")} disabled={acting && actionId === r.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-[10px] font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Proses Pengunduran Diri</h3>
            <p className="text-xs text-slate-400 mt-0.5">Formulir pemrosesan resign</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
              <select value={empId} onChange={e => setEmpId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none">
                <option value="">Pilih karyawan...</option>
                {activeEmployees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Terakhir Bekerja</label>
              <input type="date" value={lastDay} onChange={e => setLastDay(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Alasan</label>
              <textarea rows={2} value={reason} onChange={e => setReason(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none resize-none"
                placeholder="Alasan pengunduran diri..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Exit Interview</label>
              <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none resize-none"
                placeholder="Hasil exit interview..." />
            </div>
            <button onClick={handleSubmit} disabled={saving}
              className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Catat Pengajuan"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Clearance Checklist</h3>
          <p className="text-xs text-slate-400 mt-0.5">Daftar item yang harus diselesaikan sebelum resign</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CLEARANCE.map((item, i) => (
              <label key={i} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                <input type="checkbox" className="rounded accent-[#CC0000]" />
                <span className="text-xs text-slate-700">{item}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
