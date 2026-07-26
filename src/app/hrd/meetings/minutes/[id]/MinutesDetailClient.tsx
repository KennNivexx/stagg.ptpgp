"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ListChecks, Plus, CheckCircle2, Send, ShieldCheck } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  addNotulenItem, submitNotulenForApproval, approveNotulen, verifyTindakLanjut,
  type NotulenRapat, type NotulenRapatItem,
} from "@/app/actions/meetings";

interface Props {
  notulen: NotulenRapat;
  items: NotulenRapatItem[];
  canManage: boolean;
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

export default function MinutesDetailClient({ notulen, items, canManage }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyNote, setVerifyNote] = useState("");

  async function handleAddItem() {
    if (!formRef.current) return;
    setLoading(true);
    setMsg(null);
    const result = await addNotulenItem(notulen.id, new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: "Poin notulen ditambahkan." });
    formRef.current.reset();
    router.refresh();
  }

  async function handleSubmitApproval() {
    setActionMsg(null);
    const result = await submitNotulenForApproval(notulen.id);
    if ("error" in result) { setActionMsg(result.error); return; }
    router.refresh();
  }

  async function handleApprove() {
    setActionMsg(null);
    const result = await approveNotulen(notulen.id);
    if ("error" in result) { setActionMsg(result.error); return; }
    router.refresh();
  }

  async function handleVerify(itemId: string) {
    setActionMsg(null);
    const result = await verifyTindakLanjut(itemId, verifyNote);
    if ("error" in result) { setActionMsg(result.error); return; }
    setVerifyingId(null);
    setVerifyNote("");
    router.refresh();
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link href="/hrd/meetings/minutes" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Kembali ke Notulen Rapat
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[#1A2530] mb-1">{notulen.nama_acara}</h1>
            <p className="text-xs text-slate-500">
              {notulen.tanggal} {notulen.tempat ? `· ${notulen.tempat}` : ""} {notulen.waktu ? `· ${notulen.waktu}` : ""}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Dibuat oleh {notulen.dibuat_oleh || "-"} {notulen.disetujui_oleh ? `· Disetujui oleh ${notulen.disetujui_oleh}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${STATUS_STYLE[notulen.status] || "bg-slate-100 text-slate-500"}`}>{notulen.status}</span>
            {canManage && notulen.status === "Draft" && (
              <button onClick={handleSubmitApproval} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors">
                <Send size={12} /> Ajukan Persetujuan
              </button>
            )}
            {canManage && notulen.status === "Menunggu Persetujuan" && (
              <button onClick={handleApprove} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
                <ShieldCheck size={12} /> Setujui
              </button>
            )}
          </div>
        </div>
        {actionMsg && <div className="mt-4"><Msg m={{ type: "error", text: actionMsg }} /></div>}
        {notulen.agenda.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Agenda</p>
            <ol className="list-decimal list-inside space-y-1">
              {notulen.agenda.map((a, i) => (
                <li key={i} className="text-xs text-slate-600">{a}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <ListChecks size={18} className="text-slate-300" />
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Pembahasan &amp; Tindak Lanjut</h3>
            <p className="text-xs text-slate-400 mt-0.5">Catatan pembahasan, PIC, batas waktu, dan status verifikasi</p>
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={ListChecks} title="Belum ada poin pembahasan." className="border-0" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["No", "Pembahasan", "Tindak Lanjut", "PIC", "Batas Waktu", "Status", "Verifikasi"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/30 transition-colors align-top">
                    <td className="px-4 py-3 text-xs text-slate-500">{it.nomor}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">{it.catatan_pembahasan || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 max-w-xs">{it.tindak_lanjut || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{it.pic || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{it.batas_waktu || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${it.status === "Selesai" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {it.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">
                      {it.status === "Selesai" ? (
                        <p className="text-[10px] text-slate-500">{it.catatan_verifikasi || "-"}</p>
                      ) : canManage ? (
                        verifyingId === it.id ? (
                          <div className="flex flex-col gap-1.5">
                            <input
                              value={verifyNote}
                              onChange={(e) => setVerifyNote(e.target.value)}
                              placeholder="Catatan verifikasi"
                              className="px-2 py-1 text-[10px] border border-slate-200 rounded-lg focus:outline-none focus:border-[#CC0000]"
                            />
                            <div className="flex gap-1">
                              <button onClick={() => handleVerify(it.id)} className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold">
                                <CheckCircle2 size={10} /> Simpan
                              </button>
                              <button onClick={() => { setVerifyingId(null); setVerifyNote(""); }} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold">
                                Batal
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setVerifyingId(it.id)} className="text-[10px] font-bold text-[#CC0000] hover:underline">
                            Verifikasi Selesai
                          </button>
                        )
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canManage && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Poin Pembahasan</h3>
          </div>
          <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Pembahasan</label>
              <textarea name="catatan_pembahasan" rows={2} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tindak Lanjut</label>
              <textarea name="tindak_lanjut" rows={2} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">PIC</label>
              <input name="pic" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Batas Waktu</label>
              <input name="batas_waktu" type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="md:col-span-2">
              <Msg m={msg} />
            </div>
            <div className="md:col-span-2">
              <button type="button" onClick={handleAddItem} disabled={loading}
                className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                <Plus size={14} /> {loading ? "Menambahkan..." : "Tambah Poin"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
