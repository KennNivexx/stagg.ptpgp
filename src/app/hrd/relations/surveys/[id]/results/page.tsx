import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, MessageSquare } from "lucide-react";
import { getSurveyResults, type SurveyQuestion } from "@/app/actions/relations";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function SurveyResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSurveyResults(id);
  if (!result) notFound();
  const { survey, responses } = result;

  const questions: SurveyQuestion[] = (survey.questions_json as SurveyQuestion[]) || [];
  const answers = responses.map((r) => (r.answers as Record<string, unknown>) || {});

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link href="/hrd/relations/surveys" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#CC0000] transition-colors">
        <ArrowLeft size={14} /> Kembali ke Survei Karyawan
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-1">{survey.title as string}</h1>
          <p className="text-sm text-gray-500">Hasil dan rekap jawaban survei.</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Total Responden</p>
            <p className="text-lg font-extrabold text-slate-800">{responses.length}</p>
          </div>
        </div>
      </div>

      {questions.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Survei ini belum memiliki pertanyaan terstruktur." description="Survei lama tanpa builder pertanyaan tidak dapat direkap otomatis." />
      ) : responses.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Belum ada karyawan yang mengisi survei ini." />
      ) : (
        <div className="space-y-6">
          {questions.map((q, qi) => {
            const qAnswers = answers.map((a) => a[q.id]).filter((v) => v !== undefined && v !== null && v !== "");

            if (q.type === "multiple_choice" || q.type === "checkbox") {
              const counts: Record<string, number> = {};
              (q.options || []).forEach((o) => { counts[o] = 0; });
              qAnswers.forEach((v) => {
                const vals = Array.isArray(v) ? v : [v];
                vals.forEach((val) => { counts[val as string] = (counts[val as string] || 0) + 1; });
              });
              const max = Math.max(1, ...Object.values(counts));
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <p className="text-sm font-extrabold text-slate-800 mb-4">{qi + 1}. {q.label}</p>
                  <div className="space-y-3">
                    {Object.entries(counts).map(([opt, count]) => (
                      <div key={opt}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">{opt}</span>
                          <span className="text-xs font-bold text-slate-800">{count} ({qAnswers.length > 0 ? Math.round((count / qAnswers.length) * 100) : 0}%)</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#CC0000] rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            if (q.type === "rating") {
              const nums = qAnswers.map((v) => Number(v)).filter((n) => !isNaN(n));
              const avg = nums.length > 0 ? (nums.reduce((s, n) => s + n, 0) / nums.length) : 0;
              const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
              nums.forEach((n) => { if (dist[n] !== undefined) dist[n]++; });
              const max = Math.max(1, ...Object.values(dist));
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-extrabold text-slate-800">{qi + 1}. {q.label}</p>
                    <span className="text-lg font-extrabold text-[#CC0000]">{avg.toFixed(1)} / 5</span>
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <div key={n} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-3">{n}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(dist[n] / max) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 w-6 text-right">{dist[n]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-sm font-extrabold text-slate-800 mb-4">{qi + 1}. {q.label}</p>
                {qAnswers.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada jawaban.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {qAnswers.map((v, i) => (
                      <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{v as string}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
