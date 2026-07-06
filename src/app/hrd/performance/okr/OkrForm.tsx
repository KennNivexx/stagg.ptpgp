"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Target, RefreshCw, Trash2, ListChecks } from "lucide-react";
import { saveOkr, updateOkrProgress } from "@/app/actions/performance-hrd";
import EmptyState from "@/components/EmptyState";

type Employee = { id: string; full_name: string; department: string };
type OkrItem = Record<string, unknown>;
type KeyResultRow = { description: string; target: string; unit: string };

const OKR_STATUSES = ["On Track", "At Risk", "Behind", "Achieved"];

const emptyKeyResultRow = (): KeyResultRow => ({ description: "", target: "", unit: "" });

function validKeyResultRows(rows: KeyResultRow[]) {
  return rows
    .map((r) => ({ description: r.description.trim(), target: r.target.trim(), unit: r.unit.trim() }))
    .filter((r) => r.description);
}

/** okr.key_results is stored as a JSON string inside a plain TEXT column
 * (no migration needed for structured data). Falls back to [] if empty or
 * unparsable (e.g. legacy plain-text rows from before this format existed). */
function parseKeyResults(raw: unknown): KeyResultRow[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function uniqueDepartments(employees: Employee[]): string[] {
  return Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort();
}

function okrStatusBadge(status: string) {
  if (status === "Achieved") return "bg-emerald-50 text-emerald-700";
  if (status === "At Risk") return "bg-amber-50 text-amber-700";
  if (status === "Behind") return "bg-red-50 text-red-700";
  return "bg-blue-50 text-blue-700"; // On Track
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

interface Props {
  employees: Employee[];
  okrData: OkrItem[];
}

export default function OkrForm({ employees, okrData }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const departments = uniqueDepartments(employees);

  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [checkinProgress, setCheckinProgress] = useState(0);
  const [checkinStatus, setCheckinStatus] = useState("On Track");
  const [checkinSaving, setCheckinSaving] = useState(false);
  const [checkinError, setCheckinError] = useState("");

  const [keyResultRows, setKeyResultRows] = useState<KeyResultRow[]>([emptyKeyResultRow()]);

  function updateKeyResultRow(idx: number, field: keyof KeyResultRow, value: string) {
    setKeyResultRows((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function addKeyResultRow() {
    setKeyResultRows((rows) => [...rows, emptyKeyResultRow()]);
  }
  function removeKeyResultRow(idx: number) {
    setKeyResultRows((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows));
  }

  async function handleSave() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const fd = new FormData(formRef.current);
    const valid = validKeyResultRows(keyResultRows);
    fd.set("key_results", valid.length > 0 ? JSON.stringify(valid) : "");
    const result = await saveOkr(fd);
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "OKR berhasil disimpan!" });
    formRef.current.reset();
    setKeyResultRows([emptyKeyResultRow()]);
    setShowForm(false);
    router.refresh();
  }

  function openCheckin(okr: OkrItem) {
    setCheckinId(okr.id as string);
    setCheckinProgress(Number(okr.progress) || 0);
    setCheckinStatus((okr.status as string) || "On Track");
    setCheckinError("");
  }

  async function handleCheckinSave() {
    if (!checkinId) return;
    setCheckinSaving(true); setCheckinError("");
    const result = await updateOkrProgress(checkinId, checkinProgress, checkinStatus);
    setCheckinSaving(false);
    if ("error" in result) { setCheckinError(result.error ?? "Terjadi kesalahan"); return; }
    setCheckinId(null);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> {showForm ? "Tutup Form" : "Tambah OKR Baru"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Tambah OKR</h3>
          </div>
          <form ref={formRef} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Departemen</label>
                <select name="department" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                  <option value="">Pilih departemen...</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Periode</label>
                <input name="period" type="text" placeholder="Q1 2026" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Objective</label>
              <input name="objective" type="text" placeholder="Tujuan utama yang ingin dicapai..." className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Key Results (opsional)</label>
              <div className="space-y-2">
                {keyResultRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_auto] gap-2 items-center">
                    <input value={row.description} onChange={(e) => updateKeyResultRow(idx, "description", e.target.value)}
                      placeholder="Deskripsi, mis. Tingkatkan revenue"
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
                    <input value={row.target} onChange={(e) => updateKeyResultRow(idx, "target", e.target.value)}
                      placeholder="Target, mis. 10%"
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
                    <input value={row.unit} onChange={(e) => updateKeyResultRow(idx, "unit", e.target.value)}
                      placeholder="Satuan, mis. persen"
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
                    <button type="button" onClick={() => removeKeyResultRow(idx)} disabled={keyResultRows.length === 1}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 justify-self-start">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addKeyResultRow}
                className="text-[10px] font-bold text-[#CC0000] hover:underline flex items-center gap-1">
                <Plus size={12} /> Tambah Key Result
              </button>
            </div>
            <Msg m={msg} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); setKeyResultRows([emptyKeyResultRow()]); }} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan OKR"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {okrData.length === 0 ? (
          <EmptyState icon={Target} title={'Belum ada OKR. Klik "Tambah OKR Baru" untuk mulai.'} />
        ) : okrData.map((okr) => {
          const progress = Number(okr.progress) || 0;
          const status = (okr.status as string) || "On Track";
          const isCheckinOpen = checkinId === (okr.id as string);
          return (
            <div key={okr.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-extrabold text-slate-800 text-sm">{okr.objective as string}</p>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${okrStatusBadge(status)}`}>{status}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{(okr.department as string) || "-"} · {(okr.period as string) || "-"}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-lg font-extrabold text-[#CC0000]">{progress}%</span>
                  <button onClick={() => (isCheckinOpen ? setCheckinId(null) : openCheckin(okr))}
                    className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1">
                    <RefreshCw size={11} /> Update Progress
                  </button>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#CC0000] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>

              {(() => {
                const keyResults = parseKeyResults(okr.key_results);
                if (keyResults.length === 0) return null;
                return (
                  <div className="mt-3 pt-3 border-t border-slate-50 space-y-1.5">
                    {keyResults.map((kr, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                        <ListChecks size={12} className="text-slate-300 shrink-0" />
                        <span>{kr.description}</span>
                        {(kr.target || kr.unit) && (
                          <span className="text-slate-400">— target {kr.target} {kr.unit}</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {isCheckinOpen && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={100} value={checkinProgress}
                      onChange={(e) => setCheckinProgress(Number(e.target.value))}
                      className="flex-1 accent-[#CC0000]" />
                    <input type="number" min={0} max={100} value={checkinProgress}
                      onChange={(e) => setCheckinProgress(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                      className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-center" />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status</label>
                    <select value={checkinStatus} onChange={(e) => setCheckinStatus(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:border-[#CC0000] outline-none bg-white">
                      {OKR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {checkinError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{checkinError}</p>}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setCheckinId(null)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
                    <button onClick={handleCheckinSave} disabled={checkinSaving}
                      className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                      {checkinSaving ? "Menyimpan..." : "Simpan Progress"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
