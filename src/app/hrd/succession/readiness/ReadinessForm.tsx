"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveReadinessAssessment } from "@/app/actions/succession";

const CRITERIA = [
  { key: "kepemimpinan", label: "Kepemimpinan", weight: 25 },
  { key: "keahlianTeknis", label: "Keahlian Teknis", weight: 25 },
  { key: "pengalaman", label: "Pengalaman", weight: 20 },
  { key: "kinerja", label: "Kinerja", weight: 20 },
  { key: "potensi", label: "Potensi", weight: 10 },
];

interface Candidate { id: string; full_name: string; position: string; }

export default function ReadinessForm({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState("");
  const [scores, setScores] = useState<Record<string, number>>(
    () => Object.fromEntries(CRITERIA.map((c, i) => [c.key, 50 + i * 5]))
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const totalScore = Math.round(
    CRITERIA.reduce((sum, c) => sum + scores[c.key] * (c.weight / 100), 0)
  );

  const handleSave = async () => {
    if (!selectedId) { showToast("Pilih kandidat terlebih dahulu."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", selectedId);
    fd.append("kepemimpinan", scores.kepemimpinan.toString());
    fd.append("keahlian_teknis", scores.keahlianTeknis.toString());
    fd.append("pengalaman", scores.pengalaman.toString());
    fd.append("kinerja", scores.kinerja.toString());
    fd.append("potensi", scores.potensi.toString());
    const result = await saveReadinessAssessment(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Penilaian kesiapan berhasil disimpan.");
    router.refresh();
  };

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Kandidat</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
        >
          <option value="">Pilih kandidat...</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name} - {c.position}</option>
          ))}
        </select>
      </div>

      {CRITERIA.map((c) => (
        <div key={c.key}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">{c.label}</label>
            <span className="text-[10px] text-slate-400">Bobot {c.weight}% · Skor 0–100</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={scores[c.key]}
              onChange={(e) => setScores(prev => ({ ...prev, [c.key]: parseInt(e.target.value) }))}
              className="flex-1 accent-[#CC0000] h-1.5"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={scores[c.key]}
              onChange={(e) =>
                setScores(prev => ({ ...prev, [c.key]: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))
              }
              className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 text-center focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
            />
          </div>
        </div>
      ))}

      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Skor Kesiapan Total</span>
          <span className={`text-lg font-extrabold ${totalScore >= 80 ? "text-emerald-600" : totalScore >= 60 ? "text-amber-600" : "text-[#CC0000]"}`}>
            {totalScore}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${totalScore >= 80 ? "bg-emerald-500" : totalScore >= 60 ? "bg-amber-500" : "bg-[#CC0000]"}`}
            style={{ width: `${totalScore}%` }}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50"
      >
        {saving ? "Menyimpan..." : "Simpan Penilaian Kesiapan"}
      </button>
    </>
  );
}
