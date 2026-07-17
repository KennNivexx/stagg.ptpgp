"use client";
import { useState, useTransition } from "react";
import { updateSalaryReviewStatus } from "@/app/actions/rewards";
import EmptyState from "@/components/EmptyState";
import { Wallet, Inbox } from "lucide-react";

type Row = Record<string, unknown> & {
  id: string; status: string; review_type: string; salary_before: number; salary_after: number;
  karyawan?: { full_name?: string; department?: string; position?: string } | null;
};

export default function SalaryApprovalClient({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows.filter((r) => r.status === "Menunggu"));
  const [pending, startTransition] = useTransition();

  const decide = (id: string, approve: boolean) => {
    startTransition(async () => {
      const res = await updateSalaryReviewStatus(id, approve);
      if (!("error" in res)) setRows((prev) => prev.filter((r) => r.id !== id));
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Wallet size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Salary Approval</h1>
          <p className="text-sm text-slate-500 mt-1">Persetujuan Salary Review yang menunggu keputusan Direktur (data yang sama dengan Reward &amp; Recognition &rarr; Salary Review).</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="Tidak ada Salary Review yang menunggu persetujuan." className="border-none py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Karyawan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Jenis</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Gaji Lama</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Gaji Baru</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40">
                    <td className="px-4 py-3 font-semibold text-slate-700">{r.karyawan?.full_name || "-"}<div className="text-[10px] text-slate-400">{r.karyawan?.department}</div></td>
                    <td className="px-4 py-3 text-slate-600">{r.review_type}</td>
                    <td className="px-4 py-3 text-slate-600">Rp {Number(r.salary_before).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">Rp {Number(r.salary_after).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button disabled={pending} onClick={() => decide(r.id, true)} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50">Setujui</button>
                        <button disabled={pending} onClick={() => decide(r.id, false)} className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-red-50 text-pgp-red hover:bg-red-100 disabled:opacity-50">Tolak</button>
                      </div>
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
