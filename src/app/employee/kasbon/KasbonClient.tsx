"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Plus, X, Clock } from "lucide-react";
import { submitKasbon, type KasbonRow } from "@/app/actions/kasbon";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLE: Record<string, string> = {
  Diajukan: "bg-amber-50 text-amber-700",
  Disetujui: "bg-sky-50 text-sky-700",
  Berjalan: "bg-blue-50 text-blue-700",
  Lunas: "bg-emerald-50 text-emerald-700",
  Ditolak: "bg-red-50 text-red-700",
  Dibatalkan: "bg-slate-100 text-slate-500",
};

function fmt(n: number) { return (n || 0).toLocaleString("id-ID"); }

export default function KasbonClient({ initialKasbon }: { initialKasbon: KasbonRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [jumlah, setJumlah] = useState("");
  const [cicilan, setCicilan] = useState("3");
  const [alasan, setAlasan] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasActive = initialKasbon.some((k) => ["Diajukan", "Disetujui", "Berjalan"].includes(k.status));
  const cicilanPerBulan = Number(jumlah) > 0 && Number(cicilan) > 0 ? Math.round(Number(jumlah) / Number(cicilan)) : 0;

  const handleSubmit = async () => {
    setSaving(true); setMsg(null);
    const fd = new FormData();
    fd.append("jumlah_pengajuan", jumlah);
    fd.append("jumlah_cicilan", cicilan);
    fd.append("alasan", alasan);
    const res = await submitKasbon(fd);
    setSaving(false);
    if ("error" in res) { setMsg({ type: "error", text: res.error }); return; }
    setShowForm(false); setJumlah(""); setCicilan("3"); setAlasan("");
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Kasbon</h1>
          <p className="text-sm text-gray-500">Ajukan pinjaman kasbon — dicicil otomatis lewat potongan gaji bulanan.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setMsg(null); }}
          disabled={hasActive}
          title={hasActive ? "Anda masih memiliki kasbon aktif/berjalan" : undefined}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 shrink-0"
        >
          <Plus size={15} /> Ajukan Kasbon
        </button>
      </div>

      {hasActive && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <Clock size={18} className="text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700">Anda masih memiliki pengajuan kasbon yang aktif atau sedang berjalan — pengajuan baru bisa dilakukan setelah kasbon ini lunas atau ditolak.</p>
        </div>
      )}

      {initialKasbon.length === 0 ? (
        <EmptyState icon={Wallet} title="Belum ada riwayat kasbon." description="Klik 'Ajukan Kasbon' untuk mengajukan pinjaman pertama Anda." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Kasbon</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {initialKasbon.map((k) => (
              <div key={k.id} className="p-5 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-800">Rp {fmt(k.jumlah_pengajuan)}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${STATUS_STYLE[k.status] || "bg-slate-50 text-slate-600"}`}>{k.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{k.alasan}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{k.jumlah_cicilan}x cicilan &bull; Rp {fmt(k.cicilan_per_bulan)}/bulan</p>
                  {k.status === "Ditolak" && k.rejection_reason && (
                    <p className="text-[11px] text-red-500 mt-1">Alasan penolakan: {k.rejection_reason}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">Diajukan {new Date(k.created_at).toLocaleDateString("id-ID")}</p>
                </div>
                {["Berjalan", "Lunas"].includes(k.status) && (
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-slate-800">Rp {fmt(k.sisa_pokok)}</p>
                    <p className="text-[10px] text-slate-400">Sisa Pokok</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><Wallet size={14} /> Ajukan Kasbon</h3>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah Pengajuan (Rp)</label>
                <input type="number" min="0" value={jumlah} onChange={(e) => setJumlah(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah Cicilan (bulan)</label>
                <select value={cicilan} onChange={(e) => setCicilan(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:border-[#CC0000] outline-none">
                  {[1, 2, 3, 6, 12, 24].map((n) => <option key={n} value={n}>{n} bulan</option>)}
                </select>
              </div>
              {cicilanPerBulan > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-500">
                  Estimasi potongan: <strong className="text-slate-800">Rp {fmt(cicilanPerBulan)}/bulan</strong>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Alasan Pengajuan</label>
                <textarea value={alasan} onChange={(e) => setAlasan(e.target.value)} rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none resize-none" />
              </div>
              {msg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold">Batal</button>
                <button onClick={handleSubmit} disabled={saving || !jumlah || !alasan}
                  className="flex-1 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                  {saving ? "Mengirim..." : "Ajukan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
