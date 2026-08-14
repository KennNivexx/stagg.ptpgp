import { requireRole } from "@/lib/auth-guard";
import { getFinancialSummary } from "@/app/actions/pengiriman";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import TrendArea from "@/components/charts/TrendArea";
import RankedBar from "@/components/charts/RankedBar";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const rupiah = (v: number) => `Rp ${Math.round(v).toLocaleString("id-ID")}`;

export default async function LabaRugiPage() {
  await requireRole("hrd", "superadmin");

  const now = new Date();
  // Trailing 6 months including the current one, oldest first — same window
  // shape as the other trend charts in this app.
  const periods = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });
  const summaries = await Promise.all(periods.map((p) => getFinancialSummary(p.month, p.year)));
  const current = summaries[summaries.length - 1];

  const trendData = summaries.map((s, i) => ({
    bulan: `${MONTH_LABELS[periods[i].month - 1]} ${String(periods[i].year).slice(2)}`,
    omset: Math.round(s.omset),
    biaya: Math.round(s.biaya.total),
  }));
  const labaRugiRanked = summaries.map((s, i) => ({
    label: `${MONTH_LABELS[periods[i].month - 1]} ${String(periods[i].year).slice(2)}`,
    value: Math.round(s.laba_rugi),
  }));

  const isProfit = current.laba_rugi >= 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Laba/Rugi</h1>
        <p className="text-sm text-gray-500">Omset dari Pengiriman & Omset dikurangi biaya operasional (payroll, insentif supir, perjalanan dinas) — periode {current.periode}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-3"><Wallet size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Omset</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{rupiah(current.omset)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit mb-3"><Receipt size={20} /></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Biaya</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{rupiah(current.biaya.total)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className={`p-2.5 rounded-xl w-fit mb-3 ${isProfit ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
            {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{isProfit ? "Laba" : "Rugi"} Bulan Ini</p>
          <p className={`text-2xl font-extrabold mt-1 ${isProfit ? "text-emerald-600" : "text-red-600"}`}>{rupiah(Math.abs(current.laba_rugi))}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Tren Omset vs Biaya (6 Bulan Terakhir)</h3>
        </div>
        <div className="p-6">
          <TrendArea data={trendData} xKey="bulan" series={[{ key: "omset", label: "Omset" }, { key: "biaya", label: "Biaya" }]} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Laba/Rugi per Bulan</h3>
          </div>
          <div className="p-6">
            {labaRugiRanked.every((r) => r.value === 0) ? (
              <EmptyState icon={TrendingUp} title="Belum ada data omset/biaya pada periode ini." />
            ) : (
              <RankedBar data={labaRugiRanked} variant="diverging" valueSuffix="" barLabel="Laba/Rugi" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Rincian Biaya Bulan Ini</h3>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="text-slate-500">Payroll (Gaji Kotor)</span>
              <span className="font-bold text-slate-800">{rupiah(current.biaya.gaji)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="text-slate-500">Insentif Supir</span>
              <span className="font-bold text-slate-800">{rupiah(current.biaya.insentif_supir)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <span className="text-slate-500">Perjalanan Dinas</span>
              <span className="font-bold text-slate-800">{rupiah(current.biaya.perjalanan_dinas)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-800 font-bold">Total Biaya</span>
              <span className="font-extrabold text-slate-900">{rupiah(current.biaya.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
