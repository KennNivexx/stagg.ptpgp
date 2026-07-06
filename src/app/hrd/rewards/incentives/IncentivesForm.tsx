"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, CheckCircle } from "lucide-react";
import { saveIncentivePayment, updateIncentiveStatus } from "@/app/actions/rewards";
import EmptyState from "@/components/EmptyState";

type Employee = { id: string; full_name: string; department: string; position: string };
type IncentivePayment = Record<string, unknown>;

interface Props {
  employees: Employee[];
  payments: IncentivePayment[];
  programs: string[];
}

const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function fmt(n: number) { return n.toLocaleString("id-ID"); }

function statusStyle(s: string) {
  if (s === "Dibayarkan") return "bg-emerald-50 text-emerald-700";
  if (s === "Disetujui") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function IncentivesForm({ employees, payments, programs }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [actingId, setActingId] = useState("");
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  async function handleSave() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const fd = new FormData(formRef.current);
    fd.set("period", `${String(month).padStart(2, "0")}/${year}`);
    const result = await saveIncentivePayment(fd);
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Pembayaran insentif berhasil disimpan!" });
    formRef.current.reset();
    setShowForm(false);
    router.refresh();
  }

  async function handleStatus(id: string, status: string) {
    setActingId(id);
    const result = await updateIncentiveStatus(id, status);
    setActingId("");
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    router.refresh();
  }

  const totalAmount = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Gift size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pembayaran</p>
              <p className="text-xl font-extrabold text-slate-800">{payments.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><Gift size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Insentif</p>
              <p className="text-lg font-extrabold text-slate-800">Rp {fmt(totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
          <button onClick={() => setShowForm(!showForm)}
            className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2">
            <Plus size={14} /> {showForm ? "Tutup Form" : "Tambah Insentif"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Pembayaran Insentif</h3>
          </div>
          <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
              <select name="employee_id" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                <option value="">Pilih karyawan...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Program</label>
              <select name="program" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                {programs.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah (Rp)</label>
              <input name="amount" type="number" min="1" placeholder="1000000" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Bulan</label>
                <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                  {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tahun</label>
                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Catatan</label>
              <input name="notes" type="text" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Keterangan tambahan..." />
            </div>
            <div className="md:col-span-2"><Msg m={msg} /></div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                <Plus size={14} /> {loading ? "Menyimpan..." : "Simpan Insentif"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Pembayaran Insentif</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tandai &quot;Dibayarkan&quot; agar insentif ikut terhitung otomatis di slip gaji periode yang sama.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Karyawan", "Program", "Periode", "Jumlah", "Catatan", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="p-0">
                  <EmptyState icon={Gift} title="Belum ada riwayat pembayaran insentif." />
                </td></tr>
              ) : payments.map((p) => {
                const emp = p.employees as Record<string, string> | undefined;
                const status = (p.status as string) || "Pending";
                return (
                  <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "-"}</p>
                      <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                    </td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{p.program as string}</span></td>
                    <td className="px-6 py-4 text-xs text-slate-600">{p.period as string}</td>
                    <td className="px-6 py-4 text-xs font-extrabold text-emerald-700">Rp {fmt(Number(p.amount) || 0)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{(p.notes as string) || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusStyle(status)}`}>{status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {status === "Pending" && (
                        <button onClick={() => handleStatus(p.id as string, "Disetujui")} disabled={actingId === p.id}
                          className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                          Setujui
                        </button>
                      )}
                      {status === "Disetujui" && (
                        <button onClick={() => handleStatus(p.id as string, "Dibayarkan")} disabled={actingId === p.id}
                          className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1">
                          <CheckCircle size={10} /> Bayarkan
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
