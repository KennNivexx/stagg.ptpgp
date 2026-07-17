"use client";
import { useState, useTransition } from "react";
import { submitExitInterview } from "@/app/actions/employee-relations";
import EmptyState from "@/components/EmptyState";
import { MessageCircle, Inbox } from "lucide-react";

type Row = Record<string, unknown> & {
  id: string; separation_type: string; effective_date: string; exit_interview_done: boolean; exit_interview_notes: string | null;
  karyawan?: { full_name?: string; department?: string; position?: string } | null;
};

export default function ExitInterviewClient({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const save = (id: string) => {
    startTransition(async () => {
      const res = await submitExitInterview(id, notes[id] || "");
      if (!("error" in res)) setRows((prev) => prev.map((r) => (r.id === id ? { ...r, exit_interview_done: true, exit_interview_notes: notes[id] || "" } : r)));
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <MessageCircle size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Exit Interview</h1>
          <p className="text-sm text-slate-500 mt-1">Wawancara keluar untuk karyawan yang mengalami pemisahan hubungan kerja.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title="Belum ada data pemisahan hubungan kerja." className="border-none py-12" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {rows.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.karyawan?.full_name || "-"}</p>
                    <p className="text-[10px] text-slate-400">{r.separation_type} &middot; efektif {r.effective_date}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${r.exit_interview_done ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {r.exit_interview_done ? "Selesai" : "Belum Dilakukan"}
                  </span>
                </div>
                {r.exit_interview_done ? (
                  <p className="text-xs text-slate-500">{r.exit_interview_notes}</p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="Catatan hasil wawancara..."
                      value={notes[r.id] || ""} onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      className="border border-slate-200 rounded-lg px-3 py-2 text-xs flex-1"
                    />
                    <button disabled={pending} onClick={() => save(r.id)} className="text-[10px] font-bold px-3 py-2 rounded-lg bg-pgp-red hover:bg-pgp-red-hover text-white disabled:opacity-50">Simpan</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
