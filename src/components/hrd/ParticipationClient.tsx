"use client";
import { useRef, useState, useTransition } from "react";
import { submitParticipationEntry, type ParticipationType } from "@/app/actions/employee-relations";
import EmptyState from "@/components/EmptyState";
import { MessageSquareHeart, Inbox } from "lucide-react";

type Row = Record<string, unknown> & {
  id: string; title: string; description: string | null; status: string; score: number | null; created_at: string;
  karyawan?: { full_name?: string; department?: string } | null;
};

export default function ParticipationClient({
  type, title, description, initialRows, hasScore = false, scoreLabel = "Skor",
}: {
  type: ParticipationType; title: string; description: string; initialRows: Row[];
  hasScore?: boolean; scoreLabel?: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      const res = await submitParticipationEntry(formData);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      formRef.current?.reset();
      window.location.reload();
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <MessageSquareHeart size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <input type="hidden" name="participation_type" value={type} />
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Judul</label>
          <input type="text" name="title" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Deskripsi</label>
          <textarea name="description" rows={2} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        {hasScore && (
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">{scoreLabel} (0-100)</label>
            <input type="number" name="score" min={0} max={100} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full max-w-xs" />
          </div>
        )}
        {error && <p className="text-xs font-semibold text-pgp-red">{error}</p>}
        <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold disabled:opacity-50">
          {pending ? "Mengirim..." : "Kirim"}
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Inbox} title={`Belum ada ${title}.`} className="border-none py-12" />
        ) : (
          <ul className="divide-y divide-slate-50">
            {rows.map((r) => (
              <li key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-800">{r.title}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasScore && r.score != null && <span className="text-xs font-extrabold text-slate-800">{r.score}</span>}
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{r.status}</span>
                  </div>
                </div>
                {r.description && <p className="text-xs text-slate-500 mt-1">{r.description}</p>}
                <p className="text-[10px] text-slate-400 mt-2">{r.karyawan?.full_name || "Anonim"} &middot; {new Date(r.created_at).toLocaleDateString("id-ID")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
