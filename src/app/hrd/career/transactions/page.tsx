"use client";

import { useState } from "react";
import { ArrowRightLeft, Search, Plus, Filter, CheckCircle2, XCircle, Clock } from "lucide-react";

// Mock data for career transactions
const MOCK_TRANSACTIONS = [
  { id: "TRX-001", type: "Promotion", employee: "Budi Santoso", from: "Staff IT", to: "SPV IT", date: "2026-08-01", status: "Approved" },
  { id: "TRX-002", type: "Mutation", employee: "Andi Saputra", from: "SPV Sales JKT", to: "SPV Sales BDG", date: "2026-07-25", status: "In Review" },
  { id: "TRX-003", type: "Rotation", employee: "Siti Aminah", from: "Admin HR", to: "Admin Finance", date: "2026-07-15", status: "Executed" },
  { id: "TRX-004", type: "Acting Assignment", employee: "Rudi Hermawan", from: "Manager Produksi", to: "Plt. GM Produksi", date: "2026-07-10", status: "Executed" },
];

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "Approved": return <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12} /> Approved</span>;
    case "In Review": return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> In Review</span>;
    case "Executed": return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={12} /> Executed</span>;
    case "Rejected": return <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><XCircle size={12} /> Rejected</span>;
    default: return <span className="px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-bold uppercase tracking-wider">{status}</span>;
  }
};

export default function CareerTransactionsPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
            <ArrowRightLeft className="text-fuchsia-600" />
            Transaksi & Pergerakan Karier
          </h1>
          <p className="text-sm text-gray-500">
            Kelola pengajuan promosi, mutasi, rotasi, dan penugasan khusus karyawan beserta alur persetujuannya.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <Plus size={18} /> Buat Transaksi Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-slate-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari karyawan atau ID transaksi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/20"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4 font-bold">ID Transaksi</th>
                <th className="px-6 py-4 font-bold">Karyawan</th>
                <th className="px-6 py-4 font-bold">Tipe</th>
                <th className="px-6 py-4 font-bold">Perubahan Jabatan</th>
                <th className="px-6 py-4 font-bold">Tanggal Efektif</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_TRANSACTIONS.map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{trx.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                        {trx.employee.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-800">{trx.employee}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-slate-700">{trx.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] text-slate-400 line-through">{trx.from}</span>
                      <span className="text-xs font-bold text-fuchsia-700">{trx.to}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">
                    {trx.date}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={trx.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-xs font-semibold text-fuchsia-600 hover:text-fuchsia-800 transition-colors">
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {MOCK_TRANSACTIONS.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">
            Tidak ada transaksi ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}
