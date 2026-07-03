"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Clock, CheckCircle, ChevronRight, Send, BarChart2, ClipboardList } from "lucide-react";
import { getApplicantTests, submitTulisAnswers, submitPsikotesAnswers } from "@/app/actions/tests";
import EmptyState from "@/components/EmptyState";

interface Question {
  id: string;
  text: string;
  type: "pilihan_ganda" | "skala";
  options?: string[];
  points?: number;
  dimension?: string;
}

interface TestData {
  id: string;
  title: string;
  instructions: string | null;
  test_type: "tulis" | "psikotes";
  duration_minutes: number;
  passing_score: number;
  questions: Question[];
}

interface TestsState {
  tulis: TestData | null;
  psikotes: TestData | null;
  alreadyTaken: { tulis?: boolean; psikotes?: boolean };
  results: { tulis?: unknown; psikotes?: unknown };
}

function CountdownTimer({ minutes, onExpire }: { minutes: number; onExpire: () => void }) {
  const [secs, setSecs] = useState(minutes * 60);
  const cbRef = useRef(onExpire);
  const firedRef = useRef(false);

  useEffect(() => { cbRef.current = onExpire; });

  useEffect(() => {
    const t = setInterval(() => {
      setSecs(s => {
        if (s <= 1) {
          clearInterval(t);
          if (!firedRef.current) { firedRef.current = true; cbRef.current(); }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs < 120;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${urgent ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"}`}>
      <Clock size={13} className={urgent ? "animate-pulse" : ""} />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
}

function TulisTest({ test, onDone }: { test: TestData; onDone: (result: Record<string, unknown>) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [current, setCurrent] = useState(0);

  const q = test.questions[current];

  const doSubmit = useCallback(async (force: boolean) => {
    const unanswered = test.questions.filter(qq => !answers[qq.id]).length;
    if (!force && unanswered > 0 && !confirm(`${unanswered} soal belum dijawab. Tetap kirim?`)) return;
    setSubmitting(true);
    const res = await submitTulisAnswers(test.id, answers);
    setSubmitting(false);
    if ("error" in res) { setErr(res.error as string); return; }
    onDone(res as Record<string, unknown>);
  }, [test.id, test.questions, answers, onDone]);

  if (!q) return null;
  const answered = Object.keys(answers).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs font-semibold text-slate-500">Soal {current + 1} / {test.questions.length}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">{answered}/{test.questions.length} dijawab</span>
          <CountdownTimer minutes={test.duration_minutes} onExpire={() => doSubmit(true)} />
        </div>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-5 shrink-0">
        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${((current + 1) / test.questions.length) * 100}%` }} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <p className="text-sm font-semibold text-slate-800 mb-4 leading-relaxed">{current + 1}. {q.text}</p>
        {q.type === "pilihan_ganda" && q.options && (
          <div className="space-y-2">
            {q.options.map((opt, i) => {
              const key = String.fromCharCode(65 + i);
              const sel = answers[q.id] === key;
              return (
                <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: key })}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border-2 transition-all ${sel ? "border-red-500 bg-red-50 text-red-800 font-semibold" : "border-slate-200 hover:border-slate-300 text-slate-700"}`}>
                  <span className="font-bold mr-2">{key}.</span>{opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {err && <p className="text-xs text-red-600 font-semibold mt-3">{err}</p>}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 shrink-0">
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30">
          ← Sebelumnya
        </button>
        {current < test.questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)}
            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700">
            Berikutnya <ChevronRight size={14} />
          </button>
        ) : (
          <button onClick={() => doSubmit(false)} disabled={submitting}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {submitting ? "Mengirim..." : <><Send size={13} /> Kirim Jawaban</>}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {test.questions.map((qq, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`w-6 h-6 text-[10px] font-bold rounded-md transition-colors ${i === current ? "bg-red-600 text-white" : answers[qq.id] ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

function PsikotesTest({ test, onDone }: { test: TestData; onDone: (result: Record<string, unknown>) => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [current, setCurrent] = useState(0);

  const q = test.questions[current];

  const doSubmit = useCallback(async (force: boolean) => {
    const unanswered = test.questions.filter(qq => !answers[qq.id]).length;
    if (!force && unanswered > 0 && !confirm(`${unanswered} pernyataan belum diisi. Tetap kirim?`)) return;
    setSubmitting(true);
    const res = await submitPsikotesAnswers(test.id, answers);
    setSubmitting(false);
    if ("error" in res) { setErr(res.error as string); return; }
    onDone(res as Record<string, unknown>);
  }, [test.id, test.questions, answers, onDone]);

  const LABELS = ["Sangat Tidak Setuju", "Tidak Setuju", "Netral", "Setuju", "Sangat Setuju"];

  if (!q) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-xs font-semibold text-slate-500">Pernyataan {current + 1} / {test.questions.length}</span>
        <CountdownTimer minutes={test.duration_minutes} onExpire={() => doSubmit(true)} />
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-5 shrink-0">
        <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${((current + 1) / test.questions.length) * 100}%` }} />
      </div>

      {q.dimension && (
        <span className="mb-2 inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full w-fit">{q.dimension}</span>
      )}

      <div className="flex-1 overflow-y-auto">
        <p className="text-sm font-semibold text-slate-800 mb-5 leading-relaxed">{current + 1}. {q.text}</p>
        <div className="flex flex-col gap-2">
          {LABELS.map((label, i) => {
            const val = i + 1;
            const sel = answers[q.id] === val;
            return (
              <button key={i} onClick={() => setAnswers({ ...answers, [q.id]: val })}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm border-2 transition-all ${sel ? "border-purple-500 bg-purple-50 text-purple-800 font-semibold" : "border-slate-200 hover:border-slate-300 text-slate-700"}`}>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${sel ? "border-purple-500 bg-purple-500 text-white" : "border-slate-300 text-slate-400"}`}>{val}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {err && <p className="text-xs text-red-600 font-semibold mt-3">{err}</p>}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 shrink-0">
        <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
          className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-30">
          ← Sebelumnya
        </button>
        {current < test.questions.length - 1 ? (
          <button onClick={() => setCurrent(c => c + 1)}
            className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700">
            Berikutnya <ChevronRight size={14} />
          </button>
        ) : (
          <button onClick={() => doSubmit(false)} disabled={submitting}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50">
            {submitting ? "Mengirim..." : <><Send size={13} /> Kirim Jawaban</>}
          </button>
        )}
      </div>
    </div>
  );
}

function TulisResult({ result }: { result: unknown }) {
  const r = result as { score: number; passed: boolean };
  return (
    <div className="text-center py-8">
      <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center text-3xl font-extrabold mb-4 ${r.passed ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600"}`}>
        {r.score}
      </div>
      <p className="text-base font-bold text-slate-800">{r.passed ? "Selamat, Anda Lulus!" : "Terima kasih atas partisipasi Anda"}</p>
      <p className="text-xs text-slate-500 mt-1">Nilai tes pengetahuan: <strong>{r.score}</strong> / 100</p>
    </div>
  );
}

function PsikotesResult({ result }: { result: unknown }) {
  const r = result as { dimensions?: Record<string, number>; overall?: number };
  if (!r?.dimensions) return <p className="text-sm text-slate-500 text-center py-8">Jawaban berhasil disimpan.</p>;
  return (
    <div className="py-4">
      <div className="text-center mb-5">
        <div className="w-20 h-20 mx-auto rounded-full bg-purple-100 flex items-center justify-center text-2xl font-extrabold text-purple-700 mb-2">
          {r.overall ?? "-"}
        </div>
        <p className="text-sm font-bold text-slate-700">Skor Keseluruhan</p>
      </div>
      <div className="space-y-3">
        {Object.entries(r.dimensions).map(([dim, score]) => (
          <div key={dim}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-700">{dim}</span>
              <span className="font-bold text-purple-700">{score}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ActiveView = null | { type: "tulis" | "psikotes"; result?: unknown };

export default function ApplicantTestPage() {
  const [testsState, setTestsState] = useState<TestsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveView>(null);

  useEffect(() => {
    getApplicantTests().then(t => {
      const ts = t as TestsState & { tulis?: unknown; psikotes?: unknown };
      setTestsState({
        tulis: ts.tulis as TestData | null,
        psikotes: ts.psikotes as TestData | null,
        alreadyTaken: ts.alreadyTaken || {},
        results: ts.results || {},
      });
      setLoading(false);
    });
  }, []);

  const handleDone = (type: "tulis" | "psikotes", result: Record<string, unknown>) => {
    setTestsState(prev => prev ? {
      ...prev,
      alreadyTaken: { ...prev.alreadyTaken, [type]: true },
      results: { ...prev.results, [type]: result },
    } : prev);
    setActive({ type, result });
  };

  if (loading) return <div className="p-8 text-sm text-gray-500 text-center">Memuat...</div>;

  if (active) {
    const test = active.type === "tulis" ? testsState?.tulis : testsState?.psikotes;
    if (!test) return null;
    const result = active.result ?? testsState?.results?.[active.type];

    return (
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 min-h-[65vh] flex flex-col">
          <div className="mb-5 shrink-0">
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${active.type === "psikotes" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
              {active.type === "psikotes" ? "Psikotes" : "Tes Pengetahuan"}
            </span>
            <h2 className="text-base font-bold text-slate-800 mt-1">{test.title}</h2>
            {test.instructions && !result && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{test.instructions}</p>
            )}
          </div>

          {result ? (
            <>
              {active.type === "tulis" ? <TulisResult result={result} /> : <PsikotesResult result={result} />}
              <button onClick={() => setActive(null)} className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline text-center">
                ← Kembali ke daftar tes
              </button>
            </>
          ) : (
            active.type === "tulis"
              ? <TulisTest test={test} onDone={r => handleDone("tulis", r)} />
              : <PsikotesTest test={test} onDone={r => handleDone("psikotes", r)} />
          )}
        </div>
      </div>
    );
  }

  const hasTests = testsState?.tulis || testsState?.psikotes;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Tes Seleksi Online</h1>
        <p className="text-xs text-slate-500 mt-0.5">Selesaikan semua tes di bawah ini sebagai bagian dari proses rekrutmen</p>
      </div>

      {!hasTests ? (
        <EmptyState
          icon={ClipboardList}
          title="Tes belum tersedia."
          description="Tes online akan muncul setelah lamaran Anda memasuki tahap Tes Tulis & Psikotes."
        />
      ) : (
        <div className="space-y-3">
          {(["tulis", "psikotes"] as const).map(type => {
            const test = testsState?.[type];
            if (!test) return null;
            const done = testsState?.alreadyTaken?.[type];
            const result = testsState?.results?.[type];
            return (
              <div key={type} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${type === "psikotes" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                      {type === "psikotes" ? "Psikotes" : "Tes Pengetahuan"}
                    </span>
                    {done && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle size={9} /> Selesai
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-800">{test.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{test.questions.length} soal · {test.duration_minutes} menit</p>
                </div>
                <div className="shrink-0">
                  {done ? (
                    <button onClick={() => setActive({ type, result })}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50">
                      <BarChart2 size={12} /> Lihat Hasil
                    </button>
                  ) : (
                    <button onClick={() => setActive({ type })}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                      Mulai Tes <ChevronRight size={13} />
                    </button>
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
