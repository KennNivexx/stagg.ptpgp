"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCommunication } from "@/app/actions/change";

interface Props {
  departments: string[];
  employees: Array<{ id: string; full_name: string }>;
  channels: string[];
  frequencies: string[];
}

export default function CommunicationsForm({ departments, employees, channels, frequencies }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await saveCommunication(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Rencana komunikasi berhasil ditambahkan!" });
    formRef.current.reset();
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-sm">Tambah Rencana Komunikasi</h3>
        <p className="text-xs text-slate-400 mt-0.5">Formulir item komunikasi baru</p>
      </div>
      <form ref={formRef} className="p-6 space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Audiens Target</label>
          <select name="target" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
            <option value="">Semua Karyawan</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pesan Utama</label>
          <textarea name="message" rows={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Pesan yang akan dikomunikasikan..." />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Saluran Komunikasi</label>
          <select name="channel" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
            {channels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Frekuensi</label>
          <select name="frequency" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
            {frequencies.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Penanggung Jawab</label>
          <select name="pic" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
            <option value="">Pilih penanggung jawab...</option>
            {employees.slice(0, 20).map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Pengiriman</label>
          <input name="send_date" type="date" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
        </div>
        {msg && <div className={`p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>}
        <button type="button" onClick={handleSubmit} disabled={loading}
          className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-60">
          {loading ? "Menyimpan..." : "Tambah ke Rencana"}
        </button>
      </form>
    </div>
  );
}
