"use client";

import { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { getDeptData, getMyDept } from "@/app/actions/department";
import { issueWarning, getEmployeeWarnings } from "@/app/actions/employee";

interface Employee {
  id: string; full_name: string; email: string;
  kode?: string; position: string;
}

export default function DepartmentWarningsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [warnings, setWarnings] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [spLevel, setSpLevel] = useState("SP1");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    getMyDept().then(({ dept }) => {
      if (!dept) { setLoading(false); return; }
      return getDeptData(dept);
    }).then((data) => {
      if (data) setEmployees((data.employees || []) as Employee[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function loadWarnings() {
    if (!selectedEmployee) return;
    const data = await getEmployeeWarnings(selectedEmployee);
    setWarnings(data || []);
  }

  useEffect(() => {
    if (selectedEmployee) loadWarnings();
    else setWarnings([]);
  }, [selectedEmployee]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmployee);
    if (!emp) { setMsg({ type: "error", text: "Pilih karyawan terlebih dahulu." }); return; }
    if (!reason.trim()) { setMsg({ type: "error", text: "Alasan wajib diisi." }); return; }
    setLoading(true); setMsg(null);
    const fd = new FormData();
    fd.set("employee_id", emp.id);
    fd.set("employee_name", emp.full_name);
    fd.set("employee_email", emp.email);
    fd.set("sp_level", spLevel);
    fd.set("reason", reason.trim());
    const result = await issueWarning(fd);
    setLoading(false);
    if ("error" in result) {
      setMsg({ type: "error", text: result.error ?? "Gagal menyimpan." });
    } else {
      setMsg({ type: "success", text: "SP berhasil dikeluarkan!" });
      setReason("");
      await loadWarnings();
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Surat Peringatan</h1>
        <p className="text-sm text-slate-500 mt-1">Keluarkan Surat Peringatan untuk karyawan di departemen Anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
          <select value={selectedEmployee} onChange={(e) => { setSelectedEmployee(e.target.value); setMsg(null); }}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
            <option value="">Pilih Karyawan</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}{e.kode ? ` (${e.kode})` : ""} — {e.position}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {["SP1", "SP2", "SP3"].map((lvl) => (
            <button key={lvl} type="button" onClick={() => setSpLevel(lvl)}
              className={`py-2.5 text-xs font-bold rounded-xl border-2 transition-colors ${
                spLevel === lvl ? "border-red-500 bg-red-50 text-red-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}>{lvl}</button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alasan</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            rows={4} placeholder="Jelaskan alasan pemberian SP..."
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
        </div>

        {msg && (
          <div className={`p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
        )}

        <button type="submit" disabled={loading}
          className="w-full px-4 py-2.5 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <ShieldAlert size={14} /> {loading ? "Menyimpan..." : "Keluarkan SP"}
        </button>
      </form>

      {warnings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-xl">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4">Riwayat SP</h3>
          <div className="space-y-3">
            {warnings.map((w: Record<string, unknown>, i: number) => (
              <div key={i} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-red-600">{w.sp_level as string}</span>
                  <p className="text-xs text-slate-600 mt-0.5">{w.reason as string}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  w.status === "Aktif" ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-500"
                }`}>{w.status as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
