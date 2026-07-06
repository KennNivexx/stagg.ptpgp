"use client";

import { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";
import { getDeptData, getMyDept } from "@/app/actions/department";
import { saveKpiEvaluation } from "@/app/actions/performance-hrd";

interface Employee {
  id: string; full_name: string; position: string; kode?: string;
}

export default function DepartmentKpiPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [period, setPeriod] = useState("");
  const [score, setScore] = useState("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee || !period) {
      setMsg({ type: "error", text: "Karyawan dan periode wajib diisi." });
      return;
    }
    setLoading(true); setMsg(null);
    const fd = new FormData();
    fd.set("employee_id", selectedEmployee);
    fd.set("period", period);
    fd.set("score", score || "0");
    const result = await saveKpiEvaluation(fd);
    setLoading(false);
    if ("error" in result) {
      setMsg({ type: "error", text: result.error ?? "Gagal menyimpan." });
    } else {
      setMsg({ type: "success", text: "KPI berhasil disimpan!" });
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">KPI Karyawan</h1>
        <p className="text-sm text-slate-500 mt-1">Isi penilaian KPI untuk karyawan di departemen Anda.</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
          <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
            <option value="">Pilih Karyawan</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}{e.kode ? ` (${e.kode})` : ""} — {e.position}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Periode</label>
          <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)}
            placeholder="cth: 2026-Q3 atau Juli 2026"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skor (0-100)</label>
          <input type="number" min="0" max="100" value={score} onChange={(e) => setScore(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
        </div>
        {msg && (
          <div className={`p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{msg.text}</div>
        )}
        <button type="submit" disabled={loading}
          className="w-full px-4 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          <TrendingUp size={14} /> {loading ? "Menyimpan..." : "Simpan KPI"}
        </button>
      </form>
    </div>
  );
}
