"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Download, FileText, Clock, Users, X, Plus, CheckCircle2, Edit3, Calendar } from "lucide-react";
import { generateBatchPayroll, updatePayrollStatus, updatePayrollAmounts, batchUpdatePayrollStatus } from "@/app/actions/admin";
import EmptyState from "@/components/EmptyState";

type Payroll = Record<string, unknown>;

const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function fmt(n: number) { return n.toLocaleString("id-ID"); }

interface Props {
  payrolls: Payroll[];
  employees?: { id: string; full_name: string; department: string; position: string }[];
  totalEmployees: number;
  title?: string;
  subtitle?: string;
}

export default function PayrollClient({ payrolls, totalEmployees, title = "Payroll", subtitle = "Kelola penggajian dan slip gaji seluruh karyawan." }: Props) {
  const router = useRouter();
  const [showGen, setShowGen] = useState(false);
  const [showEdit, setShowEdit] = useState<Payroll | null>(null);
  const [editBonus, setEditBonus] = useState("0");
  const [editDeductions, setEditDeductions] = useState("0");
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [batchSaving, setBatchSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{ created: number; skipped: number; warnings?: string[] } | null>(null);

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  const { draftCount, approvedCount } = useMemo(() => ({
    draftCount: payrolls.filter(p => p.status === "Draft").length,
    approvedCount: payrolls.filter(p => p.status === "Approved").length,
  }), [payrolls]);

  const handleStatusChange = async (id: string, status: "Approved" | "Paid") => {
    setActingId(id);
    const result = await updatePayrollStatus(id, status);
    setActingId(null);
    if (result?.error) { setMsg({ type: "error", text: result.error }); return; }
    router.refresh();
  };

  const handleBatchGenerate = async () => {
    setSaving(true); setMsg(null); setGenResult(null);
    const fd = new FormData();
    fd.append("month", genMonth.toString());
    fd.append("year", genYear.toString());
    const result = await generateBatchPayroll(fd);
    setSaving(false);
    if (result?.error) { setMsg({ type: "error", text: result.error }); return; }
    setGenResult({ created: (result as Record<string, unknown>).created as number, skipped: (result as Record<string, unknown>).skipped as number, warnings: (result as Record<string, unknown>).warnings as string[] });
    setMsg({ type: "success", text: `Berhasil! ${(result as Record<string, unknown>).created} slip dibuat${(result as Record<string, unknown>).skipped ? `, ${(result as Record<string, unknown>).skipped} dilewati (sudah ada)` : ""}.` });
    router.refresh();
  };

  const handleBatchStatus = async (status: string) => {
    setBatchSaving(status); setMsg(null);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const fd = new FormData();
    fd.append("month", currentMonth.toString());
    fd.append("year", currentYear.toString());
    fd.append("status", status);
    const result = await batchUpdatePayrollStatus(fd);
    setBatchSaving(null);
    if (result?.error) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: `${(result as Record<string, unknown>).updated} payroll diperbarui ke ${status === "Approved" ? "Disetujui" : "Dibayar"}` });
    router.refresh();
  };

  const openEdit = (p: Payroll) => {
    setShowEdit(p);
    setEditBonus(String(Number(p.bonus) || 0));
    setEditDeductions(String(Number(p.deductions) || 0));
    setMsg(null);
  };

  const handleEditSave = async () => {
    if (!showEdit) return;
    setSaving(true); setMsg(null);
    const fd = new FormData();
    fd.append("id", showEdit.id as string);
    fd.append("bonus", editBonus);
    fd.append("deductions", editDeductions);
    const result = await updatePayrollAmounts(fd);
    setSaving(false);
    if (result?.error) { setMsg({ type: "error", text: result.error }); return; }
    setShowEdit(null);
    setMsg({ type: "success", text: "Payroll berhasil diperbarui." });
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Slip Gaji</p>
              <p className="text-xl font-extrabold text-slate-800">{payrolls.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Draft</p>
              <p className="text-xl font-extrabold text-slate-800">{draftCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Approved</p>
              <p className="text-xl font-extrabold text-slate-800">{approvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Payroll</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat penggajian seluruh karyawan</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {draftCount > 0 && (
              <button onClick={() => handleBatchStatus("Approved")} disabled={batchSaving !== null}
                className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50">
                {batchSaving === "Approved" ? "Memproses..." : `Approve Semua (${draftCount})`}
              </button>
            )}
            {approvedCount > 0 && (
              <button onClick={() => handleBatchStatus("Paid")} disabled={batchSaving !== null}
                className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50">
                {batchSaving === "Paid" ? "Memproses..." : `Tandai Dibayar (${approvedCount})`}
              </button>
            )}
            <button onClick={() => { setShowGen(true); setMsg(null); setGenResult(null); }}
              disabled={totalEmployees === 0}
              className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 disabled:opacity-50">
              <Plus size={14} /> Generate Payroll
            </button>
          </div>
        </div>

        {payrolls.length === 0 ? (
          <EmptyState icon={DollarSign} title="Belum ada data payroll." description="Klik Generate Payroll untuk membuat slip gaji seluruh karyawan aktif." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Karyawan", "Periode", "Gaji Pokok", "Tunjangan", "Bonus", "Potongan", "Net", "Status", ""].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrolls.map((p) => {
                  const emp = p.karyawan as Record<string, string> | undefined;
                  const totalDeductions = (Number(p.tax) || 0) + (Number(p.bpjs_health) || 0) + (Number(p.bpjs_employment) || 0) + (Number(p.deductions) || 0);
                  const busy = actingId === p.id;
                  return (
                    <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium">{MONTHS[Number(p.month)] || "-"} {String(p.year || "")}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-medium">Rp {fmt(Number(p.basic_salary) || 0)}</td>
                      <td className="px-4 py-3 text-xs text-emerald-600 font-medium">Rp {fmt(Number(p.allowances) || 0)}</td>
                      <td className="px-4 py-3 text-xs text-emerald-600 font-medium">{Number(p.bonus) > 0 ? `Rp ${fmt(Number(p.bonus))}` : "-"}</td>
                      <td className="px-4 py-3 text-xs text-red-600 font-medium" title="PPh 21 + BPJS Kesehatan + BPJS Ketenagakerjaan">Rp {fmt(totalDeductions)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">Rp {fmt(Number(p.net_salary) || 0)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          p.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                          p.status === "Approved" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {p.status === "Draft" ? "Draft" : p.status === "Paid" ? "Dibayar" : "Disetujui"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "Draft" && (
                            <>
                              <button onClick={() => openEdit(p)} title="Edit bonus/potongan"
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                                <Edit3 size={13} />
                              </button>
                              <button onClick={() => handleStatusChange(p.id as string, "Approved")} disabled={busy}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md hover:bg-blue-100 disabled:opacity-50">
                                Setujui
                              </button>
                            </>
                          )}
                          {p.status === "Approved" && (
                            <button onClick={() => handleStatusChange(p.id as string, "Paid")} disabled={busy}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Dibayar
                            </button>
                          )}
                          <button onClick={() => window.open(`/api/payslip/${p.id as string}`, "_blank")}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors" title="Slip PDF">
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Payroll Modal */}
      {showGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowGen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><Calendar size={14} /> Generate Payroll Periode</h3>
              <button onClick={() => setShowGen(false)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Bulan</label>
                  <select value={genMonth} onChange={(e) => setGenMonth(parseInt(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tahun</label>
                  <select value={genYear} onChange={(e) => setGenYear(parseInt(e.target.value))}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-700">
                Payroll akan dibuat untuk <strong>semua karyawan aktif</strong> berdasarkan struktur gaji yang tersimpan. PPh 21 dan BPJS dihitung otomatis.
              </div>
              {genResult && (
                <div className="bg-slate-50 rounded-xl p-3 text-[11px] space-y-1">
                  <p className="text-emerald-700 font-bold">Berhasil: {genResult.created} slip</p>
                  {genResult.skipped > 0 && <p className="text-amber-600">{genResult.skipped} dilewati (sudah ada)</p>}
                  {genResult.warnings?.map((w, i) => <p key={i} className="text-red-500">{w}</p>)}
                </div>
              )}
              {msg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowGen(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Tutup</button>
                <button onClick={handleBatchGenerate} disabled={saving}
                  className="flex-1 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors">
                  {saving ? "Memproses..." : "Generate Semua"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payroll Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><Edit3 size={14} /> Edit Payroll (Draft)</h3>
              <button onClick={() => setShowEdit(null)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                <strong>{(showEdit.karyawan as Record<string, string>)?.full_name}</strong> — {MONTHS[Number(showEdit.month)]} {String(showEdit.year)}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Bonus (Rp)</label>
                  <input type="number" min="0" value={editBonus} onChange={(e) => setEditBonus(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Potongan Lain (Rp)</label>
                  <input type="number" min="0" value={editDeductions} onChange={(e) => setEditDeductions(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-[10px] text-slate-500">
                Gaji bersih akan dihitung ulang otomatis. PPh 21 dan BPJS tidak dapat diedit (dihitung sistem).
              </div>
              {msg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowEdit(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold">Batal</button>
                <button onClick={handleEditSave} disabled={saving}
                  className="flex-1 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
