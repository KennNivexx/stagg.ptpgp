import { getCommunicationAnalytics } from "@/app/actions/employee-relations";
import { BarChart3, Send, Eye, TrendingUp } from "lucide-react";

export default async function CommunicationAnalyticsPage() {
  const a = await getCommunicationAnalytics();
  const cards = [
    { label: "Total Komunikasi Diterbitkan", value: a.totalComms, icon: Send },
    { label: "Total Konfirmasi Baca", value: a.totalReads, icon: Eye },
    { label: "Rata-rata Read Rate", value: `${a.avgReadRate}%`, icon: TrendingUp },
  ];
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <BarChart3 size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Communication Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Efektivitas komunikasi internal perusahaan.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="p-2 bg-red-50 text-pgp-red rounded-xl w-fit mb-3"><c.icon size={18} /></div>
            <p className="text-xl font-extrabold text-slate-800">{c.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-extrabold text-slate-800">Komunikasi Terbaru</h3></div>
        <ul className="divide-y divide-slate-50">
          {a.recentComms.length === 0 ? (
            <li className="p-6 text-sm text-slate-400 text-center">Belum ada komunikasi.</li>
          ) : a.recentComms.map((c) => (
            <li key={c.id as string} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">{c.title as string}</p>
                <p className="text-[10px] text-slate-400">{c.comm_type as string}</p>
              </div>
              <p className="text-[10px] text-slate-400">{new Date(c.published_at as string).toLocaleDateString("id-ID")}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
