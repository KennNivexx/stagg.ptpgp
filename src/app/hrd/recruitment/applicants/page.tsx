"use client";

import { useState, useEffect, Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { Users, Search, Filter, FileText, Mail, Phone, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function DataPelamarWrapper() {
  return (
    <Suspense fallback={<div className="p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]" /></div>}>
      <DataPelamar />
    </Suspense>
  );
}

function DataPelamar() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") || "";
  const jobFilter = searchParams.get("job") || "";

  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabaseAdmin.from("applications").select("*, jobs!inner(title, department)").order("applied_at", { ascending: false }).limit(100),
      supabaseAdmin.from("jobs").select("id, title").order("title", { ascending: true }),
    ]).then(([{ data: apps }, { data: jbs }]) => {
      setApplications(apps || []);
      setJobs(jbs || []);
      setLoading(false);
    });
  }, []);

  let filtered = applications || [];
  if (statusFilter) filtered = filtered.filter((a: Record<string, unknown>) => a.status === statusFilter);
  if (jobFilter) filtered = filtered.filter((a: Record<string, unknown>) => a.job_id === jobFilter);

  const statuses = ["Menunggu Review", "Diproses", "Interview", "Diterima", "Ditolak"];

  const statusColor = (s: string) => {
    switch (s) {
      case "Diterima": return "bg-emerald-50 text-emerald-700";
      case "Interview": return "bg-blue-50 text-blue-700";
      case "Diproses": return "bg-purple-50 text-purple-700";
      case "Ditolak": return "bg-red-50 text-red-700";
      default: return "bg-amber-50 text-amber-700";
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Data Pelamar</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola data seluruh pelamar dari berbagai lowongan pekerjaan.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <button
          key="all"
          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
            !statusFilter ? "bg-[#1A2530] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          onClick={() => router.push("/hrd/recruitment/applicants")}
        >
          Semua ({(applications || []).length})
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === s ? `${statusColor(s)} ring-1 ring-current` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            onClick={() => router.push(`/hrd/recruitment/applicants?status=${encodeURIComponent(s)}`)}
          >
            {s} ({(applications || []).filter((a: Record<string, unknown>) => a.status === s).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {!applications || applications.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Belum ada pelamar</h3>
            <p className="text-sm text-slate-500">Belum ada lamaran yang masuk ke sistem.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Search size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Tidak ada hasil</h3>
            <p className="text-sm text-slate-500">Tidak ada pelamar dengan status yang dipilih.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Posisi Dilamar</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((app: Record<string, unknown>) => {
                  const job = app.jobs as Record<string, string> | undefined;
                  return (
                    <tr key={app.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(app.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <p className="font-bold text-slate-800 text-xs">{app.full_name as string}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-600 flex items-center gap-1">
                            <Mail size={11} /> {app.email as string}
                          </p>
                          {!!app.phone && (
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <Phone size={11} /> {app.phone as string}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-700">{job?.title || "-"}</p>
                        {job?.department && <p className="text-[10px] text-slate-400">{job.department}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusColor(app.status as string)}`}>
                          {app.status as string || "Menunggu Review"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {app.applied_at ? new Date(app.applied_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!!app.job_id && (
                          <Link
                            href={`/hrd/recruitment/${app.job_id}/applicants/${app.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#CC0000] hover:underline"
                          >
                            Detail <ChevronRight size={12} />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Total: <span className="font-bold text-slate-800">{filtered.length}</span> pelamar
              {statusFilter && <span className="text-slate-400 ml-2">(status: {statusFilter})</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
