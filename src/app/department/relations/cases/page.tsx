"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldAlert, Inbox, Plus, X, AlertTriangle } from "lucide-react";
import { getMyDept } from "@/app/actions/department";
import { getDeptEmployees } from "@/app/actions/skills";
import { submitCase, getDeptCases, getCaseCategories, type CaseType } from "@/app/actions/employee-relations";
import EmptyState from "@/components/EmptyState";

const CASE_TYPES: CaseType[] = ["Complaint", "Grievance", "Ethics Violation", "Fraud", "Harassment", "Whistleblowing"];

interface Employee { id: string; full_name: string }
interface Category { id: string; name: string }
type CaseRow = Record<string, unknown> & {
  id: string; title: string; description: string; status: string; case_type: string; sla_due_date: string | null;
  subject?: { full_name?: string } | null;
  reporter?: { full_name?: string } | null;
  pic?: { full_name?: string } | null;
  case_categories?: { name?: string; severity?: string } | null;
};

export default function DeptCasesPage() {
  const [deptName, setDeptName] = useState("");
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const load = useCallback(async (dept: string) => {
    setLoading(true);
    try {
      const [emps, cats, cases] = await Promise.all([
        getDeptEmployees(dept),
        getCaseCategories(),
        getDeptCases(dept),
      ]);
      setEmployees(emps as Employee[]);
      setCategories(cats as Category[]);
      setRows(cases as CaseRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getMyDept().then(({ dept }) => {
      if (dept) { setDeptName(dept); load(dept); }
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, [load]);

  const handleSubmit = (formData: FormData) => {
    setError("");
    setSubmitting(true);
    (async () => {
      const res = await submitCase(formData);
      setSubmitting(false);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      setShowForm(false);
      setAnonymous(false);
      load(deptName);
    })();
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-72" />
          <div className="h-40 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-pgp-navy flex items-center gap-2">
            <ShieldAlert className="text-pgp-red" /> Kasus & Pengaduan
          </h1>
          <p className="text-sm text-gray-500 mt-1">{deptName || "Departemen tidak ditemukan"} — Laporkan dan pantau kasus hubungan kerja di tim Anda.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
          {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? "Tutup Form" : "Laporkan Kasus"}
        </button>
      </div>

      {showForm && (
        <form action={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Jenis Kasus</label>
            <select name="case_type" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
              {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Kategori</label>
            <select name="case_category_id" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
              <option value="">Pilih kategori...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Judul Kasus</label>
            <input type="text" name="title" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Terkait Karyawan</label>
            <select name="subject_karyawan_id" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
              <option value="">-</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Pelapor</label>
            <select name="reporter_karyawan_id" disabled={anonymous} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full disabled:bg-slate-50 disabled:text-slate-400">
              <option value="">-</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" name="anonymous" id="anon-dept" checked={anonymous} onChange={e => setAnonymous(e.target.checked)} className="rounded" />
            <label htmlFor="anon-dept" className="text-xs text-slate-600">Laporkan secara anonim (identitas pelapor tidak dicatat)</label>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Deskripsi</label>
            <textarea name="description" required rows={3} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          {error && <p className="sm:col-span-2 text-xs font-semibold text-pgp-red">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-xl bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold disabled:opacity-50">
              {submitting ? "Mengirim..." : "Laporkan ke HRD"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="Belum ada kasus di departemen Anda." className="border-none py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Kasus</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Jenis</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Terkait</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">PIC</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">SLA</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const overdue = r.sla_due_date && new Date(r.sla_due_date) < new Date() && !["Case Closed", "Rejected"].includes(r.status);
                  return (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                      <td className="px-4 py-3 font-semibold text-slate-700 max-w-xs truncate">{r.title}</td>
                      <td className="px-4 py-3 text-slate-600">{r.case_type}</td>
                      <td className="px-4 py-3 text-slate-600">{r.subject?.full_name || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.pic?.full_name || "Belum ditetapkan"}</td>
                      <td className={`px-4 py-3 ${overdue ? "text-pgp-red font-bold" : "text-slate-500"}`}>{r.sla_due_date || "-"}{overdue && " (Terlambat)"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === "Case Closed" ? "bg-slate-800 text-white" : r.status === "Rejected" ? "bg-red-50 text-pgp-red" : "bg-slate-100 text-slate-600"}`}>{r.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700">
          Anda hanya dapat melaporkan kasus untuk karyawan di departemen Anda sendiri. Penetapan PIC dan proses investigasi ditangani oleh HRD — status akan diperbarui otomatis di halaman ini.
        </p>
      </div>
    </div>
  );
}
