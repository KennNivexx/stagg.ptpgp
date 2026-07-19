"use client";

import { useState, useEffect } from "react";
import {
  Users, Briefcase, Clock, CheckCircle2, Plus, Send, AlertTriangle,
  X, Info, Tag, FileText, BookOpen, ChevronRight, Wallet,
} from "lucide-react";
import { getDeptData, getMyDept } from "@/app/actions/department";
import { addRequest, editRequest, cancelRequest } from "@/app/actions/requests";
import { getRequestTypeOptions, getRequestReasonOptions, getEmploymentTypeOptions, runManpowerValidation, type ValidationResult } from "@/app/actions/manpower-validation";
import { getManpowerApprovalStatus, type ApprovalStep } from "@/app/actions/manpower-approval";
import EmptyState from "@/components/EmptyState";
import { ListChecks, Users2 } from "lucide-react";

interface MasterOption { id: string; code: string; name: string }

interface Employee {
  id: string; full_name: string; email: string; department: string;
  position: string; status: string; join_date: string;
}

interface Request {
  id: string; department: string; position: string;
  quantity: number; reason: string; urgency: string; status: string;
  requested_by: string; created_at: string;
  grade_code?: string; job_desc?: string;
  request_type?: string; need_by_date?: string; rejection_reason?: string;
}

interface OrgUnitFlat {
  id: string; code: string; name: string; level: number;
  leader_name?: string | null;
}

const URGENCY = ["Tinggi", "Sedang", "Rendah"];
const REQUEST_TYPE_OPTS = [
  "Posisi Baru", "Replacement", "Tambahan Headcount", "Sementara",
  "Magang", "Outsourcing", "Rekrutmen Proyek", "Musiman",
  "Promosi", "Mutasi", "Pensiun",
];


// ─── Modal panduan + form ──────────────────────────────────────────────────────
function RequestModal({
  deptName,
  orgUnits,
  positions,
  editTarget,
  onClose,
  onSuccess,
}: {
  deptName: string;
  orgUnits: OrgUnitFlat[];
  positions: string[];
  editTarget?: Request | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fGrade, setFGrade] = useState(editTarget?.grade_code || "");
  const [fPos, setFPos] = useState(editTarget?.position || "");
  const [fQty, setFQty] = useState(editTarget?.quantity || 1);
  const [fUrgency, setFUrgency] = useState(editTarget?.urgency || "Sedang");
  const [fJobDesc, setFJobDesc] = useState(editTarget?.job_desc || "");
  const [fReason, setFReason] = useState(editTarget?.reason || "");
  const [fType, setFType] = useState(editTarget?.request_type || "");
  const [fNeedBy, setFNeedBy] = useState(editTarget?.need_by_date || "");
  const [fDept, setFDept] = useState(deptName || editTarget?.department || "");
  const [fErr, setFErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [fRequestTypeId, setFRequestTypeId] = useState((editTarget as (Request & { request_type_id?: string }) | undefined)?.request_type_id || "");
  const [fReasonCategoryId, setFReasonCategoryId] = useState((editTarget as (Request & { reason_category_id?: string }) | undefined)?.reason_category_id || "");
  const [fEmploymentTypeId, setFEmploymentTypeId] = useState((editTarget as (Request & { employment_type_id?: string }) | undefined)?.employment_type_id || "");
  const [fSalaryMin, setFSalaryMin] = useState((editTarget as (Request & { salary_range_min?: number }) | undefined)?.salary_range_min ?? "");
  const [fSalaryMax, setFSalaryMax] = useState((editTarget as (Request & { salary_range_max?: number }) | undefined)?.salary_range_max ?? "");
  const [fBudgetRecruitment, setFBudgetRecruitment] = useState((editTarget as (Request & { budget_recruitment?: number }) | undefined)?.budget_recruitment ?? "");
  const [fBudgetAvailable, setFBudgetAvailable] = useState(!!(editTarget as (Request & { budget_available?: boolean }) | undefined)?.budget_available);
  const [fRequiredLicense, setFRequiredLicense] = useState((editTarget as (Request & { required_license?: string }) | undefined)?.required_license || "");
  const [requestTypes, setRequestTypes] = useState<MasterOption[]>([]);
  const [requestReasons, setRequestReasons] = useState<MasterOption[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<MasterOption[]>([]);

  useEffect(() => {
    getRequestTypeOptions().then(setRequestTypes).catch(() => {});
    getRequestReasonOptions().then(setRequestReasons).catch(() => {});
    getEmploymentTypeOptions().then(setEmploymentTypes).catch(() => {});
  }, []);

  // Kode contoh: ambil sub-unit pertama (bukan divisi utama jika ada)
  const exampleUnit = orgUnits.length > 1 ? orgUnits[1] : orgUnits[0];
  const exampleCode = exampleUnit?.code ?? "";

  const doSubmit = async (asDraft: boolean) => {
    if (!fDept.trim()) { setFErr("Nama departemen wajib diisi."); return; }
    if (!fPos.trim()) { setFErr("Nama posisi wajib diisi."); return; }
    setLoading(true); setFErr("");
    const fd = new FormData();
    fd.append("department", fDept.trim());
    fd.append("grade_code", fGrade.trim());
    fd.append("position", fPos.trim());
    fd.append("quantity", String(fQty));
    fd.append("urgency", fUrgency);
    fd.append("job_desc", fJobDesc.trim());
    fd.append("reason", fReason.trim());
    fd.append("request_type", fType);
    fd.append("need_by_date", fNeedBy);
    fd.append("request_type_id", fRequestTypeId);
    fd.append("reason_category_id", fReasonCategoryId);
    fd.append("employment_type_id", fEmploymentTypeId);
    if (fSalaryMin !== "") fd.append("salary_range_min", String(fSalaryMin));
    if (fSalaryMax !== "") fd.append("salary_range_max", String(fSalaryMax));
    if (fBudgetRecruitment !== "") fd.append("budget_recruitment", String(fBudgetRecruitment));
    if (fBudgetAvailable) fd.append("budget_available", "on");
    fd.append("required_license", fRequiredLicense);
    const r = editTarget
      ? await editRequest(editTarget.id, fd, !asDraft)
      : await addRequest(fd, asDraft);
    setLoading(false);
    if ("error" in r && r.error) { setFErr(r.error); return; }
    onSuccess();
    onClose();
  };

  const URGENCY_META: Record<string, { color: string; dot: string }> = {
    Tinggi: { color: "bg-red-50 border-red-200 text-red-700", dot: "bg-red-500" },
    Sedang: { color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
    Rendah: { color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative z-10 w-full max-w-[860px] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        style={{ maxHeight: "calc(100vh - 32px)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── KIRI: Panduan ────────────────────────────────────────── */}
        <div className="md:w-[42%] bg-[#0a2e22] flex flex-col overflow-hidden">
          {/* Header panduan */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <BookOpen size={13} className="text-emerald-300" />
              </div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em]">Panduan Pengisian</p>
            </div>
            <h2 className="text-sm font-extrabold text-white leading-snug">Formulir Pengajuan SDM</h2>
            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">Lengkapi setiap field agar HRD dan Direktur dapat memproses permintaan dengan cepat.</p>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">

            {/* 1. Kode — dengan contoh kode nyata */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-violet-400/20 rounded-lg"><Tag size={11} className="text-violet-300" /></div>
                <p className="text-[11px] font-bold text-white/90">Kode</p>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Kode posisi sesuai struktur hierarki divisi Anda. Pilih kode dari daftar di bawah atau ketik manual.
              </p>
              {orgUnits.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {orgUnits.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/15 border border-violet-500/25 text-[9px] font-mono font-bold text-violet-300 leading-none">
                      {u.code}
                      <span className="text-white/35 font-sans font-normal">{u.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Nama Posisi */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-400/20 rounded-lg"><Briefcase size={11} className="text-blue-300" /></div>
                <p className="text-[11px] font-bold text-white/90">Nama Posisi</p>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Nama jabatan yang akan direkrut, sesuai struktur organisasi perusahaan.
              </p>
              {positions.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {positions.slice(0, 5).map(p => (
                    <span key={p} className="px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/25 text-[9px] text-blue-300 font-medium">{p}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Jumlah & Urgensi */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-400/20 rounded-lg"><Users size={11} className="text-amber-300" /></div>
                <p className="text-[11px] font-bold text-white/90">Jumlah & Urgensi</p>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Berapa orang yang dibutuhkan, dan seberapa mendesak kebutuhannya.
              </p>
              <div className="mt-2.5 flex gap-1.5">
                {[
                  ["Tinggi", "bg-red-500/15 border-red-500/25 text-red-300", "Operasional terganggu"],
                  ["Sedang", "bg-amber-500/15 border-amber-500/25 text-amber-300", "Perlu segera"],
                  ["Rendah", "bg-blue-500/15 border-blue-500/25 text-blue-300", "Bisa ditunda"],
                ].map(([l, c, sub]) => (
                  <div key={l} className={`flex-1 px-2 py-1.5 rounded-lg border text-center ${c}`}>
                    <p className="text-[9px] font-bold leading-tight">{l}</p>
                    <p className="text-[8px] opacity-60 mt-0.5 leading-tight">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Deskripsi Pekerjaan */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-emerald-400/20 rounded-lg"><FileText size={11} className="text-emerald-300" /></div>
                <p className="text-[11px] font-bold text-white/90">Deskripsi Pekerjaan</p>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Uraikan tugas utama, tanggung jawab harian, dan kualifikasi minimum. Semakin lengkap, semakin tepat proses rekrutmen.
              </p>
            </div>

            {/* 5. Alasan Pengajuan */}
            <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-400/20 rounded-lg"><Info size={11} className="text-red-300" /></div>
                <p className="text-[11px] font-bold text-white/90">Alasan Pengajuan</p>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Jelaskan latar belakang kebutuhan: beban kerja meningkat, ekspansi divisi, penggantian karyawan resign, atau kebutuhan baru.
              </p>
            </div>

          </div>

          {/* Alur persetujuan — bottom */}
          <div className="px-6 py-4 border-t border-white/10">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Alur Persetujuan</p>
            <div className="flex items-center gap-1.5">
              {["Anda", "HRD", "Direktur"].map((s, i, arr) => (
                <div key={s} className="flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${i === arr.length - 1 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/8 text-white/60 border border-white/10"}`}>
                    {s}
                  </span>
                  {i < arr.length - 1 && <ChevronRight size={11} className="text-white/20 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── KANAN: Form ──────────────────────────────────────────── */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">{editTarget ? "Revisi Permintaan SDM" : "Ajukan Permintaan SDM"}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[11px] text-slate-500 font-medium">{deptName || fDept || "Departemen belum diisi"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <X size={15} className="text-slate-500" />
            </button>
          </div>

          {/* Form body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Departemen — hanya tampil jika tidak terdeteksi otomatis */}
            {!deptName && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Departemen <span className="text-red-400 normal-case">*</span>
                </label>
                <input
                  value={fDept}
                  onChange={e => setFDept(e.target.value)}
                  placeholder="Masukkan nama departemen Anda"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
                />
                <p className="text-[10px] text-amber-600 mt-1">Departemen Anda tidak terdeteksi otomatis. Isi manual sesuai nama departemen di sistem.</p>
              </div>
            )}

            {/* Kode + Nama Posisi */}
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kode</label>
                <input
                  value={fGrade}
                  onChange={e => setFGrade(e.target.value)}
                  placeholder={exampleCode || "cth. 1.1.2.1"}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
                />
                {/* Chip kode contoh — klik untuk isi otomatis */}
                {orgUnits.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {orgUnits.slice(0, 3).map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setFGrade(u.code)}
                        title={u.name}
                        className="px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 border border-violet-200 text-[9px] font-mono font-bold hover:bg-violet-100 transition-colors"
                      >
                        {u.code}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Nama Posisi <span className="text-red-400 normal-case">*</span>
                </label>
                <input
                  value={fPos}
                  onChange={e => setFPos(e.target.value)}
                  placeholder="cth. Staff Ekspor, Supervisor"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
                />
              </div>
            </div>

            {/* Jumlah + Urgensi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Jumlah Orang <span className="text-red-400 normal-case">*</span>
                </label>
                <input
                  type="number" min={1} value={fQty}
                  onChange={e => setFQty(Math.max(1, Number(e.target.value)))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Urgensi</label>
                {/* Urgensi sebagai toggle pills */}
                <div className="flex gap-1.5">
                  {URGENCY.map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setFUrgency(u)}
                      className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all ${fUrgency === u ? URGENCY_META[u].color : "bg-slate-50 border-slate-200 text-slate-400 hover:border-slate-300"}`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 mb-0.5 ${fUrgency === u ? URGENCY_META[u].dot : "bg-slate-300"}`} />
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Jenis Permintaan + Need By Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Jenis Permintaan</label>
                <select
                  value={fType}
                  onChange={e => setFType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
                >
                  <option value="">Pilih jenis</option>
                  {REQUEST_TYPE_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Need By Date</label>
                <input
                  type="date"
                  value={fNeedBy}
                  onChange={e => setFNeedBy(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
                />
              </div>
            </div>

            {/* Kategori Jenis, Alasan, Employment Type (master data — dipakai
                Validation Engine & otomasi pasca-approval) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kategori Jenis</label>
                <select value={fRequestTypeId} onChange={e => setFRequestTypeId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors">
                  <option value="">Pilih</option>
                  {requestTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kategori Alasan</label>
                <select value={fReasonCategoryId} onChange={e => setFReasonCategoryId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors">
                  <option value="">Pilih</option>
                  {requestReasons.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Employment Type</label>
                <select value={fEmploymentTypeId} onChange={e => setFEmploymentTypeId(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors">
                  <option value="">Pilih</option>
                  {employmentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            {/* Deskripsi Pekerjaan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Deskripsi Pekerjaan</label>
              <textarea
                value={fJobDesc}
                onChange={e => setFJobDesc(e.target.value)}
                rows={3}
                placeholder="Uraikan tugas utama, tanggung jawab, dan kualifikasi minimum yang dibutuhkan..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 resize-none transition-colors"
              />
            </div>

            {/* Alasan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Alasan Pengajuan</label>
              <textarea
                value={fReason}
                onChange={e => setFReason(e.target.value)}
                rows={3}
                placeholder="Mengapa posisi ini perlu diisi? Beban kerja meningkat, ekspansi divisi, pengganti karyawan resign, dll."
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 resize-none transition-colors"
              />
            </div>

            {/* Budget Kebutuhan SDM */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <Wallet size={12} /> Budget Kebutuhan SDM <span className="text-[10px] font-normal normal-case text-slate-400">(opsional)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number" value={fSalaryMin} onChange={e => setFSalaryMin(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Gaji min (Rp)"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
                />
                <input
                  type="number" value={fSalaryMax} onChange={e => setFSalaryMax(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Gaji max (Rp)"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
                />
              </div>
              <input
                type="number" value={fBudgetRecruitment} onChange={e => setFBudgetRecruitment(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="Budget rekrutmen (Rp)"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input type="checkbox" checked={fBudgetAvailable} onChange={e => setFBudgetAvailable(e.target.checked)} /> Budget sudah tersedia
              </label>
            </div>

            {/* Kebutuhan SIM */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Kebutuhan SIM <span className="text-[10px] font-normal normal-case text-slate-400">(opsional, khusus posisi supir)</span>
              </label>
              <select
                value={fRequiredLicense} onChange={e => setFRequiredLicense(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 bg-slate-50 transition-colors"
              >
                <option value="">Tidak diperlukan</option>
                <option value="SIM A">SIM A</option>
                <option value="SIM B1">SIM B1</option>
                <option value="SIM B2">SIM B2</option>
                <option value="SIM B3">SIM B3</option>
                <option value="SIM C">SIM C</option>
              </select>
            </div>

            {fErr && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                <AlertTriangle size={13} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-xs font-medium">{fErr}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={() => doSubmit(true)}
              disabled={loading}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-60"
            >
              Simpan Draft
            </button>
            <button
              onClick={() => doSubmit(false)}
              disabled={loading}
              className="flex-1 py-2.5 bg-[#0a2e22] hover:bg-[#0d3b2e] text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
            >
              <Send size={13} /> {loading ? "Mengirim..." : editTarget ? "Ajukan Ulang" : "Kirim Permintaan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const VALIDATION_STYLE: Record<string, string> = {
  Pass: "bg-emerald-50 text-emerald-700",
  Incomplete: "bg-red-50 text-red-700",
  Warning: "bg-amber-50 text-amber-700",
  Info: "bg-slate-50 text-slate-500",
};

const APPROVAL_STEP_STYLE: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
  Skipped: "bg-slate-100 text-slate-500",
};

// ─── Detail: Validation Engine (read-only) + status approval — data yang
// sama persis dilihat HRD di /hrd/workforce/requests, bukan halaman terpisah
// yang bisa berbeda-beda. ──────────────────────────────────────────────────
function RequestDetailPanel({ request, onClose }: { request: Request; onClose: () => void }) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    (async () => {
      const steps = await getManpowerApprovalStatus(request.id).catch(() => []);
      setApprovalSteps(steps);
      setLoading(false);
    })();
  }, [request.id]);

  const doValidate = async () => {
    setRevalidating(true);
    const res = await runManpowerValidation(request.id);
    setRevalidating(false);
    if ("success" in res) setValidation(res.result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">{request.position}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Validasi &amp; Status Approval — data yang sama dilihat HRD</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
            <X size={15} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Memuat...</div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <ListChecks size={12} /> AI Validation Engine
                  </p>
                  <button onClick={doValidate} disabled={revalidating} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50">
                    {revalidating ? "Memvalidasi..." : "Jalankan Validasi"}
                  </button>
                </div>
                {!validation ? (
                  <p className="text-[11px] text-slate-400">Klik &quot;Jalankan Validasi&quot; untuk memeriksa kelengkapan posisi, organisasi, budget, headcount, mobilitas internal, suksesi, dan beban kerja.</p>
                ) : (
                  <div className="space-y-1.5">
                    {validation.checks.map(c => (
                      <div key={c.key} className={`rounded-lg px-2.5 py-1.5 text-[11px] ${VALIDATION_STYLE[c.status] || "bg-slate-50 text-slate-500"}`}>
                        <span className="font-bold">{c.label}:</span> {c.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Users2 size={12} /> Approval Workflow
                </p>
                {approvalSteps.length === 0 ? (
                  <p className="text-[11px] text-slate-400">Approval workflow belum dimulai oleh HRD.</p>
                ) : (
                  <div className="space-y-1.5">
                    {approvalSteps.map(s => (
                      <div key={s.step_number} className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 rounded-lg text-[11px]">
                        <span className="font-semibold text-slate-600">
                          {s.step_number}. {s.step_label}
                          {s.approver_department && <span className="text-slate-400"> ({s.approver_department})</span>}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-bold ${APPROVAL_STEP_STYLE[s.status] || "bg-amber-50 text-amber-700"}`}>
                          {s.status}{s.approved_by ? ` — ${s.approved_by}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Halaman utama ─────────────────────────────────────────────────────────────
export default function DeptDashboard() {
  const [deptName, setDeptName] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [orgUnits, setOrgUnits] = useState<OrgUnitFlat[]>([]);
  const [headcount, setHeadcount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Request | null>(null);
  const [detailTarget, setDetailTarget] = useState<Request | null>(null);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (dname: string) => {
    setLoading(true);
    try {
      const data = await getDeptData(dname);
      setEmployees(data.employees || []);
      setRequests(data.requests || []);
      setHeadcount(data.headcount);
      setOrgUnits((data.orgUnits || []) as OrgUnitFlat[]);
    } catch {
      showToast("error", "Gagal memuat data departemen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { dept } = await getMyDept();
      const department = dept || "";
      setDeptName(department);
      if (department) loadData(department);
      else setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const approvedCount = requests.filter(r => r.status === "Disetujui").length;
  const deptPositions = [...new Set(employees.map(e => e.position).filter(Boolean))];

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Modal form */}
      {showModal && (
        <RequestModal
          deptName={deptName}
          orgUnits={orgUnits}
          positions={deptPositions}
          editTarget={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSuccess={() => {
            showToast("success", editTarget ? "Perubahan berhasil disimpan." : "Permintaan SDM berhasil diajukan! HRD akan segera mereview.");
            if (deptName) loadData(deptName);
          }}
        />
      )}

      {/* Detail: Validation Engine + Approval Workflow */}
      {detailTarget && (
        <RequestDetailPanel request={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pgp-navy mb-1">Dashboard Departemen</h1>
          <p className="text-sm text-gray-500">{deptName || "Departemen tidak ditemukan"}</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0d3b2e] hover:bg-[#1a5c45] text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
        >
          <Plus size={15} /> Ajukan SDM
        </button>
      </div>

      {/* Banner peringatan jika departemen tidak terdeteksi */}
      {!deptName && !loading && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Departemen tidak terdeteksi otomatis</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Akun Anda belum terhubung ke data karyawan di sistem. Anda tetap bisa mengajukan permintaan SDM — isi nama departemen secara manual pada form pengajuan. Hubungi HRD untuk menghubungkan akun Anda ke data karyawan.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Karyawan", value: employees.length, icon: <Users size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Headcount", value: headcount, icon: <Briefcase size={18} />, color: "bg-violet-50 text-violet-600" },
          { label: "Request Pending", value: pendingCount, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Request Disetujui", value: approvedCount, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
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

      {/* Riwayat permintaan */}
      {requests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Permintaan SDM</h3>
            <span className="text-[10px] text-slate-400">{requests.length} permintaan</span>
          </div>
          <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
            {requests.map(req => (
              <div key={req.id} className="px-5 py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">{req.position}</span>
                    {req.grade_code && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-violet-50 text-violet-700 border border-violet-200">
                        Grade {req.grade_code}
                      </span>
                    )}
                    {req.request_type && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {req.request_type}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${req.urgency === "Tinggi" ? "bg-red-50 text-red-700 border-red-200" : req.urgency === "Sedang" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                      {req.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {req.quantity} orang · {new Date(req.created_at).toLocaleDateString("id-ID")}
                    {req.need_by_date && <> · Need by {new Date(req.need_by_date).toLocaleDateString("id-ID")}</>}
                  </p>
                  {req.status === "Ditolak" && req.rejection_reason && (
                    <p className="text-[10px] text-red-500 mt-0.5">Alasan: {req.rejection_reason}</p>
                  )}
                  {req.status !== "Draft" && (
                    <button
                      onClick={() => setDetailTarget(req)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 mt-1"
                    >
                      Lihat Validasi &amp; Approval
                    </button>
                  )}
                  {["Draft", "Ditolak"].includes(req.status) && (
                    <button
                      onClick={() => { setEditTarget(req); setShowModal(true); }}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 mt-1"
                    >
                      Revisi
                    </button>
                  )}
                  {["Draft", "Pending"].includes(req.status) && (
                    <button
                      onClick={async () => {
                        if (!confirm("Batalkan permintaan ini?")) return;
                        const r = await cancelRequest(req.id, "");
                        if ("error" in r) { showToast("error", r.error); return; }
                        showToast("success", "Permintaan dibatalkan.");
                        if (deptName) loadData(deptName);
                        else setRequests(prev => prev.map(x => x.id === req.id ? { ...x, status: "Dibatalkan" } : x));
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 mt-1 ml-3"
                    >
                      Batalkan
                    </button>
                  )}
                </div>
                <span className={`shrink-0 px-2 py-1 text-[10px] font-bold rounded-lg ${
                  req.status === "Disetujui" ? "bg-emerald-50 text-emerald-700"
                  : req.status === "Ditolak" ? "bg-red-50 text-red-700"
                  : req.status === "Direview Direktur" ? "bg-blue-50 text-blue-700"
                  : req.status === "Menunggu Finance" ? "bg-purple-50 text-purple-700"
                  : req.status === "Draft" || req.status === "Dibatalkan" ? "bg-slate-100 text-slate-500"
                  : "bg-amber-50 text-amber-700"
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Karyawan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Karyawan Saat Ini</h3>
        </div>
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
          {employees.length === 0 ? (
            <div className="p-12">
              <EmptyState icon={Users} title="Belum ada data karyawan." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Nama</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Posisi</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Tgl Masuk</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{emp.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{emp.position}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{emp.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${(emp.status === "Tetap" || emp.status === "Kontrak") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {emp.join_date ? new Date(emp.join_date).toLocaleDateString("id-ID") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
