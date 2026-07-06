"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, DollarSign, TrendingUp, Star, X, CheckCircle } from "lucide-react";
import { addBonus, updateBonusStatus } from "@/app/actions/rewards";
import EmptyState from "@/components/EmptyState";

const BONUS_TYPES = ["Kinerja", "Proyek", "Tahunan", "Khusus", "Lebaran", "THR"];
const STATUSES = ["Pending", "Disetujui", "Dibayarkan"];
const MONTHS = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

interface Employee { id: string; full_name: string; department: string; position: string; }
interface BonusEntry {
  id: string; employee_id: string; program: string;
  amount: number; period?: string; status: string; created_at: string;
  employees?: { full_name: string; department: string; position: string; };
}

const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

export default function BonusesClient({
  employees,
  initialBonuses,
}: {
  employees: Employee[];
  initialBonuses: BonusEntry[];
}) {
  const router = useRouter();
  const [bonuses, setBonuses] = useState<BonusEntry[]>(initialBonuses);
  const [showModal, setShowModal] = useState(false);
  const [empId, setEmpId] = useState("");
  const [program, setProgram] = useState(BONUS_TYPES[0]);
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState("Pending");
  const [saving, setSaving] = useState(false);
  const [actingId, setActingId] = useState("");
  const [toast, setToast] = useState("");
  const years = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const totalBonus = bonuses.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const paidBonus = bonuses.filter(b => b.status === "Dibayarkan").reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const pendingBonus = bonuses.filter(b => b.status === "Pending").length;

  const handleSave = async () => {
    if (!empId || !program || !amount) { showToast("Karyawan, program, dan jumlah wajib diisi."); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("employee_id", empId);
    fd.append("program", program);
    fd.append("amount", amount.replace(/\D/g, ""));
    fd.append("period", `${String(month).padStart(2, "0")}/${year}`);
    fd.append("status", status);
    const result = await addBonus(fd);
    setSaving(false);
    if (result?.error) { showToast(result.error); return; }
    showToast("Bonus berhasil ditambahkan!");
    setEmpId(""); setProgram(BONUS_TYPES[0]); setAmount(""); setShowModal(false);
    router.refresh();
  };

  const handleStatus = async (id: string, newStatus: string) => {
    setActingId(id);
    const result = await updateBonusStatus(id, newStatus);
    setActingId("");
    if (result?.error) { showToast(result.error); return; }
    showToast("Status diperbarui.");
    router.refresh();
  };

  const statusStyle = (s: string) => {
    if (s === "Dibayarkan") return "bg-emerald-50 text-emerald-700";
    if (s === "Disetujui") return "bg-blue-50 text-blue-700";
    return "bg-amber-50 text-amber-700";
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800">Tambah Bonus / Insentif</h3>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
                <select value={empId} onChange={e => setEmpId(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none">
                  <option value="">Pilih karyawan...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jenis Bonus</label>
                <select value={program} onChange={e => setProgram(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none">
                  {BONUS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah (Rp)</label>
                <input value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))}
                  placeholder="0" className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Bulan</label>
                  <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                    {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tahun</label>
                  <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status Awal</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Bonus & Insentif</h1>
          <p className="text-sm text-gray-500">Kelola bonus dan insentif khusus karyawan.</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Tambah Bonus
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Bonus</p>
              <p className="text-xl font-extrabold text-slate-800">{fmt(totalBonus)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sudah Dibayarkan</p>
              <p className="text-xl font-extrabold text-slate-800">{fmt(paidBonus)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Star size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Persetujuan</p>
              <p className="text-xl font-extrabold text-slate-800">{pendingBonus}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Gift size={16} className="text-[#CC0000]" /> Daftar Bonus & Insentif
          </h3>
          <span className="text-xs text-slate-400">{bonuses.length} entri</span>
        </div>
        {bonuses.length === 0 ? (
          <EmptyState icon={Gift} title="Belum ada bonus yang dicatat." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Karyawan", "Jenis", "Jumlah", "Periode", "Status", "Aksi"].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bonuses.map(b => {
                  const empInfo = b.employees as { full_name: string; department: string; } | undefined;
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-800">{empInfo?.full_name || b.employee_id}</p>
                        <p className="text-[10px] text-slate-400">{empInfo?.department || ""}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">{b.program}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">{fmt(Number(b.amount) || 0)}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{b.period || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusStyle(b.status)}`}>{b.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        {b.status === "Pending" && (
                          <button onClick={() => handleStatus(b.id, "Disetujui")} disabled={actingId === b.id}
                            className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mr-2">
                            Setujui
                          </button>
                        )}
                        {b.status === "Disetujui" && (
                          <button onClick={() => handleStatus(b.id, "Dibayarkan")} disabled={actingId === b.id}
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
        )}
      </div>
    </div>
  );
}
