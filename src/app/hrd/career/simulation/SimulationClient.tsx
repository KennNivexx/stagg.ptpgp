"use client";
import { useMemo, useState } from "react";
import { Sliders } from "lucide-react";

type Assessment = Record<string, unknown> & {
  id: string; karyawan_id: string; final_career_score: number;
  performance_score: number; competency_score: number; skills_score: number;
  leadership_score: number; learning_score: number; attendance_score: number;
  discipline_score: number; innovation_score: number; experience_score: number;
  karyawan?: { full_name?: string } | null;
};
type Formula = {
  performance_weight_pct: number; competency_weight_pct: number; skills_weight_pct: number;
  leadership_weight_pct: number; learning_weight_pct: number; attendance_weight_pct: number;
  discipline_weight_pct: number; innovation_weight_pct: number; experience_weight_pct: number;
  assessment_weight_pct: number;
};

const COMPONENTS = [
  { key: "performance_score", weightKey: "performance_weight_pct", label: "Kinerja" },
  { key: "competency_score", weightKey: "competency_weight_pct", label: "Kompetensi" },
  { key: "skills_score", weightKey: "skills_weight_pct", label: "Skills" },
  { key: "leadership_score", weightKey: "leadership_weight_pct", label: "Leadership" },
  { key: "learning_score", weightKey: "learning_weight_pct", label: "Learning" },
  { key: "attendance_score", weightKey: "attendance_weight_pct", label: "Kehadiran" },
  { key: "discipline_score", weightKey: "discipline_weight_pct", label: "Disiplin" },
  { key: "innovation_score", weightKey: "innovation_weight_pct", label: "Inovasi" },
  { key: "experience_score", weightKey: "experience_weight_pct", label: "Pengalaman" },
] as const;

export default function SimulationClient({ assessments, formula }: { assessments: Assessment[]; formula: Formula | null }) {
  const [selectedId, setSelectedId] = useState(assessments[0]?.id || "");
  const base = assessments.find((a) => a.id === selectedId) || null;
  const [scores, setScores] = useState<Record<string, number>>({});

  const current = useMemo(() => {
    if (!base) return {} as Record<string, number>;
    const s: Record<string, number> = {};
    COMPONENTS.forEach((c) => { s[c.key] = scores[c.key] ?? (base[c.key] as number) ?? 0; });
    return s;
  }, [base, scores]);

  const simulatedScore = useMemo(() => {
    if (!formula) return base?.final_career_score || 0;
    let total = 0;
    COMPONENTS.forEach((c) => {
      const weight = (formula[c.weightKey] as number) || 0;
      total += ((current[c.key] || 0) * weight) / 100;
    });
    return Math.round(total * 10) / 10;
  }, [current, formula, base]);

  if (!base) {
    return (
      <div className="p-6 lg:p-8 max-w-screen-2xl mx-auto">
        <p className="text-sm text-slate-500">Belum ada Career Assessment untuk disimulasikan. Isi Career Assessment karyawan terlebih dahulu.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Sliders size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Career Simulation</h1>
          <p className="text-sm text-slate-500 mt-1">Geser komponen skor untuk melihat dampaknya terhadap Career Score, dihitung real-time dari formula aktif.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Pilih Karyawan</label>
        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); setScores({}); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full max-w-sm"
        >
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>{a.karyawan?.full_name || a.karyawan_id} — {String(a.period)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          {COMPONENTS.map((c) => (
            <div key={c.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">{c.label} ({formula ? `${formula[c.weightKey]}%` : "-"})</span>
                <span className="text-xs font-extrabold text-slate-800">{current[c.key] ?? 0}</span>
              </div>
              <input
                type="range" min={0} max={100} value={current[c.key] ?? 0}
                onChange={(e) => setScores((prev) => ({ ...prev, [c.key]: Number(e.target.value) }))}
                className="w-full accent-red-600"
              />
            </div>
          ))}
        </div>

        <div className="bg-[#1A2530] rounded-2xl p-6 text-white flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Career Score (Simulasi)</p>
          <p className="text-5xl font-extrabold">{simulatedScore}</p>
          <p className="text-xs text-slate-400 mt-3">Skor tersimpan saat ini: {base.final_career_score}</p>
        </div>
      </div>
    </div>
  );
}
