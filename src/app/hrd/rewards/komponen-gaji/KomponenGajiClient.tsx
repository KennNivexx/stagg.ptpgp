"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, PlusCircle, MinusCircle } from "lucide-react";
import { saveJenisKomponenGaji, deactivateJenisKomponenGaji, type JenisKomponenGaji } from "@/app/actions/payroll-components";
import EmptyState from "@/components/EmptyState";

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function KomponenGajiClient({ initialKomponen }: { initialKomponen: JenisKomponenGaji[] }) {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState<"tunjangan" | "potongan">("tunjangan");
  const [deskripsi, setDeskripsi] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const tunjangan = initialKomponen.filter((k) => k.tipe === "tunjangan");
  const potongan = initialKomponen.filter((k) => k.tipe === "potongan");

  async function handleAdd() {
    if (!nama.trim()) return;
    setSaving(true); setMsg(null);
    const fd = new FormData();
    fd.set("nama", nama.trim()); fd.set("tipe", tipe); fd.set("deskripsi", deskripsi.trim());
    const res = await saveJenisKomponenGaji(fd);
    setSaving(false);
    if ("error" in res) { setMsg({ type: "error", text: res.error }); return; }
    setNama(""); setDeskripsi("");
    setMsg({ type: "success", text: `Jenis ${tipe === "tunjangan" ? "tunjangan" : "potongan"} "${nama}" berhasil ditambahkan.` });
    router.refresh();
  }

  async function handleDeactivate(id: string, nama: string) {
    setSaving(true); setMsg(null);
    const res = await deactivateJenisKomponenGaji(id);
    setSaving(false);
    if ("error" in res) { setMsg({ type: "error", text: res.error }); return; }
    setMsg({ type: "success", text: `"${nama}" dinonaktifkan — tidak akan muncul lagi di pilihan komponen baru.` });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-extrabold text-slate-800 text-sm mb-4">Tambah Jenis Baru</h3>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3 mb-3">
          <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama, mis. Tunjangan Kesehatan / Potongan Koperasi"
            className="border border-gray-200 p-2.5 rounded-xl text-sm focus:border-[#CC0000] outline-none" />
          <select value={tipe} onChange={(e) => setTipe(e.target.value as "tunjangan" | "potongan")}
            className="border border-gray-200 p-2.5 rounded-xl text-sm bg-white focus:border-[#CC0000] outline-none">
            <option value="tunjangan">Tunjangan</option>
            <option value="potongan">Potongan</option>
          </select>
        </div>
        <input value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Keterangan (opsional)"
          className="w-full border border-gray-200 p-2.5 rounded-xl text-sm mb-3 focus:border-[#CC0000] outline-none" />
        <Msg m={msg} />
        <button onClick={handleAdd} disabled={saving || !nama.trim()}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-50">
          <Plus size={14} /> {saving ? "Menyimpan..." : "Tambah Jenis Komponen"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <PlusCircle size={15} className="text-emerald-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">Jenis Tunjangan ({tunjangan.length})</h3>
          </div>
          {tunjangan.length === 0 ? (
            <EmptyState icon={PlusCircle} title="Belum ada jenis tunjangan." className="border-none" />
          ) : (
            <div className="divide-y divide-slate-50">
              {tunjangan.map((k) => (
                <div key={k.id} className={`p-4 flex items-center justify-between gap-3 ${!k.is_active ? "opacity-40" : ""}`}>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{k.nama}</p>
                    {k.deskripsi && <p className="text-[11px] text-slate-400">{k.deskripsi}</p>}
                    {!k.is_active && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Nonaktif</p>}
                  </div>
                  {k.is_active && (
                    <button onClick={() => handleDeactivate(k.id, k.nama)} disabled={saving}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600" title="Nonaktifkan">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <MinusCircle size={15} className="text-red-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">Jenis Potongan ({potongan.length})</h3>
          </div>
          {potongan.length === 0 ? (
            <EmptyState icon={MinusCircle} title="Belum ada jenis potongan." className="border-none" />
          ) : (
            <div className="divide-y divide-slate-50">
              {potongan.map((k) => (
                <div key={k.id} className={`p-4 flex items-center justify-between gap-3 ${!k.is_active ? "opacity-40" : ""}`}>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{k.nama}</p>
                    {k.deskripsi && <p className="text-[11px] text-slate-400">{k.deskripsi}</p>}
                    {!k.is_active && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Nonaktif</p>}
                  </div>
                  {k.is_active && (
                    <button onClick={() => handleDeactivate(k.id, k.nama)} disabled={saving}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600" title="Nonaktifkan">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
