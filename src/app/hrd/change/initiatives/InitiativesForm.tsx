"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveInitiative } from "@/app/actions/change";

interface Props {
  managers: Array<{ id: string; full_name: string; position: string }>;
  statuses: string[];
}

export default function InitiativesForm({ managers, statuses }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await saveInitiative(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Inisiatif berhasil disimpan!" });
    formRef.current.reset();
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm">Tambah Inisiatif</h3>
        <p className="text-xs text-slate-400 mt-0.5">Formulir inisiatif perubahan baru</p>
      </div>
      <form ref={formRef} className="p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Inisiatif</label>
          <input name="title" type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="Masukkan nama inisiatif..." />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tujuan</label>
          <textarea name="description" rows={2} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Tujuan dari inisiatif ini..." />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Sponsor</label>
          <select name="sponsor" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
            <option value="">Pilih sponsor...</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name} - {m.position}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tgl Mulai</label>
            <input name="start_date" type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tgl Target</label>
            <input name="end_date" type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status</label>
          <select name="status" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {msg && <div className={`p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-60">
          {loading ? "Menyimpan..." : "Simpan Inisiatif"}
        </button>
      </form>
    </div>
  );
}
