"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle } from "lucide-react";
import { submitSurveyResponse, type SurveyQuestion } from "@/app/actions/relations";

export default function TakeSurveyClient({ surveyId, questions }: { surveyId: string; questions: SurveyQuestion[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const setAnswer = (id: string, value: unknown) => setAnswers((a) => ({ ...a, [id]: value }));

  const toggleCheckbox = (qid: string, opt: string) => {
    const current = (answers[qid] as string[]) || [];
    setAnswer(qid, current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt]);
  };

  const handleSubmit = async () => {
    setError("");
    for (const q of questions) {
      if (q.required) {
        const v = answers[q.id];
        const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
        if (empty) { setError(`Pertanyaan "${q.label}" wajib diisi.`); return; }
      }
    }
    setSaving(true);
    const fd = new FormData();
    fd.append("survey_id", surveyId);
    fd.append("answers", JSON.stringify(answers));
    const result = await submitSurveyResponse(fd);
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    setSuccess(true);
    router.refresh();
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} />
        </div>
        <h3 className="font-bold text-emerald-700 mb-1">Terima kasih! Jawaban Anda telah terkirim.</h3>
        <p className="text-xs text-slate-500">HRD akan merekap hasil survei ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <p className="text-sm font-bold text-slate-800 mb-3">
            {qi + 1}. {q.label} {q.required && <span className="text-[#CC0000]">*</span>}
          </p>

          {q.type === "short_text" && (
            <input value={(answers[q.id] as string) || ""} onChange={(e) => setAnswer(q.id, e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#CC0000]" placeholder="Jawaban Anda..." />
          )}

          {q.type === "paragraph" && (
            <textarea rows={4} value={(answers[q.id] as string) || ""} onChange={(e) => setAnswer(q.id, e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#CC0000] resize-none" placeholder="Jawaban Anda..." />
          )}

          {q.type === "multiple_choice" && (
            <div className="space-y-2">
              {(q.options || []).map((opt) => (
                <label key={opt} className="flex items-center gap-3 p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input type="radio" name={q.id} checked={answers[q.id] === opt} onChange={() => setAnswer(q.id, opt)} className="accent-[#CC0000]" />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "checkbox" && (
            <div className="space-y-2">
              {(q.options || []).map((opt) => (
                <label key={opt} className="flex items-center gap-3 p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={((answers[q.id] as string[]) || []).includes(opt)} onChange={() => toggleCheckbox(q.id, opt)} className="accent-[#CC0000]" />
                  <span className="text-sm text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "rating" && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setAnswer(q.id, n)}
                  className={`w-10 h-10 rounded-full border font-bold text-sm transition-colors ${answers[q.id] === n ? "bg-[#CC0000] border-[#CC0000] text-white" : "border-slate-200 text-slate-600 hover:border-[#CC0000]"}`}>
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      <button onClick={handleSubmit} disabled={saving}
        className="px-6 py-2.5 bg-pgp-red text-white text-xs font-bold rounded-xl hover:bg-pgp-red/80 disabled:opacity-60 transition-colors flex items-center gap-2">
        <Send size={14} /> {saving ? "Mengirim..." : "Kirim Jawaban"}
      </button>
    </div>
  );
}
