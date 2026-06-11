"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, AlertTriangle, Clock, Users, Plus, X, Save } from "lucide-react";

type Employee = {
  id: string;
  full_name: string;
  department: string;
  position: string;
  status: string;
  join_date: string;
};

export default function ManajemenKontrakKerja() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    contractType: "Kontrak",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    supabase
      .from("employees")
      .select("id, full_name, department, position, status, join_date")
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        setEmployees((data as Employee[]) || []);
        setLoading(false);
      });
  }, []);

  const getContractEndDate = (emp: Employee): string => {
    if (!emp.join_date) return "";
    const start = new Date(emp.join_date);
    const end = new Date(start);
    if (emp.status === "Tetap") {
      end.setFullYear(end.getFullYear() + 2);
    } else if (emp.status === "Kontrak") {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 6);
    }
    return end.toISOString().split("T")[0];
  };

  const getRemainingDays = (endDate: string): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (remaining: number) => {
    if (remaining <= 0) return "bg-red-50 text-red-700 border-red-100";
    if (remaining <= 30) return "bg-orange-50 text-orange-700 border-orange-100";
    if (remaining <= 60) return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  };

  const getContractLabel = (status: string) => {
    if (status === "Tetap") return { label: "Tetap", color: "bg-emerald-50 text-emerald-700" };
    if (status === "Kontrak") return { label: "Kontrak", color: "bg-amber-50 text-amber-700" };
    return { label: "Magang", color: "bg-purple-50 text-purple-700" };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Kontrak berhasil disimpan!\n\n" + JSON.stringify(formData, null, 2));
    setShowForm(false);
    setFormData({ employeeId: "", contractType: "Kontrak", startDate: "", endDate: "", notes: "" });
  };

  const warningCount = employees.filter((e) => getRemainingDays(getContractEndDate(e)) <= 30 && getRemainingDays(getContractEndDate(e)) > 0).length;
  const expiredCount = employees.filter((e) => getRemainingDays(getContractEndDate(e)) <= 0).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Manajemen Kontrak Kerja</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kontrak kerja, perpanjangan, dan status kontrak karyawan.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Kontrak
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{employees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Segera Berakhir {'(<30 hari)'}</p>
              <p className="text-xl font-extrabold text-slate-800">{warningCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sudah Berakhir</p>
              <p className="text-xl font-extrabold text-slate-800">{expiredCount}</p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah/Edit Kontrak Kerja</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                >
                  <option value="">Pilih Karyawan</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.full_name} - {e.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kontrak</label>
                <select
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                >
                  <option value="Kontrak">Kontrak</option>
                  <option value="Tetap">Tetap</option>
                  <option value="Magang">Magang</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Berakhir</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  rows={2}
                  placeholder="Catatan kontrak..."
                />
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Save size={14} /> Simpan Kontrak
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat data kontrak...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Kontrak</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Mulai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Berakhir</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sisa Hari</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp) => {
                  const endDate = getContractEndDate(emp);
                  const remaining = getRemainingDays(endDate);
                  const contract = getContractLabel(emp.status);
                  return (
                    <tr key={emp.id} className={`hover:bg-slate-50/30 transition-colors ${remaining <= 30 && remaining > 0 ? "bg-red-50/20" : ""}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                            {emp.full_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <p className="font-bold text-slate-800 text-xs">{emp.full_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-semibold">
                          {emp.department || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${contract.color}`}>
                          {contract.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {emp.join_date ? new Date(emp.join_date).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {endDate ? new Date(endDate).toLocaleDateString("id-ID") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusColor(remaining)}`}>
                          {remaining <= 0 ? "Berakhir" : `${remaining} hari`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {remaining <= 0 ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">Tidak Aktif</span>
                        ) : remaining <= 30 ? (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">Perhatian</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">Aktif</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Total: <span className="font-bold text-slate-800">{employees.length}</span> kontrak
              {warningCount > 0 && (
                <span className="text-orange-600 font-bold ml-2">({warningCount} akan berakhir)</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
