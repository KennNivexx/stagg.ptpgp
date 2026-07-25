import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { DollarSign, Download, Gift, FileText, Users, Zap, Wallet, ClipboardCheck, Award } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";
import RewardBudgetPanel from "./RewardBudgetPanel";

const WORKFLOW_STEPS = [
  { n: 1, icon: Wallet, href: "/hrd/rewards/salary", label: "Atur Komponen Gaji", desc: "Isi gaji pokok & tunjangan tiap karyawan — wajib sebelum slip gaji bisa dibuat." },
  { n: 2, icon: FileText, href: "/hrd/rewards/payroll", label: "Generate Slip Gaji", desc: "Buat slip gaji per periode. Status awal selalu Draft." },
  { n: 3, icon: ClipboardCheck, href: "/hrd/rewards/payroll", label: "Setujui & Tandai Dibayar", desc: "Draft → Disetujui setelah dicek, → Dibayar setelah transfer selesai." },
  { n: 4, icon: Award, href: "/hrd/rewards/bonuses", label: "Kelola Bonus & Penghargaan", desc: "Opsional — tambahan di luar gaji pokok, ikut masuk ke slip gaji berikutnya." },
];

function currentPeriod() {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

export default async function HRDRewards() {
  const period = currentPeriod();
  const [{ data: payrolls, error }, { count: totalEmployees }, { count: pendingSuggestions }, { data: allIncentives }, { data: deptRows }] = await Promise.all([
    supabaseAdmin.from("penggajian").select("*, karyawan!inner(full_name, department)").order("year", { ascending: false }).order("month", { ascending: false }).limit(20),
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("insentif").select("*", { count: "exact", head: true }).like("program", "Aturan: %").eq("status", "Pending"),
    supabaseAdmin.from("insentif").select("amount").eq("period", period).in("status", ["Disetujui", "Dibayarkan"]),
    supabaseAdmin.from("karyawan").select("department").neq("status", "Inactive"),
  ]);

  const totalNetSalary = (payrolls || []).reduce(
    (sum: number, p: Record<string, unknown>) => sum + (Number(p.net_salary) || 0), 0
  );
  const budgetUsedThisMonth = (allIncentives || []).reduce((s, r: Record<string, unknown>) => s + (Number(r.amount) || 0), 0);
  const departments = [...new Set((deptRows || []).map((d: Record<string, unknown>) => d.department as string).filter(Boolean))].sort();

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Reward & Recognition</h1>
        <p className="text-sm text-gray-500">Formula reward, salary review, kompensasi, benefit, payroll, dan penghargaan karyawan</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="font-extrabold text-slate-800 text-sm mb-1">Alur Kerja Payroll</h3>
        <p className="text-xs text-slate-400 mb-4">Ikuti urutan ini kalau baru pertama kali pakai modul ini — tiap langkah butuh langkah sebelumnya selesai duluan.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WORKFLOW_STEPS.map((s) => (
            <Link key={s.n} href={s.href}
              className="relative flex flex-col gap-2 p-4 rounded-xl border border-slate-100 hover:border-[#CC0000]/30 hover:bg-red-50/30 transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#CC0000] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">{s.n}</span>
                <s.icon size={15} className="text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-800">{s.label}</p>
              <p className="text-[10px] text-slate-400 leading-snug">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <SectionQuickLinks groupLabel="Reward & Recognition" excludeHref="/hrd/rewards" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
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
              <p className="text-[10px] font-bold text-slate-400 uppercase">Slip Gaji</p>
              <p className="text-xl font-extrabold text-slate-800">{payrolls?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Gift size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Tunjangan</p>
              <p className="text-xl font-extrabold text-slate-800">
                Rp {(payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.allowances) || 0), 0).toLocaleString("id-ID").split(",")[0]}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><DollarSign size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Gaji Bersih</p>
              <p className="text-xl font-extrabold text-slate-800">
                Rp {totalNetSalary.toLocaleString("id-ID").split(",")[0]}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Zap size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Saran Reward Pending</p>
              <p className="text-xl font-extrabold text-slate-800">{pendingSuggestions || 0}</p>
              <p className="text-[9px] text-slate-400">dari Reward Rule Engine</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Gift size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Budget Terpakai Bulan Ini</p>
              <p className="text-lg font-extrabold text-slate-800">Rp {budgetUsedThisMonth.toLocaleString("id-ID").split(",")[0]}</p>
            </div>
          </div>
        </div>
      </div>

      <RewardBudgetPanel departments={departments} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4">Ringkasan Kompensasi</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Rata-rata Gaji Pokok</span>
              <span className="text-xs font-bold text-slate-800">
                Rp {((payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.basic_salary) || 0), 0) / Math.max(payrolls?.length || 1, 1)).toLocaleString("id-ID").split(",")[0]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Tunjangan</span>
              <span className="text-xs font-bold text-emerald-600">
                Rp {(payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.allowances) || 0), 0).toLocaleString("id-ID").split(",")[0]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Total Potongan</span>
              <span className="text-xs font-bold text-red-600">
                Rp {(payrolls || []).reduce((s: number, p: Record<string, unknown>) => s + (Number(p.deductions) || 0), 0).toLocaleString("id-ID").split(",")[0]}
              </span>
            </div>
            <hr className="border-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Total Bersih</span>
              <span className="text-xs font-bold text-blue-600">
                Rp {totalNetSalary.toLocaleString("id-ID").split(",")[0]}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Payroll</h3>
            <p className="text-xs text-slate-400 mt-0.5">Slip gaji terbaru</p>
          </div>

          {error ? (
            <div className="p-12 text-center text-red-600 text-sm">{error.message}</div>
          ) : !payrolls || payrolls.length === 0 ? (
            <EmptyState icon={DollarSign} title="Belum ada data payroll." description="Data payroll akan muncul setelah slip gaji dibuat." />
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
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bersih</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(payrolls as Record<string, unknown>[]).map((p) => {
                    const emp = p.karyawan as Record<string, string> | undefined;
                    return (
                      <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                          <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                          {monthNames[Number(p.month) || 0] || "-"} {String(p.year || "")}
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
                        <td className="px-6 py-4 text-right">
                          <a
                            href={`/api/payslip/${p.id as string}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 inline-flex transition-colors"
                            title="Lihat / Unduh slip gaji"
                          >
                            <Download size={14} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">Menampilkan <span className="font-bold text-slate-800">{payrolls?.length || 0}</span> slip gaji terbaru</p>
          </div>
        </div>
      </div>
    </div>
  );
}
