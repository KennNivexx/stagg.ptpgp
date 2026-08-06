import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { FileText, DollarSign, TrendingUp, Building2, Wallet, Receipt, Gift, Clock3, CheckCircle2, HourglassIcon } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import ExportExcelButton from "@/components/ExportExcelButton";
import TrendArea from "@/components/charts/TrendArea";
import RankedBar from "@/components/charts/RankedBar";

export const dynamic = "force-dynamic";

const MONTH_NAMES = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTH_SHORT = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

export default async function LaporanPayroll() {
  await requireRole("hrd", "superadmin", "director");
  // "Riwayat Payroll" table only ever shows the latest 50 — fine to cap.
  const { data: payrolls } = await supabaseAdmin
    .from("penggajian")
    .select("*, karyawan!inner(full_name, department)")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(50);

  const { count: totalPayrollRecords } = await supabaseAdmin
    .from("penggajian")
    .select("*", { count: "exact", head: true });

  // Summary stats (totals, breakdown per departemen, tren bulanan) must
  // reflect EVERY payroll record, not just the 50 shown in the table — this
  // was previously computed from the same capped `payrolls` array, which
  // silently undercounted as soon as history passed 50 rows (already true
  // in this DB: 52+ rows exist). Fetched separately with only the columns
  // aggregation needs, not `select("*")`, to keep it light even as history grows.
  const { data: allPayrollsForStats } = await supabaseAdmin
    .from("penggajian")
    .select("status, month, year, net_salary, allowances, deductions, tax, bpjs_health, bpjs_employment, bonus, overtime_pay, karyawan!inner(department)");
  type StatsRow = {
    status: string; month: number; year: number; net_salary: number; allowances: number; deductions: number;
    tax: number; bpjs_health: number; bpjs_employment: number; bonus: number; overtime_pay: number;
    karyawan: { department: string | null } | { department: string | null }[] | null;
  };
  const statsRows = (allPayrollsForStats || []) as unknown as StatsRow[];

  // THR isn't a penggajian column — it's tracked as an `insentif` row.
  // generateThr() (admin.ts) inserts with type='THR', but the older manual
  // bonus form (BonusesClient.tsx) has "THR" as a `program` label choice
  // while always hardcoding type='bonus' — so a THR entered by hand through
  // the old form is invisible to a type='THR'-only query. Matched on both so
  // this stat reflects THR paid either way.
  const { data: thrRows } = await supabaseAdmin.from("insentif").select("amount")
    .or("type.eq.THR,program.eq.THR").in("status", ["Disetujui", "Dibayarkan"]);
  const totalThr = (thrRows || []).reduce((s, r) => s + (Number((r as { amount: number }).amount) || 0), 0);

  const totalCost = statsRows.reduce((sum, p) => sum + (Number(p.net_salary) || 0), 0);
  const avgSalary = statsRows.length > 0 ? Math.round(totalCost / statsRows.length) : 0;
  const totalAllowances = statsRows.reduce((s, p) => s + (Number(p.allowances) || 0), 0);
  const totalBonus = statsRows.reduce((s, p) => s + (Number(p.bonus) || 0), 0);
  const totalOvertime = statsRows.reduce((s, p) => s + (Number(p.overtime_pay) || 0), 0);
  const totalTax = statsRows.reduce((s, p) => s + (Number(p.tax) || 0), 0);
  // "Total Potongan" = every deduction type combined (pajak, BPJS, dan
  // potongan lain seperti kasbon/amal jariyah) — Total Pajak below is the
  // same tax figure called out on its own since it's reported separately
  // for keperluan pajak, not a different pool of money.
  const totalDeductionsAll = statsRows.reduce((s, p) =>
    s + (Number(p.deductions) || 0) + (Number(p.tax) || 0) + (Number(p.bpjs_health) || 0) + (Number(p.bpjs_employment) || 0), 0);

  const pendingApprovalCount = statsRows.filter((p) => ["Verified_SDM", "Verified_Keuangan"].includes(p.status)).length;
  const paidCount = statsRows.filter((p) => p.status === "Paid").length;

  const deptCosts: Record<string, number> = {};
  const deptCounts: Record<string, number> = {};
  statsRows.forEach((p) => {
    const karyawan = Array.isArray(p.karyawan) ? p.karyawan[0] : p.karyawan;
    const dept = karyawan?.department || "Tidak Diketahui";
    deptCosts[dept] = (deptCosts[dept] || 0) + (Number(p.net_salary) || 0);
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  // Monthly cost trend — last 12 distinct (year, month) periods that
  // actually have data, oldest to newest for the chart's x-axis.
  const monthlyTotals = new Map<string, number>();
  statsRows.forEach((p) => {
    const key = `${p.year}-${String(p.month).padStart(2, "0")}`;
    monthlyTotals.set(key, (monthlyTotals.get(key) || 0) + (Number(p.net_salary) || 0));
  });
  const trendData = Array.from(monthlyTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, total]) => {
      const [, m] = key.split("-");
      return { periode: MONTH_SHORT[Number(m)] || m, total };
    });

  const deptChartData = Object.entries(deptCosts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([label, value]) => ({ label, value }));

  const rows = (payrolls || []).map((p: Record<string, unknown>) => {
    const emp = p.karyawan as Record<string, string> | undefined;
    return {
      Karyawan: emp?.full_name || "-",
      Departemen: emp?.department || "-",
      Periode: `${MONTH_NAMES[Number(p.month) || 0] || "-"} ${String(p.year || "")}`,
      "Gaji Pokok": Number(p.basic_salary) || 0,
      Tunjangan: Number(p.allowances) || 0,
      Potongan: Number(p.deductions) || 0,
      "Total Bersih": Number(p.net_salary) || 0,
    };
  });

  const fmtJt = (n: number) => `Rp ${(n / 1_000_000).toFixed(1)} Jt`;

  const statCards = [
    { label: "Total Karyawan Digaji", value: totalPayrollRecords || 0, icon: FileText, color: "bg-blue-50 text-blue-600", isCurrency: false },
    { label: "Total Payroll", value: totalCost, icon: DollarSign, color: "bg-emerald-50 text-emerald-600", isCurrency: true },
    { label: "Total Tunjangan", value: totalAllowances, icon: Wallet, color: "bg-teal-50 text-teal-600", isCurrency: true },
    { label: "Total Potongan", value: totalDeductionsAll, icon: Receipt, color: "bg-red-50 text-red-600", isCurrency: true },
    { label: "Total Bonus", value: totalBonus, icon: Gift, color: "bg-violet-50 text-violet-600", isCurrency: true },
    { label: "Total Lembur", value: totalOvertime, icon: Clock3, color: "bg-amber-50 text-amber-600", isCurrency: true },
    { label: "Total THR", value: totalThr, icon: Gift, color: "bg-pink-50 text-pink-600", isCurrency: true },
    { label: "Total Pajak (PPh21)", value: totalTax, icon: Building2, color: "bg-slate-100 text-slate-600", isCurrency: true },
    { label: "Menunggu Approval", value: pendingApprovalCount, icon: HourglassIcon, color: "bg-sky-50 text-sky-600", isCurrency: false },
    { label: "Sudah Dibayar", value: paidCount, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600", isCurrency: false },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Dashboard Payroll</h1>
          <p className="text-sm text-gray-500">Ringkasan penggajian, tren bulanan, dan distribusi biaya per departemen.</p>
        </div>
        <ExportExcelButton filename="Laporan_Payroll" sheetName="Payroll" rows={rows} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${s.color}`}><s.icon size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-800 truncate">{s.isCurrency ? fmtJt(s.value) : s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-1">Tren Biaya Payroll per Bulan</h3>
          <p className="text-xs text-slate-400 mb-4">Total gaji bersih yang dibayarkan, 12 periode terakhir.</p>
          {trendData.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Belum ada data untuk grafik tren." />
          ) : (
            <TrendArea data={trendData} xKey="periode" series={[{ key: "total", label: "Total Payroll" }]} valueFormatter={(v) => `Rp ${(v / 1_000_000).toFixed(0)}Jt`} />
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-1">Distribusi Biaya per Departemen</h3>
          <p className="text-xs text-slate-400 mb-4">Total gaji bersih, 10 departemen teratas.</p>
          {deptChartData.length === 0 ? (
            <EmptyState icon={Building2} title="Belum ada data departemen." />
          ) : (
            <RankedBar data={deptChartData} valueFormatter={(v) => `Rp ${(v / 1_000_000).toFixed(0)}Jt`} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Payroll</h3>
              <p className="text-xs text-slate-400 mt-0.5">Data penggajian terbaru</p>
            </div>
          </div>

          {!payrolls || payrolls.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="Belum ada data payroll."
              description="Generate slip gaji untuk melihat laporan payroll."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Karyawan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Periode</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Gaji Pokok</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tunjangan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Potongan</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(payrolls || []).map((p: Record<string, unknown>) => {
                    const emp = p.karyawan as Record<string, string> | undefined;
                    return (
                      <tr key={p.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-800">{emp?.full_name || "-"}</p>
                          <p className="text-[10px] text-slate-400">{emp?.department || "-"}</p>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                          {MONTH_NAMES[Number(p.month) || 0] || "-"} {String(p.year || "")}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-700">
                          Rp {(Number(p.basic_salary) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs text-emerald-600">
                          Rp {(Number(p.allowances) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs text-red-600">
                          Rp {(Number(p.deductions) || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-800">
                          Rp {(Number(p.net_salary) || 0).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Breakdown per Departemen</h3>
              <p className="text-xs text-slate-400 mt-0.5">Total biaya payroll tiap departemen</p>
            </div>
            <div className="p-6">
              {Object.keys(deptCosts).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(deptCosts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([dept, cost]) => (
                    <div key={dept}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-600">{dept}</span>
                        <span className="text-[10px] font-bold text-slate-800">
                          Rp {(cost / 1_000_000).toFixed(0)} Jt
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#CC0000] rounded-full"
                          style={{ width: `${((cost / (totalCost || 1)) * 100).toFixed(0)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada data.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Ringkasan</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statistik payroll</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Biaya</span>
                <span className="text-sm font-extrabold text-slate-800">
                  Rp {totalCost.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Rata-rata Gaji</span>
                <span className="text-sm font-extrabold text-emerald-600">
                  Rp {avgSalary.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Total Slip</span>
                <span className="text-sm font-extrabold text-blue-600">{totalPayrollRecords || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Departemen</span>
                <span className="text-sm font-extrabold text-purple-600">{Object.keys(deptCounts).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
