import { supabaseAdmin } from "@/lib/supabase";
import { DollarSign, Download, FileText, Clock, Users } from "lucide-react";

export default async function PayrollPage() {
  const { data: payrolls, error } = await supabaseAdmin
    .from("payroll")
    .select("*, employees!inner(full_name, department, position)")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(20);

  const { count: totalEmployees } = await supabaseAdmin
    .from("employees")
    .select("*", { count: "exact", head: true });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Payroll</h1>
        <p className="text-sm text-gray-500">Kelola penggajian dan slip gaji seluruh karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEmployees || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Slip Gaji Dibuat</p>
              <p className="text-xl font-extrabold text-slate-800">{payrolls?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Diproses</p>
              <p className="text-xl font-extrabold text-slate-800">{(payrolls || []).filter((p: Record<string, unknown>) => p.status === "Draft").length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Slip Gaji</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat penggajian karyawan</p>
          </div>
          <button
            disabled={(totalEmployees || 0) === 0}
            title={(totalEmployees || 0) === 0 ? "Tambahkan data karyawan terlebih dahulu" : ""}
            className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Generate Slip Baru
          </button>
        </div>

        {error ? (
          <div className="p-12 text-center text-red-600 text-sm">{error.message}</div>
        ) : !payrolls || payrolls.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada data payroll.</p>
            <p className="text-xs text-slate-400 mt-1">Generate slip gaji untuk memulai pengelolaan payroll.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Periode</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gaji Pokok</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tunjangan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Potongan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bersih</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payrolls.map((p: Record<string, unknown>) => {
                  const emp = p.employees as Record<string, string> | undefined;
                  return (
                    <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                        {["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][Number(p.month) || 0] || "-"} {String(p.year || "")}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-medium">
                        Rp {(Number(p.basic_salary) || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-xs text-emerald-600 font-medium">
                        Rp {(Number(p.allowances) || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-xs text-red-600 font-medium">
                        Rp {(Number(p.deductions) || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">
                        Rp {(Number(p.net_salary) || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          p.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                          p.status === "Approved" ? "bg-blue-50 text-blue-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {p.status === "Draft" ? "Draft" : p.status === "Paid" ? "Dibayar" : p.status as string}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Download Slip">
                          <Download size={14} />
                        </button>
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
