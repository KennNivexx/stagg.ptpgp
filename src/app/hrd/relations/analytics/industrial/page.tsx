import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { Gavel } from "lucide-react";

export default async function IndustrialReportPage() {
  await requireRole("hrd", "superadmin");
  const [{ data: meetings }, { data: compliance }] = await Promise.all([
    supabaseAdmin.from("industrial_meetings").select("meeting_type, status"),
    supabaseAdmin.from("industrial_compliance_items").select("compliance_status"),
  ]);
  const byType: Record<string, number> = {};
  (meetings || []).forEach((m) => { byType[m.meeting_type] = (byType[m.meeting_type] || 0) + 1; });
  const compliant = (compliance || []).filter((c) => c.compliance_status === "Compliant").length;
  const total = (compliance || []).length;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 100;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Gavel size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Industrial Relations Report</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan aktivitas hubungan industrial dan tingkat kepatuhan.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-extrabold text-slate-800">{complianceRate}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Tingkat Kepatuhan</p>
        </div>
        {Object.entries(byType).map(([type, count]) => (
          <div key={type} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xl font-extrabold text-slate-800">{count}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
