import { supabaseAdmin } from "@/lib/supabase";
import { Users, ArrowRight, UserCheck, UserX, Clock, FileText, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";

const STAGES = [
  { key: "Menunggu Review", label: "Menunggu Review", icon: FileText, color: "border-t-amber-400", bgBadge: "bg-amber-50 text-amber-700" },
  { key: "Diproses", label: "Diproses", icon: Clock, color: "border-t-purple-400", bgBadge: "bg-purple-50 text-purple-700" },
  { key: "Interview", label: "Interview", icon: Users, color: "border-t-blue-400", bgBadge: "bg-blue-50 text-blue-700" },
  { key: "Diterima", label: "Diterima", icon: UserCheck, color: "border-t-emerald-400", bgBadge: "bg-emerald-50 text-emerald-700" },
];

export default async function PipelineKandidat() {
  const { data: applications } = await supabaseAdmin
    .from("applications")
    .select("*, jobs!inner(title, department)")
    .order("applied_at", { ascending: false })
    .limit(200);

  const grouped: Record<string, Record<string, unknown>[]> = {};
  STAGES.forEach((s) => { grouped[s.key] = []; });
  grouped["Ditolak"] = [];

  (applications || []).forEach((app: Record<string, unknown>) => {
    const status = (app.status as string) || "Menunggu Review";
    if (grouped[status]) {
      grouped[status].push(app);
    } else {
      grouped["Menunggu Review"].push(app);
    }
  });

  const totalApplicants = (applications || []).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Pipeline Kandidat</h1>
        <p className="text-sm text-gray-500 mt-1">Pantau alur rekrutmen secara visual dari lamaran masuk hingga diterima.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-800 text-white p-3 rounded-xl text-center">
          <p className="text-[10px] font-bold opacity-70">TOTAL PELAMAR</p>
          <p className="text-lg font-extrabold">{totalApplicants}</p>
        </div>
        {STAGES.map((s) => (
          <div key={s.key} className={`bg-white rounded-xl border ${s.color} border-t-2 shadow-sm p-3 text-center`}>
            <p className="text-[10px] font-bold text-slate-400">{s.label}</p>
            <p className="text-lg font-extrabold text-slate-800">{grouped[s.key]?.length || 0}</p>
          </div>
        ))}
      </div>

      {!applications || applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Belum ada pelamar</h3>
          <p className="text-sm text-slate-500">Pipeline akan terisi setelah ada lamaran masuk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAGES.map((stage) => {
            const apps = grouped[stage.key] || [];
            return (
              <div key={stage.key} className={`bg-white rounded-2xl border ${stage.color} border-t-[3px] shadow-sm`}>
                <div className="p-4 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <stage.icon size={16} className="text-slate-600" />
                    <h3 className="font-extrabold text-sm text-slate-800">{stage.label}</h3>
                    <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">{apps.length}</span>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto">
                  {apps.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-xs text-slate-400">Belum ada kandidat</p>
                    </div>
                  ) : (
                    apps.map((app: Record<string, unknown>) => {
                      const job = app.jobs as Record<string, string> | undefined;
                      return (
                        <div key={app.id as string} className="bg-slate-50 rounded-xl p-3 hover:shadow-sm transition-all border border-transparent hover:border-slate-200">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[8px] shrink-0">
                              {(app.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-slate-800 truncate">{app.full_name as string}</p>
                              <p className="text-[9px] text-slate-400 truncate">{job?.title || "-"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-500 mb-2">
                            <span className="flex items-center gap-0.5"><Mail size={9} /> {(app.email as string)?.substring(0, 20)}</span>
                            <span className="flex items-center gap-0.5">
                              <Calendar size={9} />
                              {app.applied_at ? new Date(app.applied_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                            </span>
                          </div>
                          {!!app.job_id && (
                            <Link
                              href={`/hrd/recruitment/${app.job_id}/applicants/${app.id}`}
                              className="text-[9px] font-bold text-[#CC0000] hover:underline inline-flex items-center gap-1"
                            >
                              Detail <ArrowRight size={9} />
                            </Link>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <UserX size={16} className="text-red-500" />
          Kandidat Ditolak ({grouped["Ditolak"]?.length || 0})
        </h3>
        {(!grouped["Ditolak"] || grouped["Ditolak"].length === 0) ? (
          <p className="text-xs text-slate-400">Belum ada kandidat yang ditolak.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {grouped["Ditolak"].slice(0, 8).map((app: Record<string, unknown>) => (
              <div key={app.id as string} className="bg-red-50/30 rounded-lg p-2.5">
                <p className="text-[11px] font-bold text-slate-700">{app.full_name as string}</p>
                <p className="text-[9px] text-slate-400">
                  {app.applied_at ? new Date(app.applied_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
