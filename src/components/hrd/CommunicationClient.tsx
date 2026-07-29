"use client";
import { useRef, useState, useTransition } from "react";
import { submitCommunication, type CommType } from "@/app/actions/employee-relations";
import EmptyState from "@/components/EmptyState";
import { Megaphone, Inbox } from "lucide-react";

type Row = Record<string, unknown> & {
  id: string; title: string; content: string | null; target_audience: string;
  status: string; published_by: string | null; published_at: string;
};

export default function CommunicationClient({ type, title, description, initialRows }: { type: CommType; title: string; description: string; initialRows: Row[] }) {
  const rows = initialRows;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      const res = await submitCommunication(formData);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      formRef.current?.reset();
      window.location.reload();
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Megaphone size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <input type="hidden" name="comm_type" value={type} />
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Judul</label>
          <input type="text" name="title" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Isi</label>
          <textarea name="content" rows={3} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Target Audiens</label>
          <input type="text" name="target_audience" defaultValue="All Employees" className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs" />
        </div>
        {error && <p className="text-xs font-semibold text-pgp-red">{error}</p>}
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold disabled:opacity-50">
          {pending ? "Menerbitkan..." : `Terbitkan ${title}`}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={`Belum ada ${title}.`} className="border-none py-12" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {rows.map((r) => (
              <li key={r.id} className="p-4 hover:bg-slate-50/40">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-800">{r.title}</p>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">{r.status}</span>
                </div>
                {r.content && <p className="text-xs text-slate-500 mt-1">{r.content}</p>}
                <p className="text-[10px] text-slate-400 mt-2">{r.target_audience} &middot; {new Date(r.published_at).toLocaleDateString("id-ID")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
