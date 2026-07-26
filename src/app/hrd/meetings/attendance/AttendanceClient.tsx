"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Plus, ChevronRight, Calendar } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { createDaftarHadir, type DaftarHadir } from "@/app/actions/meetings";

interface Props {
  sheets: DaftarHadir[];
  canCreate: boolean;
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {m.text}
    </div>
  );
}

export default function AttendanceClient({ sheets, canCreate }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    if (!formRef.current) return;
    setLoading(true);
    setMsg(null);
    const result = await createDaftarHadir(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: "Daftar hadir berhasil dibuat." });
    formRef.current.reset();
    router.push(`/hrd/meetings/attendance/${result.id}`);
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Daftar Hadir</h1>
        <p className="text-sm text-gray-500">FR-PR-MRE-06-02 &mdash; Form daftar hadir digital untuk rapat, training, briefing, dan sosialisasi 5R.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Acara</h3>
            <p className="text-xs text-slate-400 mt-0.5">Seluruh daftar hadir yang pernah dibuat</p>
          </div>
          {sheets.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Belum ada daftar hadir." description="Gunakan form di samping untuk membuat daftar hadir baru." className="border-0" />
          ) : (
            <div className="divide-y divide-slate-50">
              {sheets.map((s) => (
                <Link key={s.id} href={`/hrd/meetings/attendance/${s.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{s.nama_acara}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} /> {s.tanggal} {s.tempat ? `· ${s.tempat}` : ""} {s.terkait_agenda ? `· ${s.terkait_agenda}` : ""}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {canCreate && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Buat Daftar Hadir</h3>
              <p className="text-xs text-slate-400 mt-0.5">Untuk rapat, training, briefing, atau sosialisasi 5R</p>
            </div>
            <form ref={formRef} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Acara</label>
                <input name="nama_acara" placeholder="Briefing Tim Ops" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
                <input name="tanggal" type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tempat</label>
                <input name="tempat" placeholder="Ruang Meeting Utama" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Waktu</label>
                <input name="waktu" placeholder="09.00 - 10.00" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Terkait Agenda</label>
                <input name="terkait_agenda" placeholder="Training / 5R / Rapat / MPP" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              </div>
              <Msg m={msg} />
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                <Plus size={14} /> {loading ? "Menyimpan..." : "Buat Daftar Hadir"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
