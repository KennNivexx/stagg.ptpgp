import { getCases } from "@/app/actions/employee-relations";
import { AlertTriangle } from "lucide-react";

export default async function ComplaintAnalyticsPage() {
  const rows = await getCases();
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  (rows as { case_type: string; status: string }[]).forEach((r) => {
    byType[r.case_type] = (byType[r.case_type] || 0) + 1;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Complaint Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Distribusi seluruh kasus berdasarkan jenis dan status penanganan.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4">Berdasarkan Jenis Kasus</h3>
          <div className="space-y-2">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{type}</span>
                <span className="font-extrabold text-slate-800">{count}</span>
              </div>
            ))}
            {Object.keys(byType).length === 0 && <p className="text-xs text-slate-400">Belum ada kasus tercatat.</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-extrabold text-slate-800 mb-4">Berdasarkan Status</h3>
          <div className="space-y-2">
            {Object.entries(byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{status}</span>
                <span className="font-extrabold text-slate-800">{count}</span>
              </div>
            ))}
            {Object.keys(byStatus).length === 0 && <p className="text-xs text-slate-400">Belum ada kasus tercatat.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
