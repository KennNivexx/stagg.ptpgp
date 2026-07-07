import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Briefcase, Users, Clock, TrendingUp } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ExportExcelButton from "@/components/ExportExcelButton";

export const dynamic = "force-dynamic";

export default async function LaporanRekrutmen() {
  const { data: jobs, error: jobsError } = await supabaseAdmin
    .from("job_postings")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: applications } = await supabaseAdmin
    .from("applications")
    .select("*");

  const { count: totalJobs } = await supabaseAdmin
    .from("job_postings")
    .select("*", { count: "exact", head: true });

  const { count: totalApplications } = await supabaseAdmin
    .from("applications")
    .select("*", { count: "exact", head: true });

  const { count: openJobs } = await supabaseAdmin
    .from("job_postings")
    .select("*", { count: "exact", head: true })
    .eq("status", "Open");

  const applicationsPerJob: Record<string, number> = {};
  (applications || []).forEach((a: Record<string, unknown>) => {
    const jid = a.job_id as string;
    applicationsPerJob[jid] = (applicationsPerJob[jid] || 0) + 1;
  });

  const rows = (jobs || []).map((job: Record<string, unknown>) => ({
    Lowongan: job.title as string,
    Departemen: (job.department as string) || "-",
    Status: (job.status as string) || "-",
    Pelamar: applicationsPerJob[job.id as string] || 0,
    "Tgl Dibuat": job.created_at ? new Date(job.created_at as string).toLocaleDateString("id-ID") : "-",
    "Tgl Deadline": job.deadline ? new Date(job.deadline as string).toLocaleDateString("id-ID") : "-",
  }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Rekrutmen</h1>
          <p className="text-sm text-gray-500">Analisis dan statistik rekrutmen, time-to-hire, dan konversi pelamar.</p>
        </div>
        <ExportExcelButton filename="Laporan_Rekrutmen" sheetName="Rekrutmen" rows={rows} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Briefcase size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Lowongan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalJobs || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pelamar</p>
              <p className="text-xl font-extrabold text-slate-800">{totalApplications || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Lowongan Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{openJobs || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Rata2 Pelamar/Job</p>
              <p className="text-xl font-extrabold text-slate-800">
                {totalJobs && totalJobs > 0
                  ? Math.round((totalApplications || 0) / totalJobs * 10) / 10
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Detail Lowongan & Pelamar</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik per lowongan pekerjaan</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="date" className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none" title="Tanggal Mulai" />
              <span className="text-xs text-slate-400">s/d</span>
              <input type="date" className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none" title="Tanggal Akhir" />
            </div>
          </div>

          {jobsError ? (
            <div className="p-12 text-center text-red-600 text-sm">{jobsError.message}</div>
          ) : !jobs || jobs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum ada data lowongan."
              description="Buat lowongan pekerjaan untuk melihat laporan rekrutmen."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Lowongan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departemen</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pelamar</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Dibuat</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(jobs || []).map((job: Record<string, unknown>) => (
                    <tr key={job.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-xs">{job.title as string}</p>
                        <p className="text-[10px] text-slate-400">{job.type as string || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{job.department as string || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          job.status === "Open" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          {job.status as string || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-800">
                          {applicationsPerJob[job.id as string] || 0}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1">pelamar</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {job.created_at ? new Date(job.created_at as string).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {job.deadline ? new Date(job.deadline as string).toLocaleDateString("id-ID") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik rekrutmen</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Lowongan</span>
                <span className="text-sm font-extrabold text-slate-800">{totalJobs || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Pelamar</span>
                <span className="text-sm font-extrabold text-slate-800">{totalApplications || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Lowongan Aktif</span>
                <span className="text-sm font-extrabold text-emerald-600">{openJobs || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Conversion Rate</span>
                <span className="text-sm font-extrabold text-blue-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Time-to-Hire (rata2)</span>
                <span className="text-sm font-extrabold text-amber-600">-</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Pelamar</h3>
              <p className="text-xs text-slate-400 mt-0.5">Per lowongan</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(jobs || []).slice(0, 5).map((job: Record<string, unknown>) => {
                  const count = applicationsPerJob[job.id as string] || 0;
                  const maxVal = Math.max(1, ...Object.values(applicationsPerJob));
                  const width = (count / maxVal) * 100;
                  return (
                    <div key={job.id as string}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-600 truncate max-w-[140px]">{job.title as string}</span>
                        <span className="text-[10px] font-bold text-slate-800">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#CC0000] rounded-full" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
                {(!jobs || jobs.length === 0) && (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada data.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
