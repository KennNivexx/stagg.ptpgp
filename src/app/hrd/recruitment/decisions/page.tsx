"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, XCircle, Users, Calendar, Clock, UserCheck, UserX, FileText } from "lucide-react";
import Link from "next/link";

type Decision = {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  job_id: string;
  status: string;
  applied_at: string;
  interview_date?: string;
  decision_date?: string;
  notes?: string;
};

export default function KeputusanHiring() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"diterima" | "ditolak">("diterima");
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("applications")
      .select("*, jobs!inner(title, department)")
      .in("status", ["Diterima", "Ditolak"])
      .order("applied_at", { ascending: false })
      .then(({ data }) => {
        const mapped = ((data || []) as Record<string, unknown>[]).map((app) => ({
          id: app.id as string,
          full_name: app.full_name as string,
          email: app.email as string,
          job_title: (app.jobs as Record<string, string>)?.title || "-",
          job_id: app.job_id as string,
          status: app.status as string,
          applied_at: app.applied_at as string,
          interview_date: (app.interview_date as string) || "",
          decision_date: (app.decision_date as string) || "",
          notes: (app.notes as string) || "",
        }));
        setDecisions(mapped);
        setLoading(false);
      });
  }, []);

  const diterima = decisions.filter((d) => d.status === "Diterima");
  const ditolak = decisions.filter((d) => d.status === "Ditolak");

  const handleAccept = async (id: string) => {
    setActionError(null);
    const { error } = await supabase.from("applications").update({ status: "Diterima", decision_date: new Date().toISOString() }).eq("id", id);
    if (error) { setActionError("Gagal menerima kandidat: " + error.message); return; }
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, status: "Diterima", decision_date: new Date().toISOString() } : d)));
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    const { error } = await supabase.from("applications").update({ status: "Ditolak", decision_date: new Date().toISOString() }).eq("id", id);
    if (error) { setActionError("Gagal menolak kandidat: " + error.message); return; }
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, status: "Ditolak", decision_date: new Date().toISOString() } : d)));
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  // Also fetch pending applicants that need decisions
  const [pending, setPending] = useState<Decision[]>([]);
  useEffect(() => {
    supabase
      .from("applications")
      .select("*, jobs!inner(title, department)")
      .eq("status", "Interview")
      .order("applied_at", { ascending: false })
      .then(({ data }) => {
        const mapped = ((data || []) as Record<string, unknown>[]).map((app) => ({
          id: app.id as string,
          full_name: app.full_name as string,
          email: app.email as string,
          job_title: (app.jobs as Record<string, string>)?.title || "-",
          job_id: app.job_id as string,
          status: app.status as string,
          applied_at: app.applied_at as string,
          interview_date: (app.interview_date as string) || "",
          decision_date: "",
          notes: (app.notes as string) || "",
        }));
        setPending(mapped);
      });
  }, []);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Keputusan Hiring</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola keputusan akhir rekrutmen: terima atau tolak kandidat.</p>
      </div>

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
          <XCircle size={14} className="shrink-0" /> {actionError}
          <button onClick={() => setActionError(null)} className="ml-auto text-red-400 hover:text-red-600"><XCircle size={13} /></button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Keputusan</p>
              <p className="text-xl font-extrabold text-slate-800">{pending.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><UserCheck size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Diterima</p>
              <p className="text-xl font-extrabold text-emerald-700">{diterima.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><UserX size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ditolak</p>
              <p className="text-xl font-extrabold text-red-700">{ditolak.length}</p>
            </div>
          </div>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
            <Clock size={14} className="text-amber-500" /> Menunggu Keputusan ({pending.length})
          </h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Interview</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase">Keputusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pending.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                            {p.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <p className="font-bold text-xs text-slate-800">{p.full_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{p.job_title}</td>
                      <td className="px-6 py-4 text-[11px] text-slate-500">{p.email}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {p.interview_date ? new Date(p.interview_date).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAccept(p.id)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <CheckCircle size={10} /> Terima
                          </button>
                          <button
                            onClick={() => handleReject(p.id)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <XCircle size={10} /> Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 mb-4 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("diterima")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "diterima" ? "bg-white shadow-sm text-emerald-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Diterima ({diterima.length})
        </button>
        <button
          onClick={() => setActiveTab("ditolak")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "ditolak" ? "bg-white shadow-sm text-red-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Ditolak ({ditolak.length})
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Posisi</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Interview</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Keputusan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Catatan</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(activeTab === "diterima" ? diterima : ditolak).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-center">
                        {activeTab === "diterima" ? (
                          <UserCheck size={40} className="mx-auto text-slate-300 mb-2" />
                        ) : (
                          <UserX size={40} className="mx-auto text-slate-300 mb-2" />
                        )}
                        <p className="text-sm text-slate-500">Belum ada kandidat yang {activeTab === "diterima" ? "diterima" : "ditolak"}.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (activeTab === "diterima" ? diterima : ditolak).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white ${
                            d.status === "Diterima" ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-red-400 to-red-600"
                          }`}>
                            {d.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{d.full_name}</p>
                            <p className="text-[10px] text-slate-400">{d.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-medium">{d.job_title}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{d.interview_date ? new Date(d.interview_date).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{d.decision_date ? new Date(d.decision_date).toLocaleDateString("id-ID") : "-"}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">{d.notes || "-"}</td>
                      <td className="px-6 py-4 text-right">
                        {!!d.job_id && (
                          <Link href={`/hrd/recruitment/${d.job_id}/applicants/${d.id}`} className="text-xs font-bold text-[#CC0000] hover:underline inline-flex items-center gap-1">
                            <FileText size={10} /> Detail
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Total <span className="font-bold text-slate-800">{activeTab === "diterima" ? diterima.length : ditolak.length}</span> kandidat {activeTab === "diterima" ? "diterima" : "ditolak"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
