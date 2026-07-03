"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Save, CheckCircle2 } from "lucide-react";
import { saveForecast } from "@/app/actions/forecast";

interface Props {
  departments: string[];
  quarters: string[];
  year: number;
}

export default function ForecastFormClient({ departments, quarters, year }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const fd = new FormData(e.currentTarget);
    fd.set("year", String(year));
    const result = await saveForecast(fd);
    setSaving(false);
    if (result?.error) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: "Proyeksi berhasil disimpan!" });
    (e.target as HTMLFormElement).reset();
    setTimeout(() => { setMsg(null); router.refresh(); }, 1200);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-[#CC0000]" />
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Input Proyeksi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Isi proyeksi per kuartal</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Departemen</label>
            <select name="departemen" required className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30 bg-white">
              <option value="">Pilih Departemen</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {quarters.map((q) => (
            <div key={q}>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">{q} - {year}</label>
              <input type="number" name={`proyeksi_${q.toLowerCase()}`} min="0" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30" placeholder="Jumlah karyawan" />
            </div>
          ))}
          {msg && (
            <div className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {msg.type === "success" && <CheckCircle2 size={14} />}
              {msg.text}
            </div>
          )}
          <button type="submit" disabled={saving} className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Proyeksi"}
          </button>
        </form>
      </div>
    </div>
  );
}
