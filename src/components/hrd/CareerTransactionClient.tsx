"use client";
import { useRef, useState, useTransition } from "react";
import { submitCareerTransaction, type CareerTransactionType } from "@/app/actions/career-development";
import EmptyState from "@/components/EmptyState";
import EmployeeCombobox from "@/components/EmployeeCombobox";
import { FileText, Inbox } from "lucide-react";

type Row = Record<string, unknown> & {
  id: string; status: string; effective_date: string; reason: string | null;
  karyawan?: { full_name?: string; department?: string } | null;
  from?: { name?: string } | null; to?: { name?: string } | null;
};
type Employee = { id: string; full_name: string; kode_jabatan?: string | null; nik?: string | null; department?: string | null; position?: string | null };
type Jabatan = { id: string; name: string; department: string };

/** Shared list + submission form for all 6 career_transactions sub-types
 * (Acting, Demotion, Promotion, Rotation, Succession, Temporary) — same
 * table, same shape, only the transaction_type and page copy differ. */
export default function CareerTransactionClient({
  type, title, description, initialRows, employees, jabatanList,
}: {
  type: CareerTransactionType; title: string; description: string;
  initialRows: Row[]; employees: Employee[]; jabatanList: Jabatan[];
}) {
  const rows = initialRows;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      const res = await submitCareerTransaction(formData);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      formRef.current?.reset();
      window.location.reload();
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <FileText size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="hidden" name="transaction_type" value={type} />
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Karyawan</label>
          <EmployeeCombobox name="karyawan_id" employees={employees} required />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Jabatan Tujuan</label>
          <select name="target_jabatan_id" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full">
            <option value="">Pilih jabatan...</option>
            {jabatanList.map((j) => <option key={j.id} value={j.id}>{j.name} — {j.department}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tanggal Efektif</label>
          <input type="date" name="effective_date" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Alasan</label>
          <input type="text" name="reason" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" placeholder="Opsional" />
        </div>
        {error && <p className="sm:col-span-2 text-xs font-semibold text-pgp-red">{error}</p>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold disabled:opacity-50">
            {pending ? "Memproses..." : `Ajukan ${title}`}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={`Belum ada transaksi ${title}.`} className="border-none py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Karyawan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Dari</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Ke</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Efektif</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-semibold text-slate-700">{r.karyawan?.full_name || "-"}<div className="text-[10px] text-slate-400">{r.karyawan?.department}</div></td>
                    <td className="px-4 py-3 text-slate-600">{r.from?.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.to?.name || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{r.effective_date}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === "Approved" || r.status === "Executed" ? "bg-slate-800 text-white" : r.status === "Rejected" ? "bg-red-50 text-pgp-red" : "bg-slate-100 text-slate-600"}`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
