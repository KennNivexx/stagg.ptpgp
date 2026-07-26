"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Plus, CheckCircle2, Circle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { addPesertaBulk, togglePesertaHadir, type DaftarHadir, type DaftarHadirPeserta } from "@/app/actions/meetings";

interface Props {
  sheet: DaftarHadir;
  peserta: DaftarHadirPeserta[];
  canManage: boolean;
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {m.text}
    </div>
  );
}

export default function AttendanceDetailClient({ sheet, peserta, canManage }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleAddPeserta() {
    if (!formRef.current) return;
    setLoading(true);
    setMsg(null);
    const result = await addPesertaBulk(sheet.id, new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: "Peserta berhasil ditambahkan." });
    formRef.current.reset();
    router.refresh();
  }

  async function handleToggle(id: string, current: boolean) {
    const result = await togglePesertaHadir(id, !current);
    if ("error" in result) return;
    router.refresh();
  }

  const hadirCount = peserta.filter((p) => p.hadir).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link href="/hrd/meetings/attendance" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Kembali ke Daftar Hadir
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-xl font-bold text-[#1A2530] mb-1">{sheet.nama_acara}</h1>
        <p className="text-xs text-slate-500">
          {sheet.tanggal} {sheet.tempat ? `· ${sheet.tempat}` : ""} {sheet.waktu ? `· ${sheet.waktu}` : ""}
        </p>
        {sheet.terkait_agenda && (
          <span className="inline-block mt-2 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{sheet.terkait_agenda}</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Peserta</h3>
              <p className="text-xs text-slate-400 mt-0.5">{hadirCount} / {peserta.length} hadir</p>
            </div>
            <Users size={18} className="text-slate-300" />
          </div>
          {peserta.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada peserta." description="Tambahkan peserta lewat form di samping." className="border-0" />
          ) : (
            <div className="divide-y divide-slate-50">
              {peserta.map((p) => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{p.nama}</p>
                    {p.divisi && <p className="text-[10px] text-slate-400">{p.divisi}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={!canManage}
                    onClick={() => handleToggle(p.id, p.hadir)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                      p.hadir ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    } ${canManage ? "hover:opacity-80 cursor-pointer" : "cursor-default"}`}
                  >
                    {p.hadir ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    {p.hadir ? "Hadir" : "Belum Hadir"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {canManage && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah Peserta</h3>
              <p className="text-xs text-slate-400 mt-0.5">Satu baris per peserta, format: Nama|Divisi</p>
            </div>
            <form ref={formRef} className="p-6 space-y-4">
              <textarea
                name="peserta_bulk"
                rows={8}
                placeholder={"Budi Santoso|Operasional\nSiti Aminah|SDM"}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none font-mono"
              />
              <Msg m={msg} />
              <button type="button" onClick={handleAddPeserta} disabled={loading}
                className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                <Plus size={14} /> {loading ? "Menambahkan..." : "Tambah Peserta"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
