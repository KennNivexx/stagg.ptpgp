"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitIndustrialMeeting, type MeetingType } from "@/app/actions/employee-relations";
import EmptyState from "@/components/EmptyState";
import { Gavel, Inbox } from "lucide-react";

type Row = Record<string, unknown> & {
  id: string; title: string; agenda: string | null; outcome: string | null; meeting_date: string; status: string;
};

export default function IndustrialMeetingClient({ type, title, description, initialRows }: { type: MeetingType; title: string; description: string; initialRows: Row[] }) {
  const rows = initialRows;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (formData: FormData) => {
    setError("");
    startTransition(async () => {
      const res = await submitIndustrialMeeting(formData);
      if ("error" in res) { setError(res.error || "Gagal memproses."); return; }
      formRef.current?.reset();
      router.refresh();
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Gavel size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>
      </div>

      <form ref={formRef} action={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="hidden" name="meeting_type" value={type} />
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Judul</label>
          <input type="text" name="title" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tanggal</label>
          <input type="date" name="meeting_date" required className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Agenda</label>
          <textarea name="agenda" rows={2} className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>
        {error && <p className="sm:col-span-2 text-xs font-semibold text-pgp-red">{error}</p>}
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="px-4 py-2 rounded-xl bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold disabled:opacity-50">
            {pending ? "Menyimpan..." : "Catat Pertemuan"}
          </button>
        </div>
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
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">{r.status}</span>
                </div>
                {r.agenda && <p className="text-xs text-slate-500 mt-1">{r.agenda}</p>}
                <p className="text-[10px] text-slate-400 mt-2">{new Date(r.meeting_date).toLocaleDateString("id-ID")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
