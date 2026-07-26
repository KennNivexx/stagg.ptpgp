"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Plus, ChevronRight, Calendar } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { createNotulen, type NotulenRapat } from "@/app/actions/meetings";

interface Props {
  notulen: NotulenRapat[];
  canCreate: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-500",
  "Menunggu Persetujuan": "bg-amber-50 text-amber-700",
  Disetujui: "bg-emerald-50 text-emerald-700",
};

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {m.text}
    </div>
  );
}

export default function MinutesClient({ notulen, canCreate }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit() {
    if (!formRef.current) return;
    setLoading(true);
    setMsg(null);
    const result = await createNotulen(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: "Notulen rapat berhasil dibuat." });
    formRef.current.reset();
    router.push(`/hrd/meetings/minutes/${result.id}`);
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Notulen Rapat</h1>
        <p className="text-sm text-gray-500">FR-PR-MRE-06-03 &mdash; Pencatatan pembahasan, tindak lanjut, PIC, dan verifikasi hasil rapat.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Notulen</h3>
            <p className="text-xs text-slate-400 mt-0.5">Seluruh notulen rapat yang tercatat</p>
          </div>
          {notulen.length === 0 ? (
            <EmptyState icon={FileText} title="Belum ada notulen rapat." description="Gunakan form di samping untuk membuat notulen baru." className="border-0" />
          ) : (
            <div className="divide-y divide-slate-50">
              {notulen.map((n) => (
                <Link key={n.id} href={`/hrd/meetings/minutes/${n.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{n.nama_acara}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} /> {n.tanggal} {n.tempat ? `· ${n.tempat}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[n.status] || "bg-slate-100 text-slate-500"}`}>{n.status}</span>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {canCreate && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Buat Notulen Rapat</h3>
              <p className="text-xs text-slate-400 mt-0.5">Poin pembahasan &amp; tindak lanjut ditambahkan setelah dibuat</p>
            </div>
            <form ref={formRef} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Acara</label>
                <input name="nama_acara" placeholder="Rapat Koordinasi Bulanan" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agenda (satu poin per baris)</label>
                <textarea name="agenda" rows={4} placeholder={"Evaluasi kinerja Q2\nRencana kerja Q3"} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
              </div>
              <Msg m={msg} />
              <button type="button" onClick={handleSubmit} disabled={loading}
                className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                <Plus size={14} /> {loading ? "Menyimpan..." : "Buat Notulen"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
