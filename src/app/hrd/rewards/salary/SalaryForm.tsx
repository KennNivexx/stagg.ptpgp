"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Pencil, Wallet } from "lucide-react";
import { saveSalaryStructure } from "@/app/actions/rewards";
import EmptyState from "@/components/EmptyState";

type Employee = { id: string; full_name: string; department: string; position: string };
type SalaryRecord = Record<string, unknown>;

interface Props {
  employees: Employee[];
  salaryRecords: SalaryRecord[];
}

function fmt(n: number) { return n.toLocaleString("id-ID"); }

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function SalaryForm({ employees, salaryRecords }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleSave() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await saveSalaryStructure(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Struktur gaji berhasil disimpan!" });
    formRef.current.reset();
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {!editingId ? (
        <div className="text-right">
          <button onClick={() => setEditingId("new")}
            className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 ml-auto">
            <Pencil size={14} /> Edit Komponen Gaji
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Komponen Gaji</h3>
          </div>
          <form ref={formRef} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
              <select name="employee_id" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                <option value="">Pilih karyawan...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} - {e.position}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Gaji Pokok</label>
                <input name="basic_salary" type="number" min="0" placeholder="0" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tunjangan Perumahan</label>
                <input name="housing_allowance" type="number" min="0" defaultValue={0} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tunjangan Transport</label>
                <input name="transport_allowance" type="number" min="0" defaultValue={0} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tunjangan Makan</label>
                <input name="meal_allowance" type="number" min="0" defaultValue={0} className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
            </div>
            <Msg m={msg} />
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                <Save size={14} /> {loading ? "Menyimpan..." : "Simpan Komponen Gaji"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Struktur Gaji Karyawan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Karyawan", "Gaji Pokok", "Tunjangan", "Potongan", "Take Home Pay"].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {salaryRecords.length === 0 ? (
                <tr><td colSpan={5} className="p-0">
                  <EmptyState icon={Wallet} title={'Belum ada struktur gaji. Klik "Edit Komponen Gaji" untuk mulai.'} />
                </td></tr>
              ) : salaryRecords.map((rec) => {
                const emp = rec.employees as Record<string, string> | undefined;
                const base = Number(rec.basic_salary) || 0;
                const allowances = (Number(rec.housing_allowance) || 0) + (Number(rec.transport_allowance) || 0) + (Number(rec.meal_allowance) || 0);
                const deductions = 0;
                const take_home = base + allowances - deductions;
                return (
                  <tr key={rec.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "-"}</p>
                      <p className="text-[10px] text-slate-400">{emp?.position || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">Rp {fmt(base)}</td>
                    <td className="px-6 py-4 text-xs text-emerald-600 font-medium">+Rp {fmt(allowances)}</td>
                    <td className="px-6 py-4 text-xs text-red-600 font-medium">-Rp {fmt(deductions)}</td>
                    <td className="px-6 py-4 text-xs font-extrabold text-[#1A2530]">Rp {fmt(take_home)}</td>
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
