"use client";

import { useState, useEffect } from "react";
import { Wallet, Search, UserCheck, Info } from "lucide-react";
import { getLeaveBalances } from "@/app/actions/workforce-time";
import EmptyState from "@/components/EmptyState";

interface LeaveBalance {
  employee_id: string; employee_name: string; kode_jabatan: string; department: string;
  total_hari: number; terpakai: number; sisa: number;
  jenis: Record<string, { total: number; terpakai: number }>;
}

export default function SaldoCutiPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [filtered, setFiltered] = useState<LeaveBalance[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveBalance | null>(null);

  useEffect(() => {
    getLeaveBalances().then(data => {
      setBalances(data as LeaveBalance[]);
      setFiltered(data as LeaveBalance[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(balances); return; }
    const q = search.toLowerCase();
    setFiltered(balances.filter(b =>
      b.employee_name.toLowerCase().includes(q) ||
      b.kode_jabatan.toLowerCase().includes(q) ||
      b.department.toLowerCase().includes(q)
    ));
  }, [search, balances]);

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Saldo Cuti</h1>
        <p className="text-sm text-gray-500">Sisa cuti ditampilkan menyamping setara dengan data karyawan — tanpa pop-up.</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari berdasarkan nama, kode jabatan, atau departemen..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-red-200 focus:border-red-300 outline-none"
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Karyawan", value: balances.length, icon: UserCheck, color: "bg-blue-50 text-blue-600" },
          { label: "Sisa Cuti Terbanyak", value: Math.max(...balances.map(b => b.sisa), 0) + " hari", icon: Wallet, color: "bg-emerald-50 text-emerald-600" },
          { label: "Total Cuti Terpakai", value: balances.reduce((s, b) => s + b.terpakai, 0) + " hari", icon: Info, color: "bg-amber-50 text-amber-600" },
          { label: "Rata-rata Sisa", value: Math.round(balances.reduce((s, b) => s + b.sisa, 0) / Math.max(balances.length, 1)) + " hari", icon: Wallet, color: "bg-purple-50 text-purple-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${s.color}`}><s.icon size={16} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-side leave balance table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Wallet} title="Belum ada data saldo cuti." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Nama Karyawan</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Kode Jabatan</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase">Departemen</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center">Total</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center">Terpakai</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center">Sisa</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center">Progress</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((b, i) => {
                  const pct = b.total_hari > 0 ? Math.round((b.terpakai / b.total_hari) * 100) : 0;
                  const barColor = pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-amber-500" : "bg-emerald-500";
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-800">{b.employee_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{b.kode_jabatan || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{b.department || "—"}</td>
                      <td className="px-4 py-3 text-center font-semibold">{b.total_hari}</td>
                      <td className="px-4 py-3 text-center text-amber-600 font-semibold">{b.terpakai}</td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-bold">{b.sisa}</td>
                      <td className="px-4 py-3" style={{ minWidth: 100 }}>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelected(selected === b ? null : b)}
                          className="text-xs font-bold text-[#CC0000] hover:underline"
                        >
                          {selected === b ? "Tutup" : "Jenis"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Inline detail panel (bukan pop-up) */}
            {selected && (
              <div className="border-t-2 border-red-100 bg-red-50/30 p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-2">
                  Rincian Cuti: {selected.employee_name} ({selected.kode_jabatan || selected.department})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(selected.jenis).map(([jenis, detail]) => (
                    <div key={jenis} className="bg-white p-3 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-600">{jenis}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-slate-400">Total: <strong className="text-slate-700">{detail.total}</strong></span>
                        <span className="text-xs text-amber-500">Terpakai: <strong>{detail.terpakai}</strong></span>
                        <span className="text-xs text-emerald-600">Sisa: <strong>{detail.total - detail.terpakai}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
