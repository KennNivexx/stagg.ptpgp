"use client";

import { useState } from "react";
import { FileText, AlertTriangle, Clock, Users, X, Save, RefreshCw, CheckCircle2, Search, Pencil } from "lucide-react";
import { saveEmployeeContract, updateEmployeeStatus } from "@/app/actions/admin";

type Employee = Record<string, string>;
type ContractRecord = Record<string, string>;

interface Props {
  employees: Employee[];
  contracts: ContractRecord[];
}

export default function ContractsClient({ employees: initialEmployees, contracts: initialContracts }: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [contracts] = useState(initialContracts);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({
    employeeId: "", contractType: "Kontrak",
    startDate: new Date().toISOString().split("T")[0], endDate: "", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const getLatestContract = (empId: string): ContractRecord | null =>
    contracts.filter((c) => c.employee_id === empId)[0] || null;

  const getContractEndDate = (emp: Employee): { date: string; source: "real" | "estimated" } => {
    const real = getLatestContract(emp.id);
    if (real?.end_date) return { date: real.end_date, source: "real" };
    if (!emp.join_date) return { date: "", source: "estimated" };
    const start = new Date(emp.join_date);
    const end = new Date(start);
    if (emp.status === "Tetap") end.setFullYear(end.getFullYear() + 2);
    else if (emp.status === "Kontrak") end.setFullYear(end.getFullYear() + 1);
    else end.setMonth(end.getMonth() + 6);
    return { date: end.toISOString().split("T")[0], source: "estimated" };
  };

  const getRemainingDays = (dateStr: string): number => {
    if (!dateStr) return 999;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  };

  const statusBadgeColor = (remaining: number) => {
    if (remaining <= 0)  return "bg-red-50 text-red-700 border-red-100";
    if (remaining <= 30) return "bg-orange-50 text-orange-700 border-orange-100";
    if (remaining <= 60) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  };

  const contractLabel = (status: string) => {
    if (status === "Tetap")    return { label: "Tetap",    color: "bg-emerald-50 text-emerald-700" };
    if (status === "Kontrak")  return { label: "Kontrak",  color: "bg-amber-50 text-amber-700" };
    if (status === "Magang")   return { label: "Magang",   color: "bg-purple-50 text-purple-700" };
    return { label: status || "-", color: "bg-slate-100 text-slate-500" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
    const result = await saveEmployeeContract(fd);
    setSaving(false);
    if ("error" in result) { setSaveMsg({ type: "error", text: result.error }); return; }
    setSaveMsg({ type: "success", text: "Kontrak berhasil disimpan." });
    setShowForm(false);
    setFormData({ employeeId: "", contractType: "Kontrak", startDate: new Date().toISOString().split("T")[0], endDate: "", notes: "" });
    setTimeout(() => setSaveMsg(null), 4000);
  };

  const openEditContract = (emp: Employee) => {
    const real = getLatestContract(emp.id);
    const { date: fallbackEnd } = getContractEndDate(emp);
    setFormData({
      employeeId: emp.id,
      contractType: real?.contract_type || emp.status || "Kontrak",
      startDate: real?.start_date || emp.join_date || new Date().toISOString().split("T")[0],
      endDate: real?.end_date || (real ? "" : fallbackEnd),
      notes: real?.notes || "",
    });
    setSaveMsg(null);
    setShowForm(true);
  };

  const filteredEmployees = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [e.full_name, e.department, e.position, e.kode].some((f) => f?.toLowerCase().includes(q));
  });

  const handleUpdateStatus = async (empId: string, newStatus: string) => {
    setUpdatingStatus(empId);
    const result = await updateEmployeeStatus(empId, newStatus);
    setUpdatingStatus(null);
    if (result?.error) { setSaveMsg({ type: "error", text: result.error }); return; }
    setEmployees((prev) => prev.map((e) => e.id === empId ? { ...e, status: newStatus } : e));
    setSaveMsg({ type: "success", text: `Status berhasil diubah menjadi ${newStatus}.` });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const warningCount = employees.filter((e) => {
    const { date } = getContractEndDate(e);
    const r = getRemainingDays(date);
    return r > 0 && r <= 30;
  }).length;
  const upcomingCount = employees.filter((e) => {
    const { date } = getContractEndDate(e);
    const r = getRemainingDays(date);
    return r > 30 && r <= 60;
  }).length;
  const expiredCount = employees.filter((e) => {
    const { date } = getContractEndDate(e);
    return getRemainingDays(date) <= 0;
  }).length;

  // Kontrak yang akan berakhir dalam 60 hari ke depan (termasuk yang sudah lewat),
  // diurutkan dari yang paling mendesak — dipakai untuk banner peringatan HRD.
  const expiringSoon = employees
    .map((e) => {
      const { date, source } = getContractEndDate(e);
      return { emp: e, date, source, remaining: getRemainingDays(date) };
    })
    .filter((x) => x.date && x.remaining <= 60)
    .sort((a, b) => a.remaining - b.remaining);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Manajemen Kontrak Kerja</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kontrak dan ubah status karyawan secara langsung. Daftar karyawan mengikuti Struktur Organisasi.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode, departemen..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
          />
        </div>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {saveMsg.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {saveMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Karyawan Aktif", value: employees.length, icon: Users, color: "bg-blue-50 text-blue-600" },
          { label: "Mendekati Berakhir (31-60 hari)", value: upcomingCount, icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
          { label: "Segera Berakhir (<30 hari)", value: warningCount, icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
          { label: "Sudah Berakhir", value: expiredCount, icon: Clock, color: "bg-red-50 text-red-600" },
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

      {expiringSoon.length > 0 && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm mb-6 overflow-hidden">
          <div className="p-4 border-b border-orange-100 bg-orange-50/60 flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 text-orange-700 rounded-lg shrink-0">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-orange-800 text-sm">Akan Berakhir &mdash; Perlu Tindakan</h3>
              <p className="text-[11px] text-orange-700/80">Kontrak yang berakhir dalam 60 hari ke depan atau sudah lewat tenggat.</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {expiringSoon.map(({ emp, date, source, remaining }) => (
              <div key={emp.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/40 transition-colors">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  {emp.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{emp.full_name}</p>
                  <p className="text-[10px] text-slate-400">
                    {emp.department} &middot; Tenggat {new Date(date).toLocaleDateString("id-ID")}
                    {source === "estimated" && <span className="italic"> (estimasi)</span>}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border shrink-0 ${statusBadgeColor(remaining)}`}>
                  {remaining <= 0 ? "Berakhir" : `${remaining} hari lagi`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Edit Kontrak Kerja</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
                <div className="w-full border border-slate-100 bg-slate-50 p-2.5 rounded-xl text-sm text-slate-600">
                  {employees.find((e) => e.id === formData.employeeId)?.full_name || "-"}
                  {" — "}
                  {employees.find((e) => e.id === formData.employeeId)?.department || "-"}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kontrak</label>
                <select value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="Kontrak">Kontrak</option>
                  <option value="Tetap">Karyawan Tetap</option>
                  <option value="Magang">Magang / Internship</option>
                  <option value="PKWT">PKWT</option>
                  <option value="PKWTT">PKWTT</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input type="date" required value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Berakhir</label>
                  <input type="date" value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" rows={2} placeholder="Catatan tambahan..." />
              </div>
              <button type="submit" disabled={saving || !formData.employeeId}
                className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Save size={14} /> {saving ? "Menyimpan..." : "Simpan Kontrak"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Karyawan</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Departemen</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Jenis Kontrak</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Mulai</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Berakhir</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sisa Hari</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmployees.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-400">Tidak ada karyawan yang cocok dengan pencarian.</td></tr>
              )}
              {filteredEmployees.map((emp) => {
                const { date: endDate, source } = getContractEndDate(emp);
                const remaining = getRemainingDays(endDate);
                const badge = contractLabel(emp.status);
                const realCtr = getLatestContract(emp.id);
                const isUpdating = updatingStatus === emp.id;
                return (
                  <tr key={emp.id} className={`hover:bg-slate-50/30 transition-colors ${remaining <= 30 && remaining > 0 ? "bg-red-50/10" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {emp.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{emp.full_name}</p>
                          <p className="text-[10px] text-slate-400">{emp.position || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-semibold">{emp.department || "-"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${badge.color}`}>
                          {realCtr?.contract_type || badge.label}
                        </span>
                        {realCtr && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-bold border border-emerald-100">✓</span>
                        )}
                        <button onClick={() => openEditContract(emp)} title="Edit Kontrak"
                          className="p-1 text-slate-400 hover:text-[#CC0000] hover:bg-red-50 rounded-md transition-colors">
                          <Pencil size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {realCtr?.start_date
                        ? new Date(realCtr.start_date).toLocaleDateString("id-ID")
                        : emp.join_date ? new Date(emp.join_date).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs text-slate-600">{endDate ? new Date(endDate).toLocaleDateString("id-ID") : "-"}</p>
                        {source === "estimated" && endDate && <p className="text-[9px] text-slate-300 italic">estimasi</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusBadgeColor(remaining)}`}>
                        {remaining <= 0 ? "Berakhir" : `${remaining} hari`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.status === "Kontrak" && (
                        <button onClick={() => handleUpdateStatus(emp.id, "Tetap")} disabled={isUpdating}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-60">
                          {isUpdating ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                          Angkat Tetap
                        </button>
                      )}
                      {emp.status === "Magang" && (
                        <button onClick={() => handleUpdateStatus(emp.id, "Kontrak")} disabled={isUpdating}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-60">
                          {isUpdating ? <RefreshCw size={10} className="animate-spin" /> : <FileText size={10} />}
                          Jadikan Kontrak
                        </button>
                      )}
                      {emp.status === "Tetap" && (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 size={10} /> Tetap
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <p className="text-xs text-slate-500">
            Total <span className="font-bold text-slate-800">{employees.length}</span> karyawan aktif
            {warningCount > 0 && <span className="text-orange-600 font-bold ml-2">· {warningCount} akan berakhir</span>}
          </p>
          <p className="text-[10px] text-slate-300 italic">
            Badge ✓ = data dari kontrak nyata · tanpa badge = estimasi dari tanggal bergabung
          </p>
        </div>
      </div>
    </div>
  );
}
