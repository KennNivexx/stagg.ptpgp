"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addCareerPathPosition } from "@/app/actions/career-hrd";

interface Props {
  departments: Array<{ name: string }>;
}

export default function CareerPathForm({ departments }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await addCareerPathPosition(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Posisi berhasil ditambahkan ke jalur karir!" });
    formRef.current.reset();
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm" id="career-path-form">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm">Edit Jalur Karir</h3>
        <p className="text-xs text-slate-400 mt-0.5">Tambah atau ubah jenjang karir</p>
      </div>
      <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Departemen</label>
          <select name="department" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
            <option value="">Pilih Departemen</option>
            {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level</label>
          <select name="level" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
            <option value="">Pilih Level</option>
            <option>Staff</option><option>Supervisor</option><option>Manager</option><option>Wakil Direktur</option><option>Direktur</option><option>Komisaris</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kode Posisi</label>
          <input name="code" type="text" placeholder="cth: FIN-STF-01" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] font-mono" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Posisi</label>
          <input name="name" type="text" placeholder="Nama jabatan" className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
        </div>
        {msg && (
          <div className={`md:col-span-4 p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
        )}
        <div className="md:col-span-4">
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 disabled:opacity-60">
            <Plus size={14} /> {loading ? "Menyimpan..." : "Tambah Posisi"}
          </button>
        </div>
      </form>
    </div>
  );
}
