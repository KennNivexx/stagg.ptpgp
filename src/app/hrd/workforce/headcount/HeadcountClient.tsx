"use client";

import { useState } from "react";
import { BarChart3, Users, Building2, TrendingUp, AlertCircle, Edit3, Check, X, RefreshCw } from "lucide-react";
import { updateHeadcount, syncAllHeadcounts } from "@/app/actions/headcount";

interface DeptHC {
  id: string; name: string; current: number; approved: number;
}

export default function HeadcountClient({
  initialData,
}: {
  initialData: DeptHC[];
}) {
  const [data, setData] = useState(initialData);
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const startEdit = (dept: DeptHC) => {
    setEditing(dept.id);
    setEditVal(dept.approved || dept.current);
  };
  const cancelEdit = () => setEditing(null);
  const saveEdit = async (dept: DeptHC) => {
    const prev = dept.approved;
    setData(prevData => prevData.map(d => d.id === dept.id ? { ...d, approved: editVal } : d));
    setEditing(null);
    try {
      await updateHeadcount(dept.id, editVal);
    } catch {
      setData(prevData => prevData.map(d => d.id === dept.id ? { ...d, approved: prev } : d));
      showToast("Gagal menyimpan. Coba lagi.");
    }
  };

  const quickChange = async (dept: DeptHC, delta: number) => {
    const n = Math.max(0, dept.approved + delta);
    const prev = dept.approved;
    setData(prevData => prevData.map(d => d.id === dept.id ? { ...d, approved: n } : d));
    try {
      await updateHeadcount(dept.id, n);
    } catch {
      setData(prevData => prevData.map(d => d.id === dept.id ? { ...d, approved: prev } : d));
      showToast("Gagal menyimpan. Coba lagi.");
    }
  };

  const syncFromEmployees = async () => {
    setSyncing(true);
    try {
      await syncAllHeadcounts();
      setData(prev => prev.map(d => ({ ...d, approved: d.current })));
    } catch {
      showToast("Sinkronisasi gagal.");
    }
    setSyncing(false);
  };

  const totalCurrent = data.reduce((s, d) => s + d.current, 0);
  const totalApproved = data.reduce((s, d) => s + d.approved, 0);
  const totalVariance = totalApproved - totalCurrent;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-red-50 text-red-700 border border-red-200 text-sm font-bold">
          {toast}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Headcount Planning</h1>
          <p className="text-sm text-gray-500">Headcount otomatis mengikuti jumlah karyawan. Bisa diubah manual kapan saja.</p>
        </div>
        <button
          onClick={syncFromEmployees}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Menyinkronkan..." : "Sinkronkan dari Data Karyawan"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Karyawan Saat Ini", value: totalCurrent, icon: <Users size={18} />, color: "blue" },
          { label: "Headcount Disetujui", value: totalApproved, icon: <BarChart3 size={18} />, color: "emerald" },
          { label: "Kekosongan", value: totalVariance, icon: <TrendingUp size={18} />, color: totalVariance > 0 ? "amber" : "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                stat.color === "blue" ? "bg-blue-50 text-blue-600" :
                stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                stat.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
              }`}>{stat.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Headcount per Departemen</h3>
              <p className="text-xs text-slate-400 mt-0.5">Klik angka di kolom Disetujui untuk mengubah jatah headcount</p>
            </div>
          </div>
        </div>

        <div className="hidden sm:grid grid-cols-12 gap-2 px-6 py-3 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Departemen</div>
          <div className="col-span-2 text-center">Saat Ini</div>
          <div className="col-span-2 text-center">Disetujui (±)</div>
          <div className="col-span-2 text-center">Kekosongan</div>
          <div className="col-span-2 text-center">Progress</div>
        </div>

        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
          {data.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data.</p>
            </div>
          ) : (
            data.map((dept) => {
              const pct = dept.approved > 0 ? Math.round((dept.current / dept.approved) * 100) : 0;
              const isEmpty = dept.approved === 0;
              const isFull = !isEmpty && dept.current >= dept.approved;
              const isOver = !isEmpty && dept.current > dept.approved;
              const isEditing = editing === dept.id;

              return (
                <div key={dept.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <p className="text-sm font-bold text-slate-800">{dept.name}</p>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`text-sm font-extrabold ${dept.current > 0 ? "text-slate-800" : "text-slate-300"}`}>{dept.current}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number" min={0} value={editVal}
                            onChange={e => setEditVal(Number(e.target.value))}
                            className="w-14 px-1.5 py-1 border border-sky-300 rounded text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                            autoFocus
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(dept); if (e.key === "Escape") cancelEdit(); }}
                          />
                          <button onClick={() => saveEdit(dept)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={14} /></button>
                          <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-50 rounded"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => quickChange(dept, -1)}
                            className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 text-slate-500 flex items-center justify-center text-xs font-bold transition-colors"
                            title="Kurangi kuota"
                          >−</button>
                          <button onClick={() => startEdit(dept)} className="text-sm font-bold text-slate-600 hover:text-sky-600 hover:underline inline-flex items-center gap-0.5 transition-colors group min-w-[20px] text-center justify-center">
                            {dept.approved}
                            <Edit3 size={10} className="opacity-0 group-hover:opacity-100 text-sky-400" />
                          </button>
                          <button
                            onClick={() => quickChange(dept, 1)}
                            className="w-5 h-5 rounded bg-sky-100 hover:bg-sky-200 text-sky-600 flex items-center justify-center text-xs font-bold transition-colors"
                            title="Tambah kuota"
                          >+</button>
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-center">
                      {isEmpty ? (
                        <span className="text-[10px] font-bold text-slate-400">Tentukan kuota →</span>
                      ) : isOver ? (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Kelebihan {dept.current - dept.approved}</span>
                      ) : dept.approved > dept.current ? (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Kosong {dept.approved - dept.current}</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">Penuh</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          {isEmpty ? (
                            <div className="h-full bg-amber-200 w-full" />
                          ) : (
                            <div className={`h-full rounded-full ${isOver ? "bg-red-500" : isFull ? "bg-emerald-500" : "bg-blue-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          )}
                        </div>
                        <span className={`text-[10px] font-bold w-8 text-right ${isEmpty ? "text-amber-500" : isOver ? "text-red-600" : "text-slate-600"}`}>
                          {isEmpty ? "—" : `${pct}%`}
                        </span>
                        {isOver && <AlertCircle size={12} className="text-red-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 text-[10px] text-slate-400">
          <span className="text-sky-600 font-bold">Sinkronkan</span> = samakan semua headcount dengan jumlah karyawan saat ini. Klik angka untuk override manual.
        </div>
      </div>
    </div>
  );
}
