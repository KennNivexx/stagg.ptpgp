import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { ArrowLeft, Mail, Phone, Calendar, FileText, UserCheck } from "lucide-react";

export default async function JobApplicantsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const { data: job } = await supabaseAdmin
    .from("job_postings")
    .select("title, department, status")
    .eq("id", jobId)
    .single();

  const { data: applications } = await supabaseAdmin
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .order("applied_at", { ascending: false });

  const statusColor = (status: string) => {
    switch (status) {
      case "Diterima": return "bg-emerald-50 text-emerald-700";
      case "Interview": return "bg-blue-50 text-blue-700";
      case "Diproses": return "bg-purple-50 text-purple-700";
      case "Ditolak": return "bg-red-50 text-red-700";
      default: return "bg-amber-50 text-amber-700";
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <Link href="/hrd/recruitment" className="inline-flex items-center text-sm text-gray-500 hover:text-[#CC0000] transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Rekrutmen
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">
          Pelamar: {job?.title || "Loading..."}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {job?.department || "-"} &middot; {applications?.length || 0} pelamar
        </p>
      </div>

      {!applications || applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <UserCheck size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Belum ada pelamar</h3>
          <p className="text-sm text-slate-500">Lowongan ini belum menerima lamaran dari kandidat.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app: Record<string, unknown>) => (
            <div key={app.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {(app.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800">{app.full_name as string}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail size={12} /> {app.email as string}</span>
                      {!!app.phone && <span className="flex items-center gap-1"><Phone size={12} /> {app.phone as string}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {new Date(app.applied_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${statusColor(app.status as string)}`}>
                    {app.status as string || "Menunggu Review"}
                  </span>
                  <Link
                    href={`/hrd/recruitment/${jobId}/applicants/${app.id}`}
                    className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <FileText size={12} /> Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
