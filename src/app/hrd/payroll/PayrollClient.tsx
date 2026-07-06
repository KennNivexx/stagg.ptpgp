"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign, Download, FileText, Clock, Users, X, Plus, CheckCircle2 } from "lucide-react";
import { generatePayslip, updatePayrollStatus } from "@/app/actions/admin";
import EmptyState from "@/components/EmptyState";

type Employee = { id: string; full_name: string; department: string; position: string };
type Payroll = Record<string, unknown>;

const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function fmt(n: number) { return n.toLocaleString("id-ID"); }

interface Props {
  payrolls: Payroll[];
  employees: Employee[];
  totalEmployees: number;
  title?: string;
  subtitle?: string;
}

export default function PayrollClient({ payrolls, employees, totalEmployees, title = "Payroll", subtitle = "Kelola penggajian dan slip gaji seluruh karyawan." }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [empId, setEmpId] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: "Approved" | "Paid") => {
    setActingId(id);
    const result = await updatePayrollStatus(id, status);
    setActingId(null);
    if (result?.error) { setMsg({ type: "error", text: result.error }); return; }
    router.refresh();
  };

  const handleGenerate = async () => {
    if (!empId) { setMsg({ type: "error", text: "Pilih karyawan terlebih dahulu." }); return; }
    setSaving(true); setMsg(null);
    const fd = new FormData();
    fd.append("employee_id", empId);
    fd.append("month", month.toString());
    fd.append("year", year.toString());
    const result = await generatePayslip(fd);
    setSaving(false);
    if (result?.error) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: "Slip gaji berhasil dibuat!" });
    setTimeout(() => { setShowModal(false); setMsg(null); router.refresh(); }, 1500);
  };

  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEmployees}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Slip Gaji Dibuat</p>
              <p className="text-xl font-extrabold text-slate-800">{payrolls.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Diproses</p>
              <p className="text-xl font-extrabold text-slate-800">{payrolls.filter((p) => p.status === "Draft").length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Slip Gaji</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat penggajian karyawan</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setMsg(null); }}
            disabled={totalEmployees === 0}
            title={totalEmployees === 0 ? "Tambahkan data karyawan terlebih dahulu" : ""}
            className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Generate Slip Baru
          </button>
        </div>

        {payrolls.length === 0 ? (
          <EmptyState icon={DollarSign} title="Belum ada data payroll." description={'Klik "Generate Slip Baru" untuk membuat slip gaji karyawan.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Karyawan", "Periode", "Gaji Pokok", "Tunjangan", "Bonus", "Potongan", "Total Bersih", "Status", ""].map((h) => (
                    <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrolls.map((p) => {
                  const emp = p.employees as Record<string, string> | undefined;
                  const totalDeductions = (Number(p.tax) || 0) + (Number(p.bpjs_health) || 0) + (Number(p.bpjs_employment) || 0) + (Number(p.deductions) || 0);
                  const busy = actingId === p.id;
                  return (
                    <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {MONTHS[Number(p.month)] || "-"} {String(p.year || "")}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-medium">Rp {fmt(Number(p.basic_salary) || 0)}</td>
                      <td className="px-6 py-4 text-xs text-emerald-600 font-medium">Rp {fmt(Number(p.allowances) || 0)}</td>
                      <td className="px-6 py-4 text-xs text-emerald-600 font-medium">{Number(p.bonus) > 0 ? `Rp ${fmt(Number(p.bonus))}` : "-"}</td>
                      <td className="px-6 py-4 text-xs text-red-600 font-medium" title="PPh 21 + BPJS Kesehatan + BPJS Ketenagakerjaan">Rp {fmt(totalDeductions)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">Rp {fmt(Number(p.net_salary) || 0)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          p.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                          p.status === "Approved" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {p.status === "Draft" ? "Draft" : p.status === "Paid" ? "Dibayar" : p.status as string}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === "Draft" && (
                            <button onClick={() => handleStatusChange(p.id as string, "Approved")} disabled={busy}
                              className="px-2.5 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg hover:bg-blue-100 disabled:opacity-50">
                              Setujui
                            </button>
                          )}
                          {p.status === "Approved" && (
                            <button onClick={() => handleStatusChange(p.id as string, "Paid")} disabled={busy}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Tandai Dibayar
                            </button>
                          )}
                          <button
                            onClick={() => window.open(`/api/payslip/${p.id as string}`, "_blank")}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 inline-flex transition-colors"
                            title="Lihat / Unduh slip gaji"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-slate-900 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><FileText size={14} /> Generate Slip Gaji</h3>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
                <X size={14} className="text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
                <select value={empId} onChange={(e) => setEmpId(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                  <option value="">Pilih karyawan...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name} — {e.department}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] text-slate-500">Slip gaji dibuat otomatis berdasarkan struktur gaji karyawan yang tersimpan. Pastikan data gaji sudah diisi di menu <strong>Rewards → Komponen Gaji</strong>.</p>
              </div>
              {msg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {msg.text}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                <button onClick={handleGenerate} disabled={saving}
                  className="flex-1 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] disabled:opacity-60 text-white rounded-xl text-sm font-bold transition-colors">
                  {saving ? "Membuat..." : "Generate Slip"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
