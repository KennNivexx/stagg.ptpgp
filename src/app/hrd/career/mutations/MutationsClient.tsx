"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { submitMutation, updateMutationStatus } from "@/app/actions/career-hrd";

type Employee = { id: string; full_name: string; department: string; position: string };
type Department = { name: string };
type Mutation = Record<string, unknown>;

interface Props {
  employees: Employee[];
  departments: Department[];
  initialMutations: Mutation[];
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {m.text}
    </div>
  );
}

export default function MutationsClient({ employees, departments, initialMutations }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function handleSubmit() {
    if (!formRef.current) return;
    setLoading(true);
    setMsg(null);
    const result = await submitMutation(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Mutasi berhasil diajukan!" });
    formRef.current.reset();
    router.refresh();
  }

  async function handleStatus(id: string, status: "Disetujui" | "Ditolak") {
    setActionMsg(null);
    const result = await updateMutationStatus(id, status);
    if ("error" in result) { setActionMsg(result.error ?? "Terjadi kesalahan"); return; }
    router.refresh();
  }

  const mutations = initialMutations;
  const approved = mutations.filter((m) => m.status === "Disetujui").length;
  const pending = mutations.filter((m) => m.status === "Menunggu").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Mutasi Karyawan</h1>
          <p className="text-sm text-gray-500">Kelola mutasi dan rotasi penempatan karyawan.</p>
        </div>
        <button onClick={() => document.getElementById("mutation-form")?.scrollIntoView({ behavior: "smooth" })}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Ajukan Mutasi
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: ArrowLeftRight, label: "Total Mutasi", value: mutations.length, color: "bg-blue-50 text-blue-600" },
          { icon: CheckCircle, label: "Disetujui", value: approved, color: "bg-emerald-50 text-emerald-600" },
          { icon: Clock, label: "Menunggu", value: pending, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {actionMsg && <div className="p-3 rounded-xl text-xs font-medium bg-red-50 text-red-700">{actionMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Pengajuan Mutasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat dan status pengajuan mutasi karyawan</p>
          </div>
          {mutations.length === 0 ? (
            <div className="p-12 text-center">
              <ArrowLeftRight size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data mutasi karyawan.</p>
              <p className="text-xs text-slate-400 mt-1">Gunakan formulir di samping untuk mengajukan mutasi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["Karyawan", "Dari Dept", "Ke Dept", "Tgl Efektif", "Status", ""].map((h) => (
                      <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mutations.map((m) => {
                    const emp = m.employees as Record<string, string> | undefined;
                    return (
                      <tr key={m.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "-"}</p>
                          <p className="text-[10px] text-slate-400">{emp?.position || "-"}</p>
                        </td>
                        <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{m.from_department as string}</span></td>
                        <td className="px-6 py-4"><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">{m.to_department as string}</span></td>
                        <td className="px-6 py-4 text-xs text-slate-500">{(m.effective_date as string) || "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${m.status === "Disetujui" ? "bg-emerald-50 text-emerald-700" : m.status === "Ditolak" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                            {m.status as string}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {m.status === "Menunggu" && (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleStatus(m.id as string, "Disetujui")} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Setujui"><CheckCircle size={12} /></button>
                              <button onClick={() => handleStatus(m.id as string, "Ditolak")} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Tolak"><XCircle size={12} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div id="mutation-form" className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Pengajuan Mutasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ajukan mutasi untuk karyawan</p>
          </div>
          <form ref={formRef} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
              <select name="employee_id" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="">Pilih Karyawan</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dari Dept</label>
                <select name="from_department" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih</option>
                  {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ke Dept</label>
                <select name="to_department" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih</option>
                  {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Efektif</label>
              <input name="effective_date" type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alasan Mutasi</label>
              <textarea name="reason" rows={3} placeholder="Jelaskan alasan mutasi..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
            </div>
            <Msg m={msg} />
            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              <Plus size={14} /> {loading ? "Menyimpan..." : "Ajukan Mutasi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
