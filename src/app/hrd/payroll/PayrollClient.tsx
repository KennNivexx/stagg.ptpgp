"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Download, FileText, Clock, Users, X, Plus, CheckCircle2, Edit3, Calendar, History, Wallet, Landmark } from "lucide-react";
import { generateBatchPayroll, updatePayrollStatus, updatePayrollAmounts, batchUpdatePayrollStatus, getPayrollDetail } from "@/app/actions/admin";
import type { PayrollDetail } from "@/app/actions/admin";
import EmptyState from "@/components/EmptyState";
import ExportExcelButton from "@/components/ExportExcelButton";

const HISTORY_ACTION_LABEL: Record<string, string> = {
  created: "Slip dibuat", edited: "Bonus/Potongan diedit", status_change: "Status diubah", paid: "Ditandai dibayar",
};

function fmtDateTime(iso: string) {
  try { return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }); } catch { return iso; }
}

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
  bankTransferRows?: Record<string, unknown>[];
  currentRole?: string;
}

// Mirrors assertPayrollTransitionAllowed() in admin.ts — a role NOT in a
// tier's list is REJECTED unconditionally by the server (department_manager
// tiers additionally get scoped by department server-side, which this
// client can't replicate, so department_manager is left permissive here;
// the server still enforces it correctly either way). This only hides
// buttons the viewer is guaranteed to be rejected for — e.g. hrd clicking
// "Verifikasi Keuangan Semua" previously crashed the whole page with an
// uncaught ForbiddenError instead of a friendly inline message.
const ALLOWED_ROLES_FOR_STATUS: Record<string, string[]> = {
  Verified_SDM: ["hrd", "superadmin", "department_manager"],
  Verified_Keuangan: ["superadmin", "department_manager"],
  Approved: ["director", "superadmin"],
  Paid: ["hrd", "superadmin", "director"],
};

export default function PayrollClient({ payrolls, totalEmployees, title = "Payroll", subtitle = "Kelola penggajian dan slip gaji seluruh karyawan.", bankTransferRows = [], currentRole = "" }: Props) {
  const canAct = (status: string) => (ALLOWED_ROLES_FOR_STATUS[status] || []).includes(currentRole);
  const router = useRouter();
  const [showGen, setShowGen] = useState(false);
  const [showEdit, setShowEdit] = useState<Payroll | null>(null);
  const [editBonus, setEditBonus] = useState("0");
  const [editDeductions, setEditDeductions] = useState("0");
  const [detail, setDetail] = useState<PayrollDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [batchSaving, setBatchSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{ created: number; skipped: number; warnings?: string[] } | null>(null);
  const [payModal, setPayModal] = useState<{ mode: "single"; id: string } | { mode: "batch" } | null>(null);
  const [payMethod, setPayMethod] = useState("Transfer Bank");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  const { draftCount, sdmCount, keuanganCount, approvedCount } = useMemo(() => ({
    draftCount: payrolls.filter(p => p.status === "Draft").length,
    sdmCount: payrolls.filter(p => p.status === "Verified_SDM").length,
    keuanganCount: payrolls.filter(p => p.status === "Verified_Keuangan").length,
    approvedCount: payrolls.filter(p => p.status === "Approved").length,
  }), [payrolls]);

  const NEXT_STATUS: Record<string, string> = {
    Draft: "Verified_SDM",
    Verified_SDM: "Verified_Keuangan",
    Verified_Keuangan: "Approved",
    Approved: "Paid",
  };
  const STATUS_LABEL: Record<string, string> = {
    Draft: "Draft",
    Verified_SDM: "Diverifikasi SDM & Aset",
    Verified_Keuangan: "Diverifikasi Keuangan",
    Approved: "Disetujui Direktur",
    Paid: "Dibayar",
  };
  const STATUS_COLOR: Record<string, string> = {
    Draft: "bg-amber-50 text-amber-700",
    Verified_SDM: "bg-sky-50 text-sky-700",
    Verified_Keuangan: "bg-indigo-50 text-indigo-700",
    Approved: "bg-blue-50 text-blue-700",
    Paid: "bg-emerald-50 text-emerald-700",
  };
  const ACTION_LABEL: Record<string, string> = {
    Verified_SDM: "Verifikasi SDM & Aset",
    Verified_Keuangan: "Verifikasi Keuangan",
    Approved: "Setujui (Direktur)",
    Paid: "Tandai Dibayar",
  };

  const handleStatusChange = async (id: string, status: string) => {
    // "Paid" needs payment metadata (method/tanggal transfer/referensi) —
    // open the payment modal instead of flipping the status blind.
    if (status === "Paid") { setPayModal({ mode: "single", id }); setPayRef(""); setPayNotes(""); setMsg(null); return; }
    setActingId(id);
    const result = await updatePayrollStatus(id, status);
    setActingId(null);
    if (result && "error" in result) { setMsg({ type: "error", text: result.error }); return; }
    router.refresh();
  };

  const handleBatchGenerate = async () => {
    setSaving(true); setMsg(null); setGenResult(null);
    const fd = new FormData();
    fd.append("month", genMonth.toString());
    fd.append("year", genYear.toString());
    const result = await generateBatchPayroll(fd);
    setSaving(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error }); return; }
    setGenResult({ created: result.created, skipped: result.skipped, warnings: result.warnings });
    setMsg({ type: "success", text: `Berhasil! ${result.created} slip dibuat${result.skipped ? `, ${result.skipped} dilewati (sudah ada)` : ""}.` });
    router.refresh();
  };

  const handleBatchStatus = async (status: string) => {
    if (status === "Paid") { setPayModal({ mode: "batch" }); setPayRef(""); setPayNotes(""); setMsg(null); return; }
    setBatchSaving(status); setMsg(null);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const fd = new FormData();
    fd.append("month", currentMonth.toString());
    fd.append("year", currentYear.toString());
    fd.append("status", status);
    const result = await batchUpdatePayrollStatus(fd);
    setBatchSaving(null);
    if ("error" in result) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: `${result.updated} payroll diperbarui ke status "${STATUS_LABEL[status] || status}"` });
    router.refresh();
  };

  const handleConfirmPayment = async () => {
    if (!payModal) return;
    if (!payMethod.trim()) { setMsg({ type: "error", text: "Metode pembayaran wajib diisi." }); return; }
    const paymentMeta = { payment_method: payMethod.trim(), transfer_date: payDate, payment_reference: payRef.trim(), payment_notes: payNotes.trim() };
    setSaving(true); setMsg(null);
    if (payModal.mode === "single") {
      setActingId(payModal.id);
      const result = await updatePayrollStatus(payModal.id, "Paid", paymentMeta);
      setActingId(null); setSaving(false);
      if (result && "error" in result) { setMsg({ type: "error", text: result.error }); return; }
    } else {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const fd = new FormData();
      fd.append("month", currentMonth.toString());
      fd.append("year", currentYear.toString());
      fd.append("status", "Paid");
      const result = await batchUpdatePayrollStatus(fd, paymentMeta);
      setSaving(false);
      if ("error" in result) { setMsg({ type: "error", text: result.error }); return; }
      setMsg({ type: "success", text: `${result.updated} payroll ditandai Dibayar.` });
    }
    setPayModal(null);
    router.refresh();
  };

  const openEdit = (p: Payroll) => {
    setShowEdit(p);
    setEditBonus(String(Number(p.bonus) || 0));
    setEditDeductions(String(Number(p.deductions) || 0));
    setMsg(null);
    setDetail(null);
    setDetailLoading(true);
    getPayrollDetail(p.id as string).then((result) => {
      setDetailLoading(false);
      if ("error" in result) return;
      setDetail(result);
    });
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Alur verifikasi (PR-SDM-06):</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700">Draft</span>
          <span className="text-slate-500">diinput Admin SDM, masih bisa diedit</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 text-sky-700">Diverifikasi SDM & Aset</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700">Diverifikasi Keuangan</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">Disetujui Direktur</span>
        </div>
        <span className="text-slate-300">→</span>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700">Dibayar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
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
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Perlu Verifikasi</p>
              <p className="text-xl font-extrabold text-slate-800">{sdmCount + keuanganCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Disetujui Direktur</p>
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
            {draftCount > 0 && canAct("Verified_SDM") && (
              <button onClick={() => handleBatchStatus("Verified_SDM")} disabled={batchSaving !== null}
                className="px-3 py-2 bg-sky-50 text-sky-700 text-xs font-bold rounded-xl hover:bg-sky-100 transition-colors disabled:opacity-50">
                {batchSaving === "Verified_SDM" ? "Memproses..." : `Verifikasi SDM Semua (${draftCount})`}
              </button>
            )}
            {sdmCount > 0 && canAct("Verified_Keuangan") && (
              <button onClick={() => handleBatchStatus("Verified_Keuangan")} disabled={batchSaving !== null}
                className="px-3 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50">
                {batchSaving === "Verified_Keuangan" ? "Memproses..." : `Verifikasi Keuangan Semua (${sdmCount})`}
              </button>
            )}
            {keuanganCount > 0 && canAct("Approved") && (
              <button onClick={() => handleBatchStatus("Approved")} disabled={batchSaving !== null}
                className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50">
                {batchSaving === "Approved" ? "Memproses..." : `Setujui Semua (${keuanganCount})`}
              </button>
            )}
            {approvedCount > 0 && canAct("Paid") && (
              <button onClick={() => handleBatchStatus("Paid")} disabled={batchSaving !== null}
                className="px-3 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50">
                {batchSaving === "Paid" ? "Memproses..." : `Tandai Dibayar (${approvedCount})`}
              </button>
            )}
            {bankTransferRows.length > 0 && (
              <ExportExcelButton filename="Transfer_Bank_Payroll" sheetName="Transfer Bank" rows={bankTransferRows} label="Export Transfer Bank" />
            )}
            {(currentRole === "hrd" || currentRole === "superadmin") && (
              <button onClick={() => { setShowGen(true); setMsg(null); setGenResult(null); }}
                disabled={totalEmployees === 0}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 disabled:opacity-50">
                <Plus size={14} /> Generate Payroll
              </button>
            )}
          </div>
        </div>

        {payrolls.length === 0 ? (
          <EmptyState icon={DollarSign} title="Belum ada data payroll."
            description="Pastikan Komponen Gaji tiap karyawan sudah diisi (menu Komponen Gaji), lalu klik Generate Payroll di atas untuk membuat slip gaji seluruh karyawan aktif." />
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
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_COLOR[p.status as string] || "bg-slate-50 text-slate-600"}`}>
                          {STATUS_LABEL[p.status as string] || String(p.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "Draft" && (currentRole === "hrd" || currentRole === "superadmin") && (
                            <button onClick={() => openEdit(p)} title="Edit bonus/potongan"
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                              <Edit3 size={13} />
                            </button>
                          )}
                          {NEXT_STATUS[p.status as string] && canAct(NEXT_STATUS[p.status as string]) && (
                            <button onClick={() => handleStatusChange(p.id as string, NEXT_STATUS[p.status as string])} disabled={busy}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md hover:bg-blue-100 disabled:opacity-50 flex items-center gap-1">
                              {NEXT_STATUS[p.status as string] === "Paid" && <CheckCircle2 size={11} />}
                              {ACTION_LABEL[NEXT_STATUS[p.status as string]]}
                            </button>
                          )}
                          {NEXT_STATUS[p.status as string] && !canAct(NEXT_STATUS[p.status as string]) && (
                            <span className="text-[10px] text-slate-400 italic">Menunggu {ACTION_LABEL[NEXT_STATUS[p.status as string]]}</span>
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

      {/* Edit Payroll Modal — HRD only views/verifies the computed breakdown and
          edits Bonus/Potongan Lain; every other figure (tunjangan, lembur,
          BPJS, pajak, kasbon) is read-only, sourced from other modules. */}
      {showEdit && (() => {
        const p = detail?.payroll || showEdit;
        const emp = detail?.employee || (showEdit.karyawan as Record<string, string> | undefined);
        const num = (k: string) => Number(p[k]) || 0;
        const tunjanganComponents = (detail?.components || []).filter((c) => c.tipe === "tunjangan");
        const scheduledPotongan = (detail?.components || []).filter((c) => c.tipe === "potongan");
        const extraIncomeRows = [
          { label: "Tunjangan Kehadiran", value: num("attendance_allowance"), source: "Absensi" },
          { label: "Tunjangan Shift", value: num("shift_allowance"), source: "Jadwal Shift" },
        ].filter((r) => r.value > 0);
        const totalPendapatan = num("gross_salary") || (num("basic_salary") + num("allowances") + num("bonus") + num("kpi_bonus") + num("overtime_pay") + num("attendance_allowance") + num("shift_allowance"));
        const totalPotongan = num("tax") + num("bpjs_health") + num("bpjs_employment") + num("deductions") + num("kasbon_deduction") + num("late_deduction") + num("absent_deduction") + num("early_leave_deduction");
        const netDisplay = num("net_salary") || (totalPendapatan - totalPotongan);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEdit(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 bg-slate-900 flex items-center justify-between shrink-0">
                <h3 className="text-white font-bold text-sm flex items-center gap-2"><Edit3 size={14} /> Edit Payroll (Draft)</h3>
                <button onClick={() => setShowEdit(null)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
              </div>
              <div className="p-6 space-y-5 overflow-y-auto">
                {/* Informasi Karyawan */}
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Nama</p><p className="text-xs font-bold text-slate-800">{emp?.full_name || "-"}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">NIK</p><p className="text-xs font-bold text-slate-800">{(detail?.employee?.nik) || "-"}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Jabatan</p><p className="text-xs font-bold text-slate-800">{emp?.position || "-"}</p></div>
                  <div><p className="text-[9px] font-bold text-slate-400 uppercase">Periode</p><p className="text-xs font-bold text-slate-800">{MONTHS[Number(showEdit.month)]} {String(showEdit.year)}</p></div>
                </div>

                {detailLoading && <p className="text-xs text-slate-400 text-center py-4">Memuat rincian payroll...</p>}

                {/* Daftar Tunjangan — dilihat dari Komponen Gaji, tidak diinput ulang */}
                {tunjanganComponents.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-700 uppercase mb-2 flex items-center gap-1.5"><Wallet size={12} /> Daftar Tunjangan</h4>
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase">
                            <th className="px-3 py-2 text-left">Nama Tunjangan</th>
                            <th className="px-3 py-2 text-left">Kena PPh21</th>
                            <th className="px-3 py-2 text-right">Nominal</th>
                            <th className="px-3 py-2 text-left">Sumber Data</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {tunjanganComponents.map((c) => (
                            <tr key={c.komponen_id}>
                              <td className="px-3 py-2 font-semibold text-slate-700">{c.nama}</td>
                              <td className="px-3 py-2 text-slate-500">{c.taxable ? "Ya" : "Tidak"}</td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-600">Rp {fmt(c.jumlah)}</td>
                              <td className="px-3 py-2 text-slate-400">Komponen Gaji</td>
                            </tr>
                          ))}
                          {extraIncomeRows.map((r) => (
                            <tr key={r.label}>
                              <td className="px-3 py-2 font-semibold text-slate-700">{r.label}</td>
                              <td className="px-3 py-2 text-slate-500">-</td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-600">Rp {fmt(r.value)}</td>
                              <td className="px-3 py-2 text-slate-400">{r.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Ringkasan Payroll — seluruhnya otomatis, HRD hanya memantau */}
                <div>
                  <h4 className="text-[11px] font-extrabold text-slate-700 uppercase mb-2 flex items-center gap-1.5"><FileText size={12} /> Ringkasan Payroll (Otomatis)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-emerald-100 bg-emerald-50/40 rounded-xl p-3 space-y-1.5">
                      <p className="text-[9px] font-bold text-emerald-700 uppercase mb-1">Pendapatan</p>
                      {[
                        ["Gaji Pokok", num("basic_salary")],
                        ["Total Tunjangan", num("allowances")],
                        ["Lembur", num("overtime_pay")],
                        ["Tunjangan Kehadiran", num("attendance_allowance")],
                        ["Tunjangan Shift", num("shift_allowance")],
                        ["Bonus KPI", num("kpi_bonus")],
                      ].filter(([, v]) => (v as number) !== 0).map(([label, v]) => (
                        <div key={label as string} className="flex justify-between text-[11px]">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-semibold text-slate-700">Rp {fmt(v as number)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[11px] pt-1.5 border-t border-emerald-100 font-bold text-emerald-700">
                        <span>Total Pendapatan</span><span>Rp {fmt(totalPendapatan)}</span>
                      </div>
                    </div>
                    <div className="border border-red-100 bg-red-50/40 rounded-xl p-3 space-y-1.5">
                      <p className="text-[9px] font-bold text-red-700 uppercase mb-1">Potongan</p>
                      {[
                        ["BPJS Kesehatan", num("bpjs_health")],
                        ["BPJS Ketenagakerjaan", num("bpjs_employment")],
                        ["PPh 21", num("tax")],
                        ["Kasbon / Pinjaman", num("kasbon_deduction")],
                        ["Potongan Lain", num("deductions")],
                        ["Keterlambatan", num("late_deduction")],
                        ["Pulang Cepat", num("early_leave_deduction")],
                        ["Absen Tanpa Keterangan", num("absent_deduction")],
                      ].filter(([, v]) => (v as number) !== 0).map(([label, v]) => (
                        <div key={label as string} className="flex justify-between text-[11px]">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-semibold text-slate-700">Rp {fmt(v as number)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-[11px] pt-1.5 border-t border-red-100 font-bold text-red-700">
                        <span>Total Potongan</span><span>Rp {fmt(totalPotongan)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {detail?.kasbon && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
                    <Landmark size={13} className="mt-0.5 shrink-0" />
                    <span>
                      Kasbon status <strong>{detail.kasbon.status}</strong> — sisa pokok Rp {fmt(detail.kasbon.sisa_pokok)}.
                      Potongan cicilan periode ini sudah otomatis masuk ke Ringkasan Payroll dan hanya bisa diubah dari menu Kasbon.
                    </span>
                  </div>
                )}
                {scheduledPotongan.length > 0 && (
                  <p className="text-[10px] text-slate-400">
                    Potongan terjadwal dari Komponen Gaji ({scheduledPotongan.map((c) => c.nama).join(", ")}) sudah termasuk dalam Potongan Lain di bawah.
                  </p>
                )}

                {/* Editable — satu-satunya field yang boleh diubah HRD */}
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

                <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Take Home Pay</span>
                  <span className="text-lg font-extrabold text-white">Rp {fmt(netDisplay)}</span>
                </div>

                {/* Riwayat Perubahan Payroll */}
                {(detail?.history?.length || 0) > 0 && (
                  <div>
                    <h4 className="text-[11px] font-extrabold text-slate-700 uppercase mb-2 flex items-center gap-1.5"><History size={12} /> Riwayat Perubahan</h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {detail!.history.map((h) => (
                        <div key={h.id as string} className="flex items-start justify-between text-[10px] bg-slate-50 rounded-lg px-3 py-2">
                          <div>
                            <span className="font-bold text-slate-700">{HISTORY_ACTION_LABEL[h.action as string] || String(h.action)}</span>
                            <span className="text-slate-400"> oleh {String(h.changed_by_name || "-")}</span>
                          </div>
                          <span className="text-slate-400 shrink-0 ml-2">{fmtDateTime(h.changed_at as string)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-3 text-[10px] text-slate-500">
                  Gaji bersih akan dihitung ulang otomatis. PPh 21, BPJS, tunjangan, lembur, dan kasbon tidak dapat diedit di sini (dihitung sistem dari modul lain).
                </div>
                {msg && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
                )}
              </div>
              <div className="flex gap-3 p-6 pt-0 shrink-0">
                <button onClick={() => setShowEdit(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold">Batal</button>
                <button onClick={handleEditSave} disabled={saving}
                  className="flex-1 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Payment Confirmation Modal — collects transfer metadata before "Paid" */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-emerald-700 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><CheckCircle2 size={14} /> Konfirmasi Pembayaran</h3>
              <button onClick={() => setPayModal(null)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500">
                {payModal.mode === "batch" ? "Menandai semua payroll Disetujui bulan ini sebagai Dibayar." : "Menandai slip gaji ini sebagai Dibayar."}
              </p>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Metode Pembayaran <span className="text-red-500">*</span></label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                  <option>Transfer Bank</option>
                  <option>Tunai</option>
                  <option>Cek/Giro</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Transfer</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nomor Referensi</label>
                <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="cth. TRX-20260830-001"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan</label>
                <textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={2}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none resize-none" />
              </div>
              {msg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setPayModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold">Batal</button>
                <button onClick={handleConfirmPayment} disabled={saving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                  {saving ? "Memproses..." : "Konfirmasi Dibayar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
