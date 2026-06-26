"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle2 } from "lucide-react";
import { createJobPosting } from "@/app/actions/recruitment";

interface Props {
  departments: string[];
}

export default function VacancyFormClient({ departments }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const result = await createJobPosting(new FormData(e.currentTarget));
    setSaving(false);
    if (result?.error) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: "Lowongan berhasil disimpan!" });
    (e.target as HTMLFormElement).reset();
    setTimeout(() => { setMsg(null); router.refresh(); }, 1800);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-[#CC0000]" />
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Rencana Lowongan Baru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ajukan persetujuan lowongan baru</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Judul Posisi</label>
            <input name="title" type="text" required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Staff Akuntansi" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen</label>
            <select name="department" required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30 bg-white">
              <option value="">Pilih Departemen</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Lokasi</label>
            <input name="location" type="text" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Contoh: Jakarta" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Status Persetujuan</label>
            <select name="status" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30 bg-white">
              <option value="Draft">Draft (Menunggu Review)</option>
              <option value="Open">Disetujui — Langsung Buka</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Deskripsi</label>
            <textarea name="description" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" rows={3} placeholder="Deskripsikan kebutuhan lowongan..." />
          </div>
          {msg && (
            <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {msg.type === "success" && <CheckCircle2 size={14} />}
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={saving} className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            <Plus size={14} /> {saving ? "Menyimpan..." : "Simpan Lowongan"}
          </button>
        </form>
      </div>
    </div>
  );
}
