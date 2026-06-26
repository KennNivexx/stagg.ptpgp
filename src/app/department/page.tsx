"use client";

import { useState, useEffect } from "react";
import { Users, Briefcase, Clock, CheckCircle2, Plus, Send, AlertTriangle } from "lucide-react";
import { getDeptData, submitRequest, getMyDept } from "@/app/actions/department";

interface Employee {
  id: string; full_name: string; email: string; department: string;
  position: string; status: string; join_date: string;
}

interface Request {
  id: string; department: string; position: string;
  quantity: number; reason: string; urgency: string; status: string;
  requested_by: string; created_at: string;
}

const URGENCY = ["Tinggi", "Sedang", "Rendah"];

export default function DeptDashboard() {
  const [deptName, setDeptName] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [headcount, setHeadcount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const [fPos, setFPos] = useState("");
  const [fQty, setFQty] = useState(1);
  const [fUrgency, setFUrgency] = useState("Sedang");
  const [fReason, setFReason] = useState("");
  const [fErr, setFErr] = useState("");
  const [fLoading, setFLoading] = useState(false);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async (dname: string) => {
    setLoading(true);
    try {
      const data = await getDeptData(dname);
      setEmployees(data.employees || []);
      setRequests(data.requests || []);
      setHeadcount(data.headcount);
    } catch {
      showToast("error", "Gagal memuat data departemen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { dept } = await getMyDept();
      const department = dept || "";
      setDeptName(department);
      if (department) loadData(department);
      else setLoading(false);
    })();
  }, []);

  const doSubmit = async () => {
    if (!fPos.trim()) { setFErr("Posisi wajib diisi."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    fd.append("department", deptName);
    fd.append("position", fPos.trim());
    fd.append("quantity", String(fQty));
    fd.append("urgency", fUrgency);
    fd.append("reason", fReason.trim());
    const r = await submitRequest(fd);
    setFLoading(false);
    if (r && r.error) { showToast("error", r.error); return; }
    showToast("success", "Permintaan berhasil diajukan!");
    setFPos(""); setFQty(1); setFUrgency("Sedang"); setFReason("");
    loadData(deptName);
  };

  const pendingCount = requests.filter(r => r.status === "Pending").length;
  const approvedCount = requests.filter(r => r.status === "Disetujui").length;

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><AlertTriangle size={14} className="rotate-45" /></button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-pgp-navy mb-1">Dashboard Departemen</h1>
        <p className="text-sm text-gray-500">{deptName || "Departemen tidak ditemukan"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Karyawan", value: employees.length, icon: <Users size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Headcount", value: headcount, icon: <Briefcase size={18} />, color: "bg-violet-50 text-violet-600" },
          { label: "Request Pending", value: pendingCount, icon: <Clock size={18} />, color: "bg-amber-50 text-amber-600" },
          { label: "Request Disetujui", value: approvedCount, icon: <CheckCircle2 size={18} />, color: "bg-emerald-50 text-emerald-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2"><Plus size={16} className="text-emerald-700" /><h3 className="font-extrabold text-slate-800 text-sm">Ajukan Permintaan SDM</h3></div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Posisi *</label>
              <input value={fPos} onChange={e => setFPos(e.target.value)} placeholder="Nama posisi yang dibutuhkan"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Jumlah</label>
                <input type="number" min={1} value={fQty} onChange={e => setFQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Urgensi</label>
                <select value={fUrgency} onChange={e => setFUrgency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                  {URGENCY.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Alasan</label>
              <textarea value={fReason} onChange={e => setFReason(e.target.value)} rows={2} placeholder="Alasan permintaan..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            {fErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2"><AlertTriangle size={14} className="text-red-500 shrink-0" /><p className="text-red-600 text-xs">{fErr}</p></div>}
            <button onClick={doSubmit} disabled={fLoading}
              className="w-full px-4 py-2.5 bg-emerald-700 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Send size={14} /> {fLoading ? "Mengirim..." : "Kirim Permintaan"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Karyawan Saat Ini</h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
            {employees.length === 0 ? (
              <div className="p-12 text-center"><Users size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-sm text-slate-500">Belum ada data karyawan.</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Nama</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Posisi</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Email</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-400 uppercase">Tgl Masuk</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{emp.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{emp.position}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{emp.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${(emp.status === "Tetap" || emp.status === "Kontrak") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{emp.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{emp.join_date ? new Date(emp.join_date).toLocaleDateString("id-ID") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
