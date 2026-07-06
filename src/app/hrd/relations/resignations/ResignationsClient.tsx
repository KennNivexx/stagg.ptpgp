"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserX, Clock, CheckCircle2, XCircle } from "lucide-react";
import { updateResignationStatus } from "@/app/actions/relations";
import EmptyState from "@/components/EmptyState";

interface Resignation { id: string; employee_id: string; employee_name: string; reason: string; last_day: string; notes?: string; status: string; reviewed_by?: string; created_at: string; }

export default function ResignationsClient({
  initialResignations,
  resignedCount,
}: {
  initialResignations: Resignation[];
  resignedCount: number;
}) {
  const router = useRouter();
  const resignations = initialResignations;
  const [toast, setToast] = useState("");
  const [actionId, setActionId] = useState("");
  const [acting, setActing] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const pending = resignations.filter(r => r.status === "Diajukan");
  const approved = resignations.filter(r => r.status === "Disetujui");
  const rejected = resignations.filter(r => r.status === "Ditolak");

  const handleAction = async (id: string, status: string) => {
    setActing(true); setActionId(id);
    const result = await updateResignationStatus(id, status);
    setActing(false); setActionId("");
    if (result?.error) { showToast(result.error); return; }
    showToast(status === "Disetujui" ? "Resign disetujui. Akun karyawan akan dihapus permanen dalam 24 jam." : "Resign ditolak.");
    router.refresh();
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Pengajuan Pengunduran Diri</h3>
          <p className="text-xs text-slate-400 mt-0.5">Pengajuan resign hanya dapat diajukan oleh karyawan sendiri melalui portal karyawan. HRD meninjau dan menyetujui/menolak di sini.</p>
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
                      <p className="text-xs text-slate-500 mt-0.5">{r.reason}</p>
                      {r.notes && <p className="text-xs text-slate-400 italic mt-0.5">Catatan: {r.notes}</p>}
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
