import { getSeparationAnalytics } from "@/app/actions/employee-relations";
import { UserMinus } from "lucide-react";

export default async function SeparationAnalyticsPage() {
  const a = await getSeparationAnalytics();
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <UserMinus size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Separation Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Distribusi pemisahan hubungan kerja tahun berjalan berdasarkan jenis.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <p className="text-3xl font-extrabold text-slate-800 mb-4">{a.total} <span className="text-sm font-semibold text-slate-400">Total Separation Tahun Ini</span></p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(a.byType).map(([type, count]) => (
            <div key={type} className="bg-slate-50 rounded-xl p-4">
              <p className="text-xl font-extrabold text-slate-800">{count}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
