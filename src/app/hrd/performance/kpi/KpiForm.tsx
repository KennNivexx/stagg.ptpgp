"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Eye, Star, Trash2 } from "lucide-react";
import { saveKpiEvaluation } from "@/app/actions/performance-hrd";
import EmptyState from "@/components/EmptyState";

type Employee = { id: string; full_name: string; kode?: string; department: string; position: string; jabatan_id: string | null };
type KpiEval = Record<string, unknown>;
type MetricRow = { metric: string; weight: string; value: string };
type KpiCatalogEntry = { id: string; jabatan_id: string; nama_kpi: string; source_system: string | null; bobot_default: number };

interface Props {
  employees: Employee[];
  evaluations: KpiEval[];
  kpiCatalog: KpiCatalogEntry[];
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

const emptyMetricRow = (): MetricRow => ({ metric: "", weight: "", value: "" });

/** Filters to rows with a name, a positive weight, and a numeric value —
 * matches the validation performed server-side in performance-hrd.ts. */
function validMetricRows(rows: MetricRow[]) {
  return rows
    .map((r) => ({ metric: r.metric.trim(), weight: parseFloat(r.weight), value: parseFloat(r.value) }))
    .filter((r) => r.metric && !Number.isNaN(r.weight) && r.weight > 0 && !Number.isNaN(r.value));
}

/** Client-side preview only — mirrors the server-side weighted-average calc
 * in performance-hrd.ts so the form can show the computed score live. */
function previewWeightedScore(rows: MetricRow[]): number | null {
  const valid = validMetricRows(rows);
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, r) => s + r.weight, 0);
  const weightedSum = valid.reduce((s, r) => s + r.value * r.weight, 0);
  if (totalWeight <= 0) return null;
  return Math.max(0, Math.min(100, Math.round(weightedSum / totalWeight)));
}

function statusBadge(status: string) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700";
  if (status === "Reviewed") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

function statusLabel(status: string) {
  if (status === "Approved") return "Disetujui";
  if (status === "Reviewed") return "Direview";
  return status || "Draft";
}

export default function KpiForm({ employees, evaluations, kpiCatalog }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<KpiEval | null>(null);
  const [metricRows, setMetricRows] = useState<MetricRow[]>([emptyMetricRow()]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const computedScore = previewWeightedScore(metricRows);

  const selectedJabatanId = employees.find(e => e.id === selectedEmployeeId)?.jabatan_id || null;
  const catalogForEmployee = selectedJabatanId ? kpiCatalog.filter(k => k.jabatan_id === selectedJabatanId) : [];

  function addCatalogRow(kpiId: string) {
    const entry = kpiCatalog.find(k => k.id === kpiId);
    if (!entry) return;
    setMetricRows((rows) => {
      const target = rows.findIndex(r => !r.metric);
      const newRow = { metric: entry.nama_kpi, weight: String(entry.bobot_default || ""), value: "" };
      if (target >= 0) return rows.map((r, i) => (i === target ? newRow : r));
      return [...rows, newRow];
    });
  }

  function updateMetricRow(idx: number, field: keyof MetricRow, value: string) {
    setMetricRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function addMetricRow() {
    setMetricRows((rows) => [...rows, emptyMetricRow()]);
  }
  function removeMetricRow(idx: number) {
    setMetricRows((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows));
  }

  async function handleSave() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const fd = new FormData(formRef.current);
    const valid = validMetricRows(metricRows);
    if (valid.length > 0) fd.set("metrics", JSON.stringify(valid));
    const result = await saveKpiEvaluation(fd);
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Evaluasi KPI berhasil disimpan!" });
    setMetricRows([emptyMetricRow()]);
    formRef.current.reset();
    setShowForm(false);
    router.refresh();
  }

  function scoreColor(score: number) {
    if (score >= 85) return "text-emerald-600 bg-emerald-50";
    if (score >= 70) return "text-blue-600 bg-blue-50";
    if (score >= 55) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> {showForm ? "Tutup Form" : "Buat Evaluasi Baru"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Evaluasi KPI</h3>
          </div>
          <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
              <select name="employee_id" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                <option value="">Pilih karyawan...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}{e.kode ? ` (${e.kode})` : ""} - {e.department}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Periode</label>
              <input name="period" type="text" placeholder="Q1 2026 / Jan 2026" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Rincian KPI Metrics (opsional)</label>
              {catalogForEmployee.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <select onChange={(e) => { if (e.target.value) { addCatalogRow(e.target.value); e.target.value = ""; } }}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:border-[#CC0000] outline-none bg-white">
                    <option value="">+ Pilih dari KPI Catalog jabatan...</option>
                    {catalogForEmployee.map((k) => <option key={k.id} value={k.id}>{k.nama_kpi}{k.source_system ? ` (${k.source_system})` : ""} — bobot {k.bobot_default}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                {metricRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
                    <input value={row.metric} onChange={(e) => updateMetricRow(idx, "metric", e.target.value)}
                      placeholder="Nama metrik, mis. Sales Revenue"
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
                    <input value={row.weight} onChange={(e) => updateMetricRow(idx, "weight", e.target.value)}
                      type="number" min="0" max="100" placeholder="Bobot %"
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
                    <input value={row.value} onChange={(e) => updateMetricRow(idx, "value", e.target.value)}
                      type="number" min="0" max="100" placeholder="Nilai"
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
                    <button type="button" onClick={() => removeMetricRow(idx)} disabled={metricRows.length === 1}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 justify-self-start">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addMetricRow}
                className="text-[10px] font-bold text-[#CC0000] hover:underline flex items-center gap-1">
                <Plus size={12} /> Tambah Metrik
              </button>
              <p className="text-[10px] text-slate-400">
                {computedScore !== null
                  ? `Skor Total akan dihitung otomatis dari rata-rata tertimbang bobot: ${computedScore}`
                  : "Kosongkan (atau isi bobot 0) untuk mengisi Skor Total secara manual di bawah."}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Skor Total (0–100)</label>
              <input name="score" type="number" min="0" max="100" placeholder="82" disabled={computedScore !== null}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none disabled:bg-slate-50 disabled:text-slate-400" />
              {computedScore !== null && (
                <p className="text-[10px] text-slate-400 mt-1">Diabaikan karena KPI Metrics di atas sudah diisi.</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan</label>
              <input name="comments" type="text" placeholder="Catatan evaluator..." className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="md:col-span-2">
              <Msg m={msg} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); setMetricRows([emptyMetricRow()]); }} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan Evaluasi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8">
            <h3 className="font-extrabold text-slate-800 mb-4">Detail Evaluasi KPI</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Karyawan</span><span className="font-bold">{(detail.karyawan as Record<string, string>)?.full_name || "-"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Periode</span><span className="font-bold">{detail.period as string}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Skor</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${scoreColor(Number(detail.score))}`}>{Number(detail.score).toFixed(0)}</span>
              </div>
              <div className="flex justify-between"><span className="text-slate-500">Status</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusBadge(detail.status as string)}`}>{statusLabel(detail.status as string)}</span>
              </div>
              {!!detail.comments && <div className="flex justify-between"><span className="text-slate-500">Catatan</span><span className="font-medium text-xs text-right max-w-xs">{detail.comments as string}</span></div>}
              {Array.isArray(detail.metrics) && (detail.metrics as Array<Record<string, unknown>>).length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Breakdown KPI Metrics</p>
                  <div className="space-y-1.5">
                    {(detail.metrics as Array<{ metric: string; weight: number; value: number }>).map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">{m.metric} <span className="text-slate-400">(bobot {m.weight})</span></span>
                        <span className="font-bold text-slate-800">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setDetail(null)} className="mt-6 w-full px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200">Tutup</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Karyawan", "Periode", "Skor", "Grade", "Skor Akhir", "Status", "Catatan", ""].map((h) => (
                <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {evaluations.length === 0 ? (
              <tr><td colSpan={8}><EmptyState icon={Star} title={'Belum ada evaluasi KPI. Klik "Buat Evaluasi Baru" untuk mulai.'} /></td></tr>
            ) : evaluations.map((ev) => {
              const emp = ev.karyawan as Record<string, string> | undefined;
              const score = Number(ev.score) || 0;
              const grade = score >= 90 ? "A" : score >= 80 ? "B+" : score >= 70 ? "B" : score >= 60 ? "C" : "D";
              const finalScore = ev.final_score != null ? Number(ev.final_score) : null;
              return (
                <tr key={ev.id as string} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "-"}</p>
                    <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{ev.period as string}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${scoreColor(score)}`}>{score.toFixed(0)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                      <Star size={12} className="fill-amber-400 text-amber-400" />{grade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {finalScore !== null ? <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${scoreColor(finalScore)}`}>{finalScore.toFixed(0)}</span> : <span className="text-[10px] text-slate-300">-</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusBadge(ev.status as string)}`}>{statusLabel(ev.status as string)}</span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-[150px] truncate">{(ev.comments as string) || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setDetail(ev)}
                      className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center gap-1 ml-auto">
                      <Eye size={10} /> Lihat Detail
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
