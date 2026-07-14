"use client";

import { useState, useEffect } from "react";
import { RefreshCw, GraduationCap, AlertTriangle } from "lucide-react";
import { getTNA, generateTNA, createTrainingFromTNA, type TnaRow } from "@/app/actions/trainings";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLE: Record<string, string> = {
  Open: "bg-amber-50 text-amber-700 border-amber-200",
  Assigned: "bg-blue-50 text-blue-700 border-blue-200",
  Resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function TnaPage() {
  const [rows, setRows] = useState<TnaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => { setRows(await getTNA()); setLoading(false); };
  useEffect(() => { fetchData(); }, []);
  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 4000); };

  const handleGenerate = async () => {
    setGenerating(true); setError("");
    const res = await generateTNA();
    setGenerating(false);
    if ("error" in res) { setError(res.error); return; }
    showSuccess(`TNA di-generate — ${res.count} kebutuhan pelatihan ditemukan.`);
    await fetchData();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const handleCreateTraining = async () => {
    if (selected.size === 0) return;
    setCreating(true); setError("");
    const res = await createTrainingFromTNA(Array.from(selected));
    setCreating(false);
    if ("error" in res) { setError(res.error); return; }
    showSuccess(`${res.createdCount} training dibuat dari TNA terpilih.`);
    setSelected(new Set());
    await fetchData();
  };

  const openRows = rows.filter(r => r.status === "Open");

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Training Need Analysis (TNA)</h1>
          <p className="text-sm text-gray-500">Kebutuhan pelatihan otomatis dari kesenjangan kompetensi — Jabatan → Kompetensi → Training, bukan pilih manual satu-satu.</p>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl disabled:opacity-50">
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} /> {generating ? "Men-generate..." : "Generate TNA"}
        </button>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      {selected.size > 0 && (
        <div className="p-4 bg-slate-900 rounded-xl flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-white font-semibold">{selected.size} baris TNA dipilih</p>
          <button onClick={handleCreateTraining} disabled={creating}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 text-xs font-bold rounded-lg disabled:opacity-50">
            <GraduationCap size={14} /> {creating ? "Membuat..." : "Buat Training dari TNA Terpilih"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Belum ada TNA." description="Klik 'Generate TNA' untuk memindai kesenjangan kompetensi seluruh karyawan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-4 py-3 w-10"></th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Karyawan</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">Kompetensi</th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">Required</th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">Current</th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">Gap</th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/30">
                    <td className="px-4 py-3">
                      {r.status === "Open" && (
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="accent-[#CC0000]" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{r.karyawan_nama}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{r.skill_nama}</td>
                    <td className="px-3 py-3 text-center text-xs font-bold text-slate-600">{r.required_level}</td>
                    <td className="px-3 py-3 text-center text-xs font-bold text-slate-600">{r.current_level}</td>
                    <td className="px-3 py-3 text-center text-xs font-extrabold text-red-600">{r.gap}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold border ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {rows.length > 0 && (
        <p className="text-xs text-slate-400">{openRows.length} kebutuhan masih terbuka dari total {rows.length} baris TNA.</p>
      )}
    </div>
  );
}
