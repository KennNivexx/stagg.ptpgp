"use client";

import { useState } from "react";
import { FileText, Wallet, Gift, Receipt } from "lucide-react";
import { getTotalRewardsStatement } from "@/app/actions/rewards";
import RankedBar from "@/components/charts/RankedBar";
import EmptyState from "@/components/EmptyState";

type Employee = { id: string; full_name: string; department: string; position: string };
type Statement = Awaited<ReturnType<typeof getTotalRewardsStatement>>;

const CURRENT_YEAR = new Date().getFullYear();

function fmt(n: number) { return `Rp ${n.toLocaleString("id-ID")}`; }

export default function StatementClient({ employees }: { employees: Employee[] }) {
  const [employeeId, setEmployeeId] = useState("");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [loading, setLoading] = useState(false);
  const [statement, setStatement] = useState<Statement | null>(null);

  const load = async (empId: string, y: number) => {
    if (!empId) { setStatement(null); return; }
    setLoading(true);
    const data = await getTotalRewardsStatement(empId, y);
    setLoading(false);
    setStatement(data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Karyawan</label>
          <select value={employeeId} onChange={e => { setEmployeeId(e.target.value); load(e.target.value, year); }}
            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs bg-white">
            <option value="">Pilih karyawan...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.position}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tahun</label>
          <input type="number" value={year} onChange={e => { const y = Number(e.target.value) || CURRENT_YEAR; setYear(y); load(employeeId, y); }}
            className="w-28 border border-gray-200 p-2.5 rounded-xl text-xs" />
        </div>
      </div>

      {loading && <p className="text-xs text-slate-400 text-center py-8">Memuat...</p>}

      {!loading && !statement && (
        <EmptyState icon={FileText} title="Pilih karyawan untuk melihat Total Rewards Statement." />
      )}

      {!loading && statement && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white">
            <p className="text-xs text-slate-300">{statement.employee?.full_name} — {statement.employee?.position} · {statement.employee?.department}</p>
            <p className="text-[10px] text-slate-400 mt-1">Total Rewards Statement {statement.year}</p>
            <p className="text-3xl font-extrabold mt-3">{fmt(statement.totalCompensation)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Total kompensasi setahun (gaji + tunjangan + bonus + insentif)</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Wallet, label: "Basic Salary (Setahun)", value: fmt(statement.annualBasicRecurring), color: "bg-blue-50 text-blue-600" },
              { icon: Wallet, label: "Tunjangan (Setahun)", value: fmt(statement.annualAllowancesRecurring), color: "bg-indigo-50 text-indigo-600" },
              { icon: Gift, label: "Total Bonus", value: fmt(statement.bonusTotal), color: "bg-emerald-50 text-emerald-600" },
              { icon: Gift, label: "Total Insentif", value: fmt(statement.incentiveTotal), color: "bg-amber-50 text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                    <p className="text-sm font-extrabold text-slate-800">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-1">Breakdown Komponen Kompensasi</h3>
            <p className="text-xs text-slate-400 mb-4">Perbandingan nilai per komponen dalam setahun</p>
            <RankedBar
              data={[
                { label: "Basic Salary", value: statement.annualBasicRecurring },
                { label: "Tunjangan", value: statement.annualAllowancesRecurring },
                { label: "Bonus", value: statement.bonusTotal },
                { label: "Insentif", value: statement.incentiveTotal },
              ]}
              height={220}
              valueFormatter={fmt}
              barLabel="Nilai"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-2"><Receipt size={16} className="text-pgp-red" /> Rekap Slip Gaji {statement.year}</h3>
            <p className="text-xs text-slate-400 mb-4">{statement.monthsPaid} slip gaji sudah digenerate untuk tahun ini</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-extrabold text-slate-800">{fmt(statement.totalNetPaid)}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Total Net Dibayar</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-800">{fmt(statement.totalTaxPaid)}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Total PPh 21</p>
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-800">{fmt(statement.totalBpjsDeducted)}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Total Potongan BPJS</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
