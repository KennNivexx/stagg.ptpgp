import { getCareerAnalytics } from "@/app/actions/career-development";
import { Trophy, Users, ShieldAlert, TrendingUp, Award, ArrowUpRight, RefreshCw } from "lucide-react";

export default async function CareerAnalyticsPage() {
  const a = await getCareerAnalytics();

  const cards = [
    { label: "Ready for Promotion", value: a.readyForPromotion, icon: Trophy },
    { label: "High Potential Employees", value: a.highPotential, icon: Users },
    { label: "Critical Positions", value: a.criticalPositions, icon: ShieldAlert },
    { label: "Succession Readiness", value: `${a.successionReadinessPct}%`, icon: TrendingUp },
    { label: "Average Career Score", value: a.avgCareerScore, icon: Award },
    { label: "Promotion This Year", value: a.promotionsThisYear, icon: ArrowUpRight },
    { label: "Internal Mobility (Mutasi)", value: a.mutationsThisYear, icon: RefreshCw },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Career Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Ringkasan eksekutif indikator pengembangan karier dan suksesi.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="p-2 bg-red-50 text-pgp-red rounded-xl w-fit mb-3">
              <c.icon size={18} />
            </div>
            <p className="text-xl font-extrabold text-slate-800 leading-tight">{c.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-snug mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
