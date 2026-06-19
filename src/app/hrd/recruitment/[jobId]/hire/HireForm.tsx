"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, CheckCircle2, Mail, Phone, Calendar, CalendarClock, XCircle } from "lucide-react";
import Link from "next/link";
import { hireCandidate } from "@/app/actions/recruitment";
import { supabase } from "@/lib/supabase";

export default function HireForm({ jobPosting }: { jobPosting: Record<string, unknown> }) {
  const router = useRouter();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [done, setDone] = useState("");

  const fetchApplicants = async () => {
    try {
      const { data } = await supabase.from("applications")
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
    const { error } = await supabase.from("applications").update({ status }).eq("id", applicantId);
    setActionLoading(null);
    if (error) { showToast("Gagal update status."); return; }
    setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status } : a));
    showToast(status === "Interview" ? "Kandidat dijadwalkan interview." : "Kandidat ditolak.");
  };

  const handleHire = async (applicant: any) => {
    setActionLoading(applicant.id);
    const fd = new FormData();
    fd.append("job_posting_id", jobPosting.id as string);
    fd.append("full_name", applicant.full_name as string);
    fd.append("email", (applicant.email || "") as string);
    fd.append("position", jobPosting.position as string);
    fd.append("department", jobPosting.department as string);
    const r = await hireCandidate(fd);
    setActionLoading(null);
    if (r.error) { showToast(r.error); return; }
    setDone(applicant.full_name);
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
          <button onClick={() => setDone("")} className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600">Lanjut Rekrut</button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto" /></div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <UserPlus size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500 font-bold">Belum ada pelamar</p>
          <p className="text-xs text-slate-400 mt-1">Pelamar akan muncul setelah melamar melalui halaman karir publik.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map(applicant => {
            const appStatus = applicant.status === "Menunggu Review" ? "Applied" : (applicant.status || "Applied");
            return (
              <div key={applicant.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                    {(applicant.full_name as string || "?")[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{applicant.full_name}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                      {applicant.email && <span className="flex items-center gap-1"><Mail size={10} />{applicant.email}</span>}
                      {applicant.phone && <span className="flex items-center gap-1"><Phone size={10} />{applicant.phone}</span>}
                      <span className="flex items-center gap-1"><Calendar size={10} />{new Date(applicant.applied_at || applicant.created_at).toLocaleDateString("id-ID")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    appStatus === "Hired" ? "bg-emerald-50 text-emerald-600" :
                    appStatus === "Interview" ? "bg-purple-50 text-purple-600" :
                    appStatus === "Rejected" ? "bg-red-50 text-red-600" :
                    "bg-amber-50 text-amber-600"
                  }`}>
                    {appStatus === "Hired" ? "Direkrut" : appStatus === "Interview" ? "Interview" : appStatus === "Rejected" ? "Ditolak" : "Applied"}
                  </span>

                  {appStatus === "Applied" && (
                    <>
                      <button onClick={() => updateStatus(applicant.id, "Interview")} disabled={actionLoading === applicant.id}
                        className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-[10px] font-bold transition-colors disabled:opacity-50">
                        <CalendarClock size={12} className="inline mr-0.5" />Interview
                      </button>
                      <button onClick={() => updateStatus(applicant.id, "Rejected")} disabled={actionLoading === applicant.id}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold transition-colors disabled:opacity-50">
                        <XCircle size={12} className="inline mr-0.5" />Tolak
                      </button>
                    </>
                  )}

                  {appStatus === "Interview" && (
                    <>
                      <button onClick={() => handleHire(applicant)} disabled={actionLoading === applicant.id}
                        className="px-3 py-1 bg-[#CC0000] hover:bg-[#aa0000] text-white rounded text-[10px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                        <UserPlus size={12} />Rekrut
                      </button>
                      <button onClick={() => updateStatus(applicant.id, "Rejected")} disabled={actionLoading === applicant.id}
                        className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold transition-colors disabled:opacity-50">Tolak</button>
                    </>
                  )}

                  {appStatus === "Rejected" && (
                    <button onClick={() => updateStatus(applicant.id, "Applied")} disabled={actionLoading === applicant.id}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[10px] font-bold transition-colors">↩ Batal</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
