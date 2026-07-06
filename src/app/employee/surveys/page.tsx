import Link from "next/link";
import { ClipboardList, CheckCircle2, Calendar } from "lucide-react";
import { getActiveSurveysForEmployee } from "@/app/actions/relations";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  engagement: "Engagement",
  satisfaction: "Kepuasan",
  exit: "Exit Interview",
  training: "Feedback Pelatihan",
};

export default async function EmployeeSurveysPage() {
  const surveys = (await getActiveSurveysForEmployee()) as Array<Record<string, unknown>>;
  const active = surveys.filter((s) => s.status === "Aktif");
  const closed = surveys.filter((s) => s.status !== "Aktif");

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Survei Karyawan</h1>
        <p className="text-sm text-gray-500">Isi survei dari HRD untuk membantu perusahaan memahami kebutuhan Anda.</p>
      </div>

      {surveys.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada survei untuk Anda." />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 mb-4">Survei Aktif</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {active.map((s) => (
                  <Link key={s.id as string} href={`/employee/surveys/${s.id}`}
                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all group block">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2.5 bg-red-50 text-[#CC0000] rounded-xl"><ClipboardList size={18} /></div>
                      {s._answered ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Sudah Diisi</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[9px] font-bold">Belum Diisi</span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-blue-700 bg-blue-50 inline-block px-2 py-0.5 rounded mb-2">{TYPE_LABELS[s.survey_type as string] || (s.survey_type as string)}</p>
                    <h3 className="text-sm font-extrabold text-slate-800 mb-2 group-hover:text-[#CC0000] transition-colors">{s.title as string}</h3>
                    {(s.end_date as string) && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1"><Calendar size={10} /> Berakhir {new Date(s.end_date as string).toLocaleDateString("id-ID")}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {closed.length > 0 && (
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 mb-4">Survei Ditutup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {closed.map((s) => (
                  <div key={s.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 opacity-60">
                    <p className="text-xs font-bold text-slate-500 bg-slate-50 inline-block px-2 py-0.5 rounded mb-2">{TYPE_LABELS[s.survey_type as string] || (s.survey_type as string)}</p>
                    <h3 className="text-sm font-extrabold text-slate-700">{s.title as string}</h3>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
