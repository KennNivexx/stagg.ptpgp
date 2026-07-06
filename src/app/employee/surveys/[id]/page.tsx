import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { getSurveyForTaking, type SurveyQuestion } from "@/app/actions/relations";
import TakeSurveyClient from "./TakeSurveyClient";

export const dynamic = "force-dynamic";

export default async function TakeSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSurveyForTaking(id);
  if (!result) notFound();
  const { survey, existingResponse } = result;

  const questions: SurveyQuestion[] = (survey.questions_json as SurveyQuestion[]) || [];

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <Link href="/employee/surveys" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#CC0000] transition-colors">
        <ArrowLeft size={14} /> Kembali ke Survei Karyawan
      </Link>

      <div>
        <h1 className="text-xl font-extrabold text-[#1A2530]">{survey.title as string}</h1>
        {survey.status !== "Aktif" && <p className="text-xs text-amber-600 mt-1">Survei ini sudah ditutup.</p>}
      </div>

      {existingResponse ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="font-bold text-emerald-700 mb-1">Anda sudah mengisi survei ini.</h3>
          <p className="text-xs text-slate-500">Terima kasih atas partisipasi Anda.</p>
        </div>
      ) : survey.status !== "Aktif" ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
          Survei ini sudah tidak menerima jawaban baru.
        </div>
      ) : (
        <TakeSurveyClient surveyId={id} questions={questions} />
      )}
    </div>
  );
}
