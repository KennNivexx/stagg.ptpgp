"use client";
import { useRef, useState, useTransition } from "react";
import { submitCase, updateCaseStatus, type CaseType } from "@/app/actions/employee-relations";
import EmptyState from "@/components/EmptyState";
import { ShieldAlert, Inbox } from "lucide-react";

type Row = Record<string, unknown> & {
  id: string; title: string; description: string; status: string; case_type: string; sla_due_date: string | null;
  subject?: { full_name?: string; department?: string } | null;
  case_categories?: { name?: string; severity?: string } | null;
};
type CategoryOpt = { id: string; name: string };
type EmployeeOpt = { id: string; full_name: string };

const WORKFLOW_STAGES = ["Case Created", "Validation", "Investigation", "Committee Review", "Decision", "Corrective Action", "Monitoring", "Case Closed", "Rejected"] as const;

export default function CaseClient({
  type, title, description, initialRows, categories, employees, showTypeColumn = false,
}: {
  type: CaseType | null; title: string; description: string; initialRows: Row[];
  categories: CategoryOpt[]; employees: EmployeeOpt[]; showTypeColumn?: boolean;
}) {
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      const res = await submitCase(formData);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      formRef.current?.reset();
      window.location.reload();
    });
  };

  const advance = (id: string, status: (typeof WORKFLOW_STAGES)[number]) => {
    startTransition(async () => {
      const res = await updateCaseStatus(id, status);
      if (!("error" in res)) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      {type && (
        <form ref={formRef} action={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input type="hidden" name="case_type" value={type} />
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Judul Kasus</label>
            <input type="text" name="title" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Kategori</label>
            <select name="case_category_id" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
              <option value="">Pilih kategori...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Terkait Karyawan (opsional)</label>
            <select name="subject_karyawan_id" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
              <option value="">-</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" name="anonymous" id="anon" className="rounded" />
            <label htmlFor="anon" className="text-xs text-slate-600">Laporkan secara anonim</label>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Deskripsi</label>
            <textarea name="description" required rows={3} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
          </div>
          {error && <p className="sm:col-span-2 text-xs font-semibold text-pgp-red">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold disabled:opacity-50">
              {pending ? "Mengirim..." : "Laporkan Kasus"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={`Belum ada ${title}.`} className="border-none py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Kasus</th>
                  {showTypeColumn && <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Jenis</th>}
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Terkait</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Kategori</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">SLA</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const overdue = r.sla_due_date && new Date(r.sla_due_date) < new Date() && !["Case Closed", "Rejected"].includes(r.status);
                  const stageIdx = WORKFLOW_STAGES.indexOf(r.status as (typeof WORKFLOW_STAGES)[number]);
                  const nextStage = stageIdx >= 0 && stageIdx < 6 ? WORKFLOW_STAGES[stageIdx + 1] : null;
                  return (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                      <td className="px-4 py-3 font-semibold text-slate-700 max-w-xs truncate">{r.title}</td>
                      {showTypeColumn && <td className="px-4 py-3 text-slate-600">{r.case_type}</td>}
                      <td className="px-4 py-3 text-slate-600">{r.subject?.full_name || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{r.case_categories?.name || "-"}</td>
                      <td className={`px-4 py-3 ${overdue ? "text-pgp-red font-bold" : "text-slate-500"}`}>{r.sla_due_date || "-"}{overdue && " (Terlambat)"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === "Case Closed" ? "bg-slate-800 text-white" : r.status === "Rejected" ? "bg-red-50 text-pgp-red" : "bg-slate-100 text-slate-600"}`}>{r.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {nextStage && (
                          <button disabled={pending} onClick={() => advance(r.id, nextStage)} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50">
                            Lanjut ke {nextStage}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
