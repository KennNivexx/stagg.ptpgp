"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FileText, Clock, CheckCircle2, XCircle, Users, Trash2, Plus,
  Eye, X, ChevronRight, Briefcase, Tag, AlignLeft, AlertCircle,
  CalendarClock, History, GraduationCap, ListChecks, Award,
  Search, Copy, Pencil, Ban, Wallet, Building2, Paperclip, Wrench,
  Upload, Download, DollarSign,
} from "lucide-react";
import {
  getRequests, addRequest, updateRequestStatus, deleteRequest, getRequestHistory,
  editRequest, cloneRequest, cancelRequest, setFinanceRequired, approveFinance,
  advanceRecruitmentStage, addRequestDocument, removeRequestDocument, bulkImportRequests,
  type RequestHistoryEntry, type DocumentEntry,
} from "@/app/actions/requests";
import { runManpowerValidation } from "@/app/actions/manpower-validation";
import { initManpowerApproval, getManpowerApprovalStatus, decideManpowerApprovalStep } from "@/app/actions/manpower-approval";
import { RECRUITMENT_STAGES } from "@/lib/workforce-constants";
import { getJobDescsForPosition, type JobDesc } from "@/app/actions/jobdesc";
import { getJobSpecsForDepartment, type JobSpec } from "@/app/actions/jobspec";
import { getDeptRequiredSkills } from "@/app/actions/skills";
import { getOrgBreadcrumb } from "@/app/actions/department";
import { uploadFileToStorage } from "@/lib/storage-upload";
import ExportExcelButton from "@/components/ExportExcelButton";
import EmptyState from "@/components/EmptyState";
import * as XLSX from "xlsx";

interface Request {
  id: string; department: string; position: string; quantity: number;
  reason: string; urgency: string; status: string; requested_by: string;
  created_at: string; grade_code?: string; job_desc?: string;
  request_type?: string; need_by_date?: string; rejection_reason?: string;
  site_location?: string; cost_center?: string;
  salary_range_min?: number; salary_range_max?: number;
  budget_recruitment?: number; budget_available?: boolean; budget_approved_by?: string;
  kpi_jabatan?: string; document_urls?: DocumentEntry[];
  finance_required?: boolean; finance_approved?: boolean;
  finance_approved_by?: string; finance_approved_at?: string;
  recruitment_stage?: string; cancel_reason?: string; required_license?: string;
  request_type_id?: string | null; reason_category_id?: string | null; employment_type_id?: string | null;
  validation_result?: { checks: { key: string; label: string; status: string; message: string }[]; overallStatus: string; computedAt: string } | null;
}

interface MasterOption { id: string; code: string; name: string }

interface Props {
  departments: string[];
  positions: string[];
  userRole: string;
  userName: string;
  requestTypes: MasterOption[];
  requestReasons: MasterOption[];
  employmentTypes: MasterOption[];
}

const URGENCY_OPTS = ["Rendah", "Sedang", "Tinggi"];
const REQUEST_TYPE_OPTS = ["Posisi Baru", "Replacement", "Promosi", "Mutasi", "Pensiun", "Sementara"];
const STATUS_OPTS = ["Draft", "Pending", "Menunggu Finance", "Direview Direktur", "Disetujui", "Ditolak", "Dibatalkan"];

function fmtCurrency(n?: number): string {
  if (!n && n !== 0) return "-";
  return "Rp " + n.toLocaleString("id-ID");
}

// Sama seperti getRoleLabel di src/app/superadmin/employees/UserTable.tsx — role
// mentah dari database ("hrd", "department_manager") tidak boleh bocor ke UI.
function roleLabel(role?: string | null): string {
  switch (role) {
    case "superadmin": return "Superadmin";
    case "hrd": return "HRD";
    case "director": return "Direktur";
    case "department_manager": return "Manajer Departemen";
    case "employee": return "Karyawan";
    case "system": return "Sistem";
    default: return role || "";
  }
}

function slaInfo(needByDate?: string): { label: string; className: string; daysLeft: number } | null {
  if (!needByDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(needByDate); target.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: `Terlewat ${Math.abs(daysLeft)} hari`, className: "bg-red-50 text-red-700 border-red-200", daysLeft };
  if (daysLeft <= 3) return { label: `Sisa ${daysLeft} hari`, className: "bg-amber-50 text-amber-700 border-amber-200", daysLeft };
  return { label: `Sisa ${daysLeft} hari`, className: "bg-emerald-50 text-emerald-700 border-emerald-200", daysLeft };
}

export default function RequestsClient({ departments, positions, userRole, userName, requestTypes, requestReasons, employmentTypes }: Props) {
  const [data, setData] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<Request | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [customPosition, setCustomPosition] = useState(false);
  const [history, setHistory] = useState<RequestHistoryEntry[]>([]);
  const [refJobDescs, setRefJobDescs] = useState<JobDesc[]>([]);
  const [refJobSpecs, setRefJobSpecs] = useState<JobSpec[]>([]);
  const [refSkills, setRefSkills] = useState<{ id: string; name: string; category: string }[]>([]);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [orgBreadcrumb, setOrgBreadcrumb] = useState<string[]>([]);
  const [financeRejectFor, setFinanceRejectFor] = useState<string | null>(null);
  const [financeRejectNote, setFinanceRejectNote] = useState("");
  const [editTarget, setEditTarget] = useState<Request | null>(null);
  const [cancelFor, setCancelFor] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [approvalSteps, setApprovalSteps] = useState<Awaited<ReturnType<typeof getManpowerApprovalStatus>>>([]);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search
  const [fStatus, setFStatus] = useState<string[]>([]);
  const [fDept, setFDept] = useState("");
  const [fUrgency, setFUrgency] = useState("");
  const [fType, setFType] = useState("");
  const [fSearch, setFSearch] = useState("");

  const closeForm = () => {
    setShowForm(false);
    setCustomPosition(false);
    setEditTarget(null);
  };

  const openEdit = (req: Request) => {
    setEditTarget(req);
    // If the position isn't in the known list (e.g. a custom-typed position
    // from a previous submission), the custom text input must be the ONLY
    // active "position" field — otherwise both it and the <select> render
    // with name="position" at once, and FormData.get("position") silently
    // returns the select's empty value instead of the real typed position.
    setCustomPosition(!positions.includes(req.position));
    setShowForm(true);
    if (detail) closeDetail();
  };

  const toggleStatusFilter = (s: string) => {
    setFStatus(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const filtered = data.filter(r => {
    if (fStatus.length > 0 && !fStatus.includes(r.status)) return false;
    if (fDept && r.department !== fDept) return false;
    if (fUrgency && r.urgency !== fUrgency) return false;
    if (fType && r.request_type !== fType) return false;
    if (fSearch) {
      const q = fSearch.toLowerCase();
      const hay = `${r.position} ${r.department} ${r.requested_by} ${r.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const isManager = userRole === "department_manager" || userRole === "superadmin";
  const isHRD = userRole === "hrd" || userRole === "superadmin";
  const isDirector = userRole === "director" || userRole === "superadmin";

  useEffect(() => { getRequests().then(setData).finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (!detail) return;
    getRequestHistory(detail.id).then(setHistory).catch(() => setHistory([]));
    getJobDescsForPosition(detail.position).then(setRefJobDescs).catch(() => setRefJobDescs([]));
    getJobSpecsForDepartment(detail.department).then(setRefJobSpecs).catch(() => setRefJobSpecs([]));
    getDeptRequiredSkills(detail.department).then(setRefSkills).catch(() => setRefSkills([]));
    getOrgBreadcrumb(detail.department).then(setOrgBreadcrumb).catch(() => setOrgBreadcrumb([]));
    getManpowerApprovalStatus(detail.id).then(setApprovalSteps).catch(() => setApprovalSteps([]));
  }, [detail?.id, detail?.position, detail?.department]);

  const doStartApproval = async (id: string) => {
    setApprovalBusy(true);
    const res = await initManpowerApproval(id);
    setApprovalBusy(false);
    if ("error" in res) { showToast(res.error); return; }
    showToast("Approval Workflow dimulai.");
    getManpowerApprovalStatus(id).then(setApprovalSteps);
  };

  const doDecideApprovalStep = async (id: string, stepNumber: number, approved: boolean) => {
    let notes: string | undefined;
    if (!approved) {
      notes = prompt("Alasan penolakan:") || "";
      if (!notes.trim()) return;
    }
    setApprovalBusy(true);
    const res = await decideManpowerApprovalStep(id, stepNumber, approved, notes);
    setApprovalBusy(false);
    if ("error" in res) { showToast(res.error); return; }
    showToast(approved ? "Tahap disetujui." : "Tahap ditolak.");
    getManpowerApprovalStatus(id).then(setApprovalSteps);
    refreshDetail(id);
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const refreshDetail = async (id: string) => {
    const list = await getRequests();
    setData(list);
    const updated = list.find(r => r.id === id);
    if (updated) setDetail(updated);
    getRequestHistory(id).then(setHistory).catch(() => {});
  };

  const closeDetail = () => {
    setDetail(null);
    setHistory([]); setRefJobDescs([]); setRefJobSpecs([]); setRefSkills([]); setOrgBreadcrumb([]);
  };

  const doToggleFinanceRequired = async (id: string, required: boolean) => {
    const result = await setFinanceRequired(id, required);
    if ("error" in result) { showToast(result.error); return; }
    showToast(required ? "Approval Finance diaktifkan." : "Approval Finance dinonaktifkan.");
    refreshDetail(id);
  };

  const doRevalidate = async (id: string) => {
    const result = await runManpowerValidation(id);
    if ("error" in result) { showToast(result.error); return; }
    showToast("Validation Engine diperbarui.");
    refreshDetail(id);
  };

  const doApproveFinance = async (id: string) => {
    const result = await approveFinance(id, true);
    if ("error" in result) { showToast(result.error); return; }
    showToast("Finance menyetujui permintaan ini.");
    refreshDetail(id);
  };

  const doRejectFinance = async () => {
    if (!financeRejectFor) return;
    if (!financeRejectNote.trim()) { showToast("Alasan penolakan Finance wajib diisi."); return; }
    const result = await approveFinance(financeRejectFor, false, financeRejectNote.trim());
    if ("error" in result) { showToast(result.error); return; }
    showToast("Ditolak oleh Finance.");
    setData(prev => prev.map(r => r.id === financeRejectFor ? { ...r, status: "Ditolak", rejection_reason: financeRejectNote.trim() } : r));
    setFinanceRejectFor(null); setFinanceRejectNote("");
    refreshDetail(financeRejectFor);
  };

  const doAdvanceStage = async (id: string, stage: string) => {
    const result = await advanceRecruitmentStage(id, stage);
    if ("error" in result) { showToast(result.error); return; }
    refreshDetail(id);
  };

  const doClone = async (id: string) => {
    const result = await cloneRequest(id);
    if ("error" in result) { showToast(result.error); return; }
    showToast("Permintaan diduplikat sebagai Draft.");
    getRequests().then(setData);
  };

  const doCancel = async () => {
    if (!cancelFor) return;
    const result = await cancelRequest(cancelFor, cancelNote.trim());
    if ("error" in result) { showToast(result.error); return; }
    showToast("Permintaan dibatalkan.");
    setData(prev => prev.map(r => r.id === cancelFor ? { ...r, status: "Dibatalkan" } : r));
    setCancelFor(null); setCancelNote("");
    if (detail?.id === cancelFor) refreshDetail(cancelFor);
  };

  const doUploadDoc = async (id: string, file: File) => {
    setUploading(true);
    const res = await uploadFileToStorage(file, "hrd-files", `workforce-requests/${id}`, { maxSizeMB: 20 });
    setUploading(false);
    if ("error" in res) { showToast(res.error); return; }
    const result = await addRequestDocument(id, { name: file.name, url: res.url });
    if ("error" in result) { showToast(result.error); return; }
    showToast("Dokumen berhasil diunggah.");
    refreshDetail(id);
  };

  const doRemoveDoc = async (id: string, url: string) => {
    if (!confirm("Hapus dokumen ini?")) return;
    await removeRequestDocument(id, url);
    refreshDetail(id);
  };

  const doSubmitDraft = async (req: Request) => {
    const fd = new FormData();
    fd.set("department", req.department);
    fd.set("position", req.position);
    fd.set("quantity", String(req.quantity || 1));
    fd.set("urgency", req.urgency || "Sedang");
    fd.set("reason", req.reason || "");
    if (req.grade_code) fd.set("grade_code", req.grade_code);
    if (req.job_desc) fd.set("job_desc", req.job_desc);
    if (req.request_type) fd.set("request_type", req.request_type);
    if (req.need_by_date) fd.set("need_by_date", req.need_by_date);
    const result = await editRequest(req.id, fd, true);
    if ("error" in result) { showToast(result.error); return; }
    showToast("Draft diajukan.");
    refreshDetail(req.id);
    getRequests().then(setData);
  };

  const doImportExcel = async (file: File) => {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const payload = rows.map(r => ({
        department: String(r.department || r.Departemen || "").trim(),
        position: String(r.position || r.Posisi || "").trim(),
        quantity: Number(r.quantity || r.Jumlah || 1),
        urgency: String(r.urgency || r.Urgensi || "Sedang").trim(),
        reason: String(r.reason || r.Alasan || "").trim(),
        request_type: String(r.request_type || r["Jenis Permintaan"] || "").trim(),
        need_by_date: String(r.need_by_date || r["Need By Date"] || "").trim(),
      }));
      const result = await bulkImportRequests(payload);
      setImporting(false);
      if ("error" in result) { showToast(result.error); return; }
      showToast(`${result.imported} permintaan diimpor sebagai Draft${result.failed ? `, ${result.failed} gagal` : ""}.`);
      getRequests().then(setData);
    } catch {
      setImporting(false);
      showToast("Gagal membaca file Excel. Pastikan format kolom sesuai.");
    }
  };

  const doStatus = async (id: string, status: string, note?: string) => {
    const result = await updateRequestStatus(id, status, note);
    if ("error" in result) { showToast(result.error as string); return; }
    setData(prev => {
      const req = prev.find(r => r.id === id);
      if (status === "Disetujui" && req) showToast(`Disetujui! Headcount ${req.department} +${req.quantity}.`);
      else if (status === "Direview Direktur") showToast("Diteruskan ke Direktur.");
      else if (status === "Ditolak") showToast("Permintaan ditolak.");
      return prev.map(r => r.id === id ? { ...r, status, ...(note ? { rejection_reason: note } : {}) } : r);
    });
    if (detail?.id === id) setDetail(prev => prev ? { ...prev, status, ...(note ? { rejection_reason: note } : {}) } : prev);
    if (detail?.id === id) getRequestHistory(id).then(setHistory).catch(() => {});
  };

  const doReject = async () => {
    if (!rejectFor) return;
    if (!rejectNote.trim()) { showToast("Alasan penolakan wajib diisi."); return; }
    await doStatus(rejectFor, "Ditolak", rejectNote.trim());
    setRejectFor(null);
    setRejectNote("");
  };

  const doDelete = async (id: string) => {
    if (!confirm("Hapus permintaan ini?")) return;
    const result = await deleteRequest(id);
    if (result?.error) { showToast(result.error); return; }
    setData(prev => prev.filter(r => r.id !== id));
    if (detail?.id === id) closeDetail();
    showToast("Permintaan dihapus.");
  };

  const doSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const asDraft = submitter?.value === "draft";
    setSubmitting(true);
    const fd = new FormData(formRef.current);
    fd.set("requested_by", userName);

    const result = editTarget
      ? await editRequest(editTarget.id, fd, !asDraft)
      : await addRequest(fd, asDraft);
    setSubmitting(false);
    if ("error" in result) { showToast(result.error); return; }
    showToast(editTarget ? (asDraft ? "Perubahan disimpan sebagai Draft." : "Permintaan direvisi & diajukan ulang.") : (asDraft ? "Disimpan sebagai Draft." : "Permintaan berhasil diajukan."));
    closeForm();
    formRef.current?.reset();
    getRequests().then(setData);
  };

  const pending = data.filter(r => r.status === "Pending").length;
  const approved = data.filter(r => r.status === "Disetujui").length;
  const rejected = data.filter(r => r.status === "Ditolak").length;

  const urgencyClass = (u: string) =>
    u === "Tinggi" ? "bg-red-50 text-red-700 border-red-200"
    : u === "Sedang" ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-blue-50 text-blue-700 border-blue-200";

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      Draft: "bg-slate-100 text-slate-500 border-slate-200",
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      "Menunggu Finance": "bg-purple-50 text-purple-700 border-purple-200",
      "Direview Direktur": "bg-blue-50 text-blue-700 border-blue-200",
      Disetujui: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Ditolak: "bg-red-50 text-red-700 border-red-200",
      Dibatalkan: "bg-slate-100 text-slate-500 border-slate-300",
    };
    return m[s] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  const exportRows = filtered.map(r => ({
    ID: r.id, Departemen: r.department, Posisi: r.position, Jumlah: r.quantity,
    Urgensi: r.urgency, "Jenis Permintaan": r.request_type || "", Status: r.status,
    "Need By Date": r.need_by_date || "", "Diajukan Oleh": r.requested_by,
    "Tanggal Diajukan": new Date(r.created_at).toLocaleDateString("id-ID"),
    Alasan: r.reason,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-1">Pengajuan SDM</h1>
          <p className="text-sm text-gray-500">Ajukan dan pantau permintaan penambahan tenaga kerja.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportExcelButton rows={exportRows} filename="permintaan-sdm" sheetName="Permintaan SDM" />
          {isHRD && (
            <>
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) doImportExcel(f); e.target.value = ""; }}
              />
              <button
                onClick={() => importInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                <Upload size={14} /> {importing ? "Mengimpor..." : "Impor Excel"}
              </button>
            </>
          )}
          {isManager && (
            <button
              onClick={() => { setEditTarget(null); setCustomPosition(false); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#CC0000] hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
            >
              <Plus size={15} /> Ajukan SDM
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              value={fSearch}
              onChange={e => setFSearch(e.target.value)}
              placeholder="Cari posisi, departemen, pemohon, atau ID..."
              className="flex-1 min-w-0 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20"
            />
          </div>
          <div className="grid grid-cols-3 sm:flex gap-2 shrink-0">
            <select value={fDept} onChange={e => setFDept(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-2 py-2 min-w-0">
              <option value="">Semua Departemen</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={fUrgency} onChange={e => setFUrgency(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-2 py-2 min-w-0">
              <option value="">Semua Urgensi</option>
              {URGENCY_OPTS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select value={fType} onChange={e => setFType(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-2 py-2 min-w-0">
              <option value="">Semua Jenis</option>
              {REQUEST_TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTS.map(s => (
            <button
              key={s}
              onClick={() => toggleStatusFilter(s)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${fStatus.includes(s) ? statusBadge(s) + " ring-2 ring-offset-1 ring-slate-300" : "bg-white text-slate-400 border-slate-200"}`}
            >
              {s}
            </button>
          ))}
          {(fStatus.length > 0 || fDept || fUrgency || fType || fSearch) && (
            <button onClick={() => { setFStatus([]); setFDept(""); setFUrgency(""); setFType(""); setFSearch(""); }} className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-600">
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: data.length, icon: <FileText size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", value: pending, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Disetujui", value: approved, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", value: rejected, icon: <XCircle size={18} />, color: "bg-red-50 text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Permintaan</h3>
          <span className="text-[10px] text-slate-400">{filtered.length} dari {data.length} · Klik baris untuk lihat detail</span>
        </div>
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#CC0000] mx-auto mb-2" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada permintaan yang cocok." />
          ) : filtered.map(req => (
            <div
              key={req.id}
              className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
              onClick={() => setDetail(req)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{req.position}</span>
                    {req.grade_code && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-violet-50 text-violet-700 border-violet-200">
                        Grade {req.grade_code}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${urgencyClass(req.urgency)}`}>
                      {req.urgency}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${statusBadge(req.status)}`}>
                      {req.status}
                    </span>
                    {req.status !== "Disetujui" && req.status !== "Ditolak" && slaInfo(req.need_by_date) && (
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center gap-1 ${slaInfo(req.need_by_date)!.className}`}>
                        <CalendarClock size={9} /> {slaInfo(req.need_by_date)!.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Users size={10} /> {req.department}</span>
                    <span>Jumlah: {req.quantity}</span>
                    {req.requested_by && <span>{req.requested_by}</span>}
                  </p>
                  {req.reason && (
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-md">{req.reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setDetail(req)}
                    className="p-1.5 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600 transition-colors"
                    title="Lihat detail"
                  >
                    <Eye size={13} />
                  </button>
                  {(isManager || isHRD) && ["Draft", "Ditolak"].includes(req.status) && (
                    <button onClick={() => openEdit(req)} className="p-1.5 hover:bg-amber-50 rounded text-amber-500 transition-colors" title="Revisi">
                      <Pencil size={13} />
                    </button>
                  )}
                  {(isManager || isHRD) && (
                    <button onClick={() => doClone(req.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors" title="Duplikat">
                      <Copy size={13} />
                    </button>
                  )}
                  {(isManager || isHRD) && ["Draft", "Pending", "Menunggu Finance", "Direview Direktur"].includes(req.status) && (
                    <button onClick={() => setCancelFor(req.id)} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 transition-colors" title="Batalkan">
                      <Ban size={13} />
                    </button>
                  )}
                  {(isHRD || isDirector) && (
                    <button onClick={() => doDelete(req.id)} className="p-1.5 hover:bg-red-50 rounded text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Detail Modal ─────────────────────────────────────────── */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-800">{detail.position}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{detail.department} · {new Date(detail.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <button onClick={closeDetail} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${statusBadge(detail.status)}`}>
                  {detail.status}
                </span>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${urgencyClass(detail.urgency)}`}>
                  Urgensi: {detail.urgency}
                </span>
                <span className="px-2 py-1 rounded-lg text-xs font-bold border bg-slate-50 text-slate-700 border-slate-200">
                  Jumlah: {detail.quantity} orang
                </span>
                {detail.request_type && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                    {detail.request_type}
                  </span>
                )}
                {detail.required_license && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold border bg-cyan-50 text-cyan-700 border-cyan-200">
                    Butuh {detail.required_license}
                  </span>
                )}
                {slaInfo(detail.need_by_date) && (
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${slaInfo(detail.need_by_date)!.className}`}>
                    <CalendarClock size={12} /> {slaInfo(detail.need_by_date)!.label}
                  </span>
                )}
              </div>

              {/* Need By Date */}
              {detail.need_by_date && (
                <div className="flex gap-3">
                  <div className="p-2 bg-cyan-50 rounded-lg shrink-0"><CalendarClock size={15} className="text-cyan-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Need By Date</p>
                    <p className="text-sm font-bold text-slate-800">{new Date(detail.need_by_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              )}

              {/* Grade Code */}
              {detail.grade_code && (
                <div className="flex gap-3">
                  <div className="p-2 bg-violet-50 rounded-lg shrink-0"><Tag size={15} className="text-violet-500" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Kode Grade</p>
                    <p className="text-sm font-bold text-slate-800">{detail.grade_code}</p>
                  </div>
                </div>
              )}

              {/* Job Description */}
              {detail.job_desc && (
                <div className="flex gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0"><Briefcase size={15} className="text-blue-500" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Deskripsi Pekerjaan</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{detail.job_desc}</p>
                  </div>
                </div>
              )}

              {/* Reason */}
              {detail.reason && (
                <div className="flex gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg shrink-0"><AlignLeft size={15} className="text-amber-500" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Alasan Pengajuan</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{detail.reason}</p>
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {detail.status === "Ditolak" && detail.rejection_reason && (
                <div className="flex gap-3 bg-red-50/50 border border-red-100 rounded-xl p-3">
                  <div className="p-2 bg-red-50 rounded-lg shrink-0"><XCircle size={15} className="text-red-500" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-red-400 uppercase mb-0.5">Alasan Penolakan</p>
                    <p className="text-sm text-red-700 whitespace-pre-wrap leading-relaxed">{detail.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Organisasi & Lokasi */}
              {(orgBreadcrumb.length > 0 || detail.site_location || detail.cost_center) && (
                <div className="flex gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg shrink-0"><Building2 size={15} className="text-slate-500" /></div>
                  <div className="min-w-0 text-xs text-slate-600 space-y-1">
                    {orgBreadcrumb.length > 0 && (
                      <p><span className="font-bold text-slate-700">Struktur Organisasi:</span> {orgBreadcrumb.join(" › ")}</p>
                    )}
                    {detail.site_location && <p><span className="font-bold text-slate-700">Lokasi/Site:</span> {detail.site_location}</p>}
                    {detail.cost_center && <p><span className="font-bold text-slate-700">Cost Center:</span> {detail.cost_center}</p>}
                  </div>
                </div>
              )}

              {/* Budget Kebutuhan SDM */}
              {(detail.salary_range_min || detail.salary_range_max || detail.budget_recruitment || detail.budget_approved_by) && (
                <div className="flex gap-3">
                  <div className="p-2 bg-teal-50 rounded-lg shrink-0"><Wallet size={15} className="text-teal-500" /></div>
                  <div className="min-w-0 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-700">Budget Kebutuhan SDM</p>
                    {(detail.salary_range_min || detail.salary_range_max) && (
                      <p>Range Gaji: {fmtCurrency(detail.salary_range_min)} – {fmtCurrency(detail.salary_range_max)}</p>
                    )}
                    {detail.budget_recruitment != null && <p>Budget Rekrutmen: {fmtCurrency(detail.budget_recruitment)}</p>}
                    <p>Ketersediaan Budget: <span className={detail.budget_available ? "text-emerald-600 font-bold" : "text-red-500 font-bold"}>{detail.budget_available ? "Tersedia" : "Belum Tersedia"}</span></p>
                    {detail.budget_approved_by && <p>Disetujui oleh: {detail.budget_approved_by}</p>}
                  </div>
                </div>
              )}

              {/* Referensi Jabatan — auto dari Deskripsi/Spesifikasi Kerja & Kompetensi */}
              {(refJobDescs.length > 0 || refJobSpecs.length > 0 || refSkills.length > 0 || detail.kpi_jabatan) && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Referensi Jabatan (dari data HRD)</p>
                  {refJobDescs.map(jd => (
                    <div key={jd.id} className="flex gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg shrink-0"><ListChecks size={14} className="text-blue-500" /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700">Tanggung Jawab{jd.title ? ` — ${jd.title}` : ""}</p>
                        <ul className="text-xs text-slate-600 list-disc list-inside mt-1 space-y-0.5">
                          {jd.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>
                  ))}
                  {refJobSpecs.map(js => (
                    <div key={js.id} className="flex gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg shrink-0"><GraduationCap size={14} className="text-emerald-500" /></div>
                      <div className="min-w-0 text-xs text-slate-600 space-y-0.5">
                        {js.education && <p><span className="font-bold text-slate-700">Pendidikan:</span> {js.education}</p>}
                        {js.experience && <p><span className="font-bold text-slate-700">Pengalaman:</span> {js.experience}</p>}
                        {js.skills?.length > 0 && <p><span className="font-bold text-slate-700">Skill:</span> {js.skills.join(", ")}</p>}
                        {js.certifications?.length > 0 && <p><span className="font-bold text-slate-700">Sertifikasi:</span> {js.certifications.join(", ")}</p>}
                      </div>
                    </div>
                  ))}
                  {detail.kpi_jabatan && (
                    <div className="flex gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg shrink-0"><Award size={14} className="text-orange-500" /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700">KPI Jabatan</p>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap mt-0.5">{detail.kpi_jabatan}</p>
                      </div>
                    </div>
                  )}
                  {refSkills.filter(s => s.category !== "Teknis").length > 0 && (
                    <div className="flex gap-3">
                      <div className="p-2 bg-violet-50 rounded-lg shrink-0"><Award size={14} className="text-violet-500" /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 mb-1">Kompetensi (Core/Leadership/Functional)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {refSkills.filter(s => s.category !== "Teknis").map(s => (
                            <span key={s.id} className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-medium">{s.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {refSkills.filter(s => s.category === "Teknis").length > 0 && (
                    <div className="flex gap-3">
                      <div className="p-2 bg-cyan-50 rounded-lg shrink-0"><Wrench size={14} className="text-cyan-500" /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-700 mb-1">Tools yang Harus Dikuasai</p>
                        <div className="flex flex-wrap gap-1.5">
                          {refSkills.filter(s => s.category === "Teknis").map(s => (
                            <span key={s.id} className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-medium">{s.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Progres Rekrutmen (setelah Disetujui) */}
              {detail.status === "Disetujui" && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Progres Rekrutmen</p>
                  <div className="flex flex-wrap gap-1.5">
                    {RECRUITMENT_STAGES.map(stage => {
                      const curIdx = RECRUITMENT_STAGES.indexOf(detail.recruitment_stage || "");
                      const stageIdx = RECRUITMENT_STAGES.indexOf(stage);
                      const reached = stageIdx <= curIdx;
                      return (
                        <button
                          key={stage}
                          disabled={!isHRD}
                          onClick={() => doAdvanceStage(detail.id, stage)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${reached ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-slate-400 border-slate-200"} ${isHRD ? "cursor-pointer hover:ring-2 hover:ring-emerald-200" : "cursor-default"}`}
                        >
                          {stage}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Progres ini digerakkan manual oleh HRD — belum tersambung otomatis ke modul rekrutmen.</p>
                </div>
              )}

              {/* Finance Controller (opsional) */}
              {(isHRD || isDirector) && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><DollarSign size={12} /> Approval Finance Controller (opsional)</p>
                    {isHRD && ["Draft", "Pending"].includes(detail.status) && (
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 cursor-pointer">
                        <input type="checkbox" checked={!!detail.finance_required} onChange={e => doToggleFinanceRequired(detail.id, e.target.checked)} />
                        Wajibkan
                      </label>
                    )}
                  </div>
                  {detail.finance_required ? (
                    detail.finance_approved ? (
                      <p className="text-xs text-emerald-600 font-semibold mt-1.5">✓ Disetujui Finance oleh {detail.finance_approved_by} pada {detail.finance_approved_at ? new Date(detail.finance_approved_at).toLocaleDateString("id-ID") : "-"}</p>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => doApproveFinance(detail.id)} className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[11px] font-bold transition-colors">
                          Setujui (Finance)
                        </button>
                        <button onClick={() => setFinanceRejectFor(detail.id)} className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold transition-colors">
                          Tolak (Finance)
                        </button>
                      </div>
                    )
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">Tidak diwajibkan untuk permintaan ini.</p>
                  )}
                </div>
              )}

              {/* Validation Engine — rule-based checks computed on submit,
                  matching the app's honest "real data, not fabricated AI"
                  pattern used elsewhere (Smart Insights, AI ER Engine). */}
              {detail.validation_result && (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><ListChecks size={12} /> Validation Engine</p>
                    <button onClick={() => doRevalidate(detail.id)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700">Validasi Ulang</button>
                  </div>
                  <div className="space-y-1.5">
                    {detail.validation_result.checks.map(c => {
                      const style = c.status === "Pass" ? "bg-emerald-50 text-emerald-700"
                        : c.status === "Incomplete" ? "bg-red-50 text-red-700"
                        : c.status === "Warning" ? "bg-amber-50 text-amber-700"
                        : "bg-slate-50 text-slate-500";
                      return (
                        <div key={c.key} className={`rounded-lg px-2.5 py-1.5 text-[11px] ${style}`}>
                          <span className="font-bold">{c.label}:</span> {c.message}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">Diperbarui {new Date(detail.validation_result.computedAt).toLocaleString("id-ID")}</p>
                </div>
              )}

              {/* Approval Workflow — konfigurasi dinamis (manpower_approval_workflow),
                  bukan hardcode. Default: Dept Head/Division Head -> HRBP/HR Manager (HRD)
                  -> Finance (Kadept Finance) -> Director/CEO. */}
              {(isHRD || isDirector || isManager) && detail.status !== "Draft" && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Users size={12} /> Approval Workflow</p>
                  {approvalSteps.length === 0 ? (
                    isHRD ? (
                      <button onClick={() => doStartApproval(detail.id)} disabled={approvalBusy} className="px-3 py-1.5 bg-[#CC0000] text-white rounded-lg text-[11px] font-bold hover:bg-[#aa0000] disabled:opacity-50">
                        Mulai Approval Workflow
                      </button>
                    ) : (
                      <p className="text-[10px] text-slate-400">Approval workflow belum dimulai oleh HRD.</p>
                    )
                  ) : (
                    <div className="space-y-1.5">
                      {approvalSteps.map(s => (
                        <div key={s.step_number} className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg text-[11px]">
                          <span className="font-semibold text-slate-600">
                            {s.step_number}. {s.step_label}
                            {s.approver_department && <span className="text-slate-400"> ({s.approver_department})</span>}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold ${
                              s.status === "Approved" ? "bg-emerald-50 text-emerald-700"
                              : s.status === "Rejected" ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                            }`}>{s.status}{s.approved_by ? ` — ${s.approved_by}` : ""}</span>
                            {s.status === "Pending" && (
                              <>
                                <button onClick={() => doDecideApprovalStep(detail.id, s.step_number, true)} disabled={approvalBusy} className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded disabled:opacity-50"><CheckCircle2 size={12} /></button>
                                <button onClick={() => doDecideApprovalStep(detail.id, s.step_number, false)} disabled={approvalBusy} className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded disabled:opacity-50"><XCircle size={12} /></button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dokumen Pendukung */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><Paperclip size={12} /> Dokumen Pendukung</p>
                  {(isManager || isHRD) && (
                    <label className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer flex items-center gap-1">
                      <Upload size={11} /> {uploading ? "Mengunggah..." : "Unggah"}
                      <input
                        type="file"
                        className="hidden"
                        disabled={uploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) doUploadDoc(detail.id, f); e.target.value = ""; }}
                      />
                    </label>
                  )}
                </div>
                {detail.document_urls && detail.document_urls.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {detail.document_urls.map(doc => (
                      <div key={doc.url} className="flex items-center gap-2 text-xs bg-slate-50 rounded-lg px-2.5 py-1.5">
                        <FileText size={12} className="text-slate-400 shrink-0" />
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate flex-1 flex items-center gap-1">
                          {doc.name} <Download size={10} />
                        </a>
                        {isHRD && (
                          <button onClick={() => doRemoveDoc(detail.id, doc.url)} className="text-red-400 hover:text-red-600 shrink-0">
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">Belum ada dokumen (JD, org chart, budget approval, TOR, dll).</p>
                )}
              </div>

              {/* Riwayat */}
              {history.length > 0 && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><History size={12} /> Riwayat</p>
                  <div className="space-y-2">
                    {history.map(h => (
                      <div key={h.id} className="text-xs text-slate-500 flex items-start gap-2">
                        <span className="font-semibold text-slate-700">{h.action}</span>
                        <span className="text-slate-400">— ditandatangani oleh {h.actor_name || "-"}{h.actor_role ? ` (${roleLabel(h.actor_role)})` : ""}</span>
                        {h.note && <span className="text-slate-400 italic">&ldquo;{h.note}&rdquo;</span>}
                        <span className="text-slate-300 ml-auto shrink-0">{new Date(h.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Diajukan oleh: <span className="font-semibold text-slate-600">{detail.requested_by || "-"}</span></span>
                <span className="font-mono text-[10px]">{detail.id.slice(0, 12)}</span>
              </div>

              {/* Actions */}
              {(isHRD || isDirector || isManager) && (
                <div className="pt-2 space-y-2">
                  {(isManager || isHRD) && detail.status === "Draft" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => doSubmitDraft(detail)}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <ChevronRight size={13} /> Ajukan Sekarang
                      </button>
                      <button
                        onClick={() => openEdit(detail)}
                        className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Pencil size={13} /> Revisi
                      </button>
                    </div>
                  )}
                  {(isManager || isHRD) && detail.status === "Ditolak" && (
                    <button
                      onClick={() => openEdit(detail)}
                      className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Pencil size={13} /> Revisi & Ajukan Ulang
                    </button>
                  )}
                  {isHRD && detail.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => doStatus(detail.id, detail.finance_required ? "Menunggu Finance" : "Direview Direktur")}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <ChevronRight size={13} /> {detail.finance_required ? "Teruskan ke Finance" : "Teruskan ke Director"}
                      </button>
                      <button
                        onClick={() => setRejectFor(detail.id)}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                  {isHRD && detail.status === "Menunggu Finance" && detail.finance_approved && (
                    <button
                      onClick={() => doStatus(detail.id, "Direview Direktur")}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <ChevronRight size={13} /> Teruskan ke Director
                    </button>
                  )}
                  {isDirector && detail.status === "Direview Direktur" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => doStatus(detail.id, "Disetujui")}
                        disabled={!!detail.finance_required && !detail.finance_approved}
                        title={detail.finance_required && !detail.finance_approved ? "Menunggu approval Finance Controller" : undefined}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <CheckCircle2 size={13} /> Setujui
                      </button>
                      <button
                        onClick={() => setRejectFor(detail.id)}
                        className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                  {(isManager || isHRD) && ["Draft", "Pending", "Menunggu Finance", "Direview Direktur"].includes(detail.status) && (
                    <button
                      onClick={() => setCancelFor(detail.id)}
                      className="w-full py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Ban size={12} /> Batalkan Permintaan
                    </button>
                  )}
                  {detail.status === "Disetujui" && (
                    isHRD ? (
                      <Link
                        href={`/hrd/recruitment/new?dept=${encodeURIComponent(detail.department)}&pos=${encodeURIComponent(detail.position)}&qty=${detail.quantity}&req=${detail.id}`}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors"
                      >
                        <Plus size={13} /> Buat Lowongan Rekrutmen
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold">
                        Menunggu HRD membuat lowongan rekrutmen
                      </div>
                    )
                  )}
                  {(isHRD || isDirector) && (
                    <button
                      onClick={() => doDelete(detail.id)}
                      className="w-full py-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={12} /> Hapus Permintaan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Reason Modal ────────────────────────────────────── */}
      {rejectFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Alasan Penolakan</h3>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Jelaskan alasan penolakan permintaan ini..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { setRejectFor(null); setRejectNote(""); }} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={doReject} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors">
                Tolak Permintaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Finance Reject Modal ────────────────────────────────────── */}
      {financeRejectFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Alasan Penolakan Finance</h3>
            <textarea
              value={financeRejectNote}
              onChange={e => setFinanceRejectNote(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Jelaskan alasan penolakan dari sisi budget/finance..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { setFinanceRejectFor(null); setFinanceRejectNote(""); }} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={doRejectFinance} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors">
                Tolak Permintaan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Cancel Modal ────────────────────────────────────── */}
      {cancelFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">Batalkan Permintaan</h3>
            <textarea
              value={cancelNote}
              onChange={e => setCancelNote(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Alasan pembatalan (opsional)..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/20 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => { setCancelFor(null); setCancelNote(""); }} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors">
                Batal
              </button>
              <button onClick={doCancel} className="flex-1 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors">
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Form Modal (Ajukan SDM) ──────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-800">{editTarget ? "Revisi Permintaan SDM" : "Ajukan Permintaan SDM"}</h2>
              <button onClick={closeForm} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <form ref={formRef} onSubmit={doSubmit} className="p-6 space-y-4">
              {/* Departemen */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen <span className="text-red-500">*</span></label>
                {departments.length > 0 ? (
                  <select name="department" required defaultValue={editTarget?.department || ""} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                    <option value="">Pilih departemen</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                ) : (
                  <input name="department" required defaultValue={editTarget?.department || ""} placeholder="Nama departemen" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                )}
              </div>

              {/* Posisi + Grade berdampingan */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Posisi / Jabatan <span className="text-red-500">*</span></label>
                  {positions.length > 0 ? (
                    <>
                      <select
                        name={customPosition ? undefined : "position"}
                        required={!customPosition}
                        defaultValue={editTarget && positions.includes(editTarget.position) ? editTarget.position : ""}
                        onChange={(e) => setCustomPosition(e.target.value === "__custom__")}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
                      >
                        <option value="">Pilih posisi</option>
                        {positions.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="__custom__">+ Posisi Baru (ketik manual)</option>
                      </select>
                      {(customPosition || (editTarget && !positions.includes(editTarget.position))) && (
                        <input
                          name="position"
                          required
                          autoFocus
                          defaultValue={editTarget?.position || ""}
                          placeholder="Ketik posisi baru"
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30"
                        />
                      )}
                    </>
                  ) : (
                    <input name="position" required defaultValue={editTarget?.position || ""} placeholder="cth. Staff Ekspor" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Kode Grade
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input name="grade_code" defaultValue={editTarget?.grade_code || ""} placeholder="cth. 1.1.1.1.0.0" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                </div>
              </div>

              {/* Jenis Permintaan + Need By Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Jenis Permintaan
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                  </label>
                  <select name="request_type" defaultValue={editTarget?.request_type || ""} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                    <option value="">Pilih jenis</option>
                    {REQUEST_TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Need By Date
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input name="need_by_date" type="date" defaultValue={editTarget?.need_by_date || ""} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                </div>
              </div>

              {/* Kategori Jenis & Alasan (master data — dipakai Validation Engine
                  dan otomasi pasca-approval, terpisah dari field bebas di atas) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Kategori Jenis Permintaan
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                  </label>
                  <select name="request_type_id" defaultValue={editTarget?.request_type_id || ""} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                    <option value="">Pilih kategori</option>
                    {requestTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Kategori Alasan
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                  </label>
                  <select name="reason_category_id" defaultValue={editTarget?.reason_category_id || ""} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                    <option value="">Pilih alasan</option>
                    {requestReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Employment Type
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                </label>
                <select name="employment_type_id" defaultValue={editTarget?.employment_type_id || ""} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                  <option value="">Pilih tipe</option>
                  {employmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              {/* Jumlah + Urgensi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Jumlah <span className="text-red-500">*</span></label>
                  <input name="quantity" type="number" min={1} defaultValue={editTarget?.quantity || 1} required className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Urgensi</label>
                  <select name="urgency" defaultValue={editTarget?.urgency || "Sedang"} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                    {URGENCY_OPTS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Lokasi/Site + Cost Center */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Lokasi/Site <span className="text-[10px] font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input name="site_location" defaultValue={editTarget?.site_location || ""} placeholder="cth. Pabrik Cikarang" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    Cost Center <span className="text-[10px] font-normal text-slate-400">(opsional)</span>
                  </label>
                  <input name="cost_center" defaultValue={editTarget?.cost_center || ""} placeholder="cth. CC-1001" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                </div>
              </div>

              {/* Deskripsi Pekerjaan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Deskripsi Pekerjaan
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                </label>
                <textarea
                  name="job_desc"
                  rows={3}
                  defaultValue={editTarget?.job_desc || ""}
                  placeholder="Jelaskan tugas, tanggung jawab, dan kualifikasi yang dibutuhkan..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 resize-none"
                />
              </div>

              {/* Alasan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Alasan Pengajuan
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional)</span>
                </label>
                <textarea
                  name="reason"
                  rows={3}
                  defaultValue={editTarget?.reason || ""}
                  placeholder="Mengapa posisi ini perlu diisi? Beban kerja meningkat, ekspansi, dll."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 resize-none"
                />
              </div>

              {/* Budget Kebutuhan SDM */}
              <div className="border border-slate-100 rounded-xl p-3 space-y-3">
                <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Wallet size={12} /> Budget Kebutuhan SDM <span className="text-[10px] font-normal text-slate-400">(opsional)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  <input name="salary_range_min" type="number" defaultValue={editTarget?.salary_range_min || ""} placeholder="Gaji min (Rp)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                  <input name="salary_range_max" type="number" defaultValue={editTarget?.salary_range_max || ""} placeholder="Gaji max (Rp)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                </div>
                <input name="budget_recruitment" type="number" defaultValue={editTarget?.budget_recruitment || ""} placeholder="Budget rekrutmen (Rp)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input type="checkbox" name="budget_available" defaultChecked={!!editTarget?.budget_available} /> Budget sudah tersedia
                </label>
                {isHRD && (
                  <input name="budget_approved_by" defaultValue={editTarget?.budget_approved_by || ""} placeholder="Disetujui oleh (nama)" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30" />
                )}
              </div>

              {/* Kebutuhan SIM (untuk posisi supir) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Kebutuhan SIM
                  <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional, khusus posisi supir)</span>
                </label>
                <select name="required_license" defaultValue={editTarget?.required_license || ""} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30">
                  <option value="">Tidak diperlukan</option>
                  <option value="SIM A">SIM A</option>
                  <option value="SIM B1">SIM B1</option>
                  <option value="SIM B2">SIM B2</option>
                  <option value="SIM B3">SIM B3</option>
                  <option value="SIM C">SIM C</option>
                </select>
              </div>

              {/* KPI Jabatan (HRD) */}
              {isHRD && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">
                    KPI Jabatan
                    <span className="ml-1 text-[10px] font-normal text-slate-400">(opsional, diisi HRD)</span>
                  </label>
                  <textarea
                    name="kpi_jabatan"
                    rows={2}
                    defaultValue={editTarget?.kpi_jabatan || ""}
                    placeholder="Target KPI utama untuk posisi ini..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/30 resize-none"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700">Permintaan akan direview oleh HRD sebelum diteruskan ke Direktur untuk persetujuan akhir.</p>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button type="submit" name="intent" value="draft" disabled={submitting} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors disabled:opacity-60">
                  {submitting ? "Menyimpan..." : "Simpan Draft"}
                </button>
                <button type="submit" name="intent" value="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#CC0000] hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                  {submitting ? "Mengirim..." : editTarget ? "Ajukan Ulang" : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
