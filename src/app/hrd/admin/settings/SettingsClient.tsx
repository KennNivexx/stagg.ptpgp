"use client";
import { useRef, useState } from "react";
import { Building2, Clock, Calendar } from "lucide-react";
import { saveMultipleSettings } from "@/app/actions/admin";

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

function Section({ title, icon: Icon, color, children, onSave, loading, msg }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode;
  onSave: () => void; loading: boolean; msg: { type: "success" | "error"; text: string } | null;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${color} rounded-lg`}><Icon size={16} /></div>
          <h3 className="font-extrabold text-slate-800 text-sm">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
        <Msg m={msg} />
        <button type="button" onClick={onSave} disabled={loading}
          className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-60">
          {loading ? "Menyimpan..." : `Simpan ${title}`}
        </button>
      </div>
    </div>
  );
}

export default function SettingsClient() {
  const companyRef = useRef<HTMLFormElement>(null);
  const workRef = useRef<HTMLFormElement>(null);
  const leaveRef = useRef<HTMLFormElement>(null);

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [msgMap, setMsgMap] = useState<Record<string, { type: "success" | "error"; text: string } | null>>({});

  async function save(key: string, ref: React.RefObject<HTMLFormElement | null>) {
    if (!ref.current) return;
    setLoadingMap((p) => ({ ...p, [key]: true }));
    setMsgMap((p) => ({ ...p, [key]: null }));
    const fd = new FormData(ref.current);
    const settings: Record<string, string> = {};
    fd.forEach((val, k) => { settings[`${key}_${k}`] = val as string; });
    const result = await saveMultipleSettings(settings);
    setLoadingMap((p) => ({ ...p, [key]: false }));
    if ("error" in result) {
      setMsgMap((p) => ({ ...p, [key]: { type: "error", text: String((result as Record<string, unknown>).error ?? "Terjadi kesalahan") } }));
    } else {
      setMsgMap((p) => ({ ...p, [key]: { type: "success", text: "Pengaturan berhasil disimpan!" } }));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Section title="Informasi Perusahaan" icon={Building2} color="bg-blue-50 text-blue-600"
        onSave={() => save("company", companyRef)} loading={!!loadingMap.company} msg={msgMap.company || null}>
        <form ref={companyRef} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Perusahaan</label>
              <input name="name" type="text" defaultValue="PT Pratama Galuh Perkasa" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Bidang Usaha</label>
              <input name="industry" type="text" defaultValue="Logistik & Ekspedisi" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Alamat</label>
            <textarea name="address" rows={2} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Alamat lengkap perusahaan..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Telepon</label>
              <input name="phone" type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="+62 xxx" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email</label>
              <input name="email" type="email" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="info@..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Website</label>
              <input name="website" type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="www..." />
            </div>
          </div>
        </form>
      </Section>

      <Section title="Jam Kerja" icon={Clock} color="bg-amber-50 text-amber-600"
        onSave={() => save("work", workRef)} loading={!!loadingMap.work} msg={msgMap.work || null}>
        <form ref={workRef} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jam Masuk</label>
              <input name="start_time" type="time" defaultValue="08:00" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jam Keluar</label>
              <input name="end_time" type="time" defaultValue="17:00" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Hari Kerja</label>
            <div className="flex flex-wrap gap-2">
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input name="work_days" type="checkbox" value={d} defaultChecked className="accent-[#CC0000]" />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Toleransi Keterlambatan (menit)</label>
            <input name="late_tolerance" type="number" defaultValue={15} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
          </div>
        </form>
      </Section>

      <Section title="Kebijakan Cuti" icon={Calendar} color="bg-emerald-50 text-emerald-600"
        onSave={() => save("leave", leaveRef)} loading={!!loadingMap.leave} msg={msgMap.leave || null}>
        <form ref={leaveRef} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cuti Tahunan (hari)</label>
              <input name="annual_leave" type="number" defaultValue={12} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cuti Sakit (hari)</label>
              <input name="sick_leave" type="number" defaultValue={12} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pengajuan Cuti Min. (hari sebelumnya)</label>
            <input name="leave_notice_days" type="number" defaultValue={3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Carry Over Sisa Cuti</label>
            <select name="carry_over" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
              <option value="yes">Ya, diperbolehkan</option>
              <option value="no">Tidak, hangus di akhir tahun</option>
            </select>
          </div>
        </form>
      </Section>
    </div>
  );
}
