import { getParticipationAnalytics } from "@/app/actions/employee-relations";
import { Heart } from "lucide-react";

export default async function EngagementDashboardPage() {
  const a = await getParticipationAnalytics();
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Heart size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Employee Engagement Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Tingkat partisipasi dan keterlibatan karyawan lintas program.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-2xl font-extrabold text-slate-800">{a.total}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Total Partisipasi</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-2xl font-extrabold text-slate-800">{a.avgSatisfaction}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Rata-rata Kepuasan</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-2xl font-extrabold text-slate-800">{a.avgEnps}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">eNPS</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-slate-800 mb-4">Partisipasi per Jenis</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(a.totalByType).map(([type, count]) => (
            <div key={type} className="bg-slate-50 rounded-xl p-3">
              <p className="text-lg font-extrabold text-slate-800">{count}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
