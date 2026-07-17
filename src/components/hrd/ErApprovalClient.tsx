"use client";
import { useState, useTransition } from "react";
import { decideErApproval } from "@/app/actions/employee-relations";
import EmptyState from "@/components/EmptyState";
import { CheckSquare, Inbox } from "lucide-react";

type Row = Record<string, unknown> & {
  id: string; reference_id: string; approver_role: string | null; status: string; notes: string | null; created_at: string;
};

export default function ErApprovalClient({ title, description, initialRows }: { title: string; description: string; initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();

  const decide = (id: string, status: "Approved" | "Rejected") => {
    startTransition(async () => {
      const res = await decideErApproval(id, status);
      if (!("error" in res)) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <CheckSquare size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="Tidak ada pengajuan yang menunggu persetujuan." className="border-none py-12" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Referensi</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Approver</th>
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{r.reference_id}</td>
                  <td className="px-4 py-3 text-slate-600">{r.approver_role || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.status === "Approved" ? "bg-slate-800 text-white" : r.status === "Rejected" ? "bg-red-50 text-pgp-red" : "bg-slate-100 text-slate-600"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "Pending" && (
                      <div className="flex gap-1.5 justify-end">
                        <button disabled={pending} onClick={() => decide(r.id, "Approved")} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50">Setujui</button>
                        <button disabled={pending} onClick={() => decide(r.id, "Rejected")} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-red-50 text-pgp-red hover:bg-red-100 disabled:opacity-50">Tolak</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
