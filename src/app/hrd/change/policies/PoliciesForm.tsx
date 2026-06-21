"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { savePolicy } from "@/app/actions/change";

interface Props {
  managers: Array<{ id: string; full_name: string }>;
}

export default function PoliciesForm({ managers }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await savePolicy(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Draft kebijakan berhasil disimpan!" });
    formRef.current.reset();
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm">Draft Kebijakan Baru</h3>
        <p className="text-xs text-slate-400 mt-0.5">Formulir pembuatan kebijakan</p>
      </div>
      <form ref={formRef} className="p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Kebijakan</label>
          <input name="title" type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Masukkan nama kebijakan..." />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Versi</label>
          <input name="version" type="text" defaultValue="v1.0" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="v1.0" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Deskripsi Perubahan</label>
          <textarea name="description" rows={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Jelaskan perubahan yang diusulkan..." />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Efektif</label>
          <input name="effective_date" type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Approver</label>
          <select name="approver" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
            <option value="">Pilih approver...</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
          </select>
        </div>
        {msg && <div className={`p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
          <Plus size={14} /> {loading ? "Menyimpan..." : "Simpan Draft"}
        </button>
      </form>
    </div>
  );
}
