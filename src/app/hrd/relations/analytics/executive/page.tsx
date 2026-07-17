import { getRelationsExecutiveMetrics } from "@/app/actions/employee-relations";
import { LayoutDashboard, ShieldAlert, Heart, TrendingDown, CheckCircle2 } from "lucide-react";

export default async function ExecutiveDashboardPage() {
  const m = await getRelationsExecutiveMetrics();
  const cards = [
    { label: "Kasus Terbuka", value: m.openCases, icon: ShieldAlert },
    { label: "Kasus Selesai", value: m.closedCases, icon: CheckCircle2 },
    { label: "Kasus Terlambat SLA", value: m.overdueCases, icon: ShieldAlert },
    { label: "Tingkat Resolusi", value: `${m.resolutionRate}%`, icon: CheckCircle2 },
    { label: "Engagement Index", value: m.engagementIndex, icon: Heart },
    { label: "eNPS", value: m.enps, icon: Heart },
    { label: "Total Separation Tahun Ini", value: m.totalSeparations, icon: TrendingDown },
    { label: "Turnover Rate", value: `${m.turnoverPct}%`, icon: TrendingDown },
  ];
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <LayoutDashboard size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan strategis Employee Relations &amp; Experience untuk Direksi dan Manajemen.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="p-2 bg-red-50 text-pgp-red rounded-xl w-fit mb-3"><c.icon size={18} /></div>
            <p className="text-xl font-extrabold text-slate-800">{c.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
