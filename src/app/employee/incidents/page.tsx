import { supabaseAdmin } from "@/lib/supabase";
import { AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import IncidentReportButton from "@/components/IncidentReportButton";
import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLES: Record<string, string> = {
  Selesai: "bg-emerald-50 text-emerald-700",
  Ditindaklanjuti: "bg-blue-50 text-blue-700",
  Dilaporkan: "bg-amber-50 text-amber-700",
};

const SEVERITY_STYLES: Record<string, string> = {
  Berat: "bg-red-50 text-red-700",
  Sedang: "bg-amber-50 text-amber-700",
  Ringan: "bg-slate-100 text-slate-600",
};

export default async function EmployeeIncidentsPage() {
  let userId: string;
  try {
    const auth = await requireAuth();
    userId = auth.id;
  } catch {
    redirect("/login");
  }

  const { data: reports } = await supabaseAdmin
    .from("laporan_insiden")
    .select("*")
    .eq("employee_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Laporan Insiden</h1>
          <p className="text-sm text-gray-500">Laporkan kerusakan, kecelakaan, atau kejadian lain agar segera ditindaklanjuti atasan Anda.</p>
        </div>
        <IncidentReportButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Laporan" value={reports?.length || 0} icon={FileText} color="bg-blue-50 text-blue-600" />
        <StatCard label="Ditindaklanjuti" value={reports?.filter((r: Record<string, unknown>) => r.status === "Ditindaklanjuti").length || 0} icon={AlertTriangle} color="bg-blue-50 text-blue-600" />
        <StatCard label="Selesai" value={reports?.filter((r: Record<string, unknown>) => r.status === "Selesai").length || 0} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Laporan</h3>
        </div>

        {!reports || reports.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="Belum ada laporan insiden." description={'Klik tombol "Lapor Insiden" untuk membuat laporan baru.'} />
        ) : (
          <div className="divide-y divide-slate-50">
            {reports.map((r: Record<string, unknown>) => (
              <div key={r.id as string} className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-slate-800">{r.title as string}</p>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${SEVERITY_STYLES[r.severity as string] || "bg-slate-100 text-slate-600"}`}>{r.severity as string}</span>
                    </div>
                    {r.description ? <p className="text-xs text-slate-500 mb-1">{r.description as string}</p> : null}
                    {r.resolution_notes ? <p className="text-xs text-emerald-600 italic">Catatan: {r.resolution_notes as string}</p> : null}
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(r.created_at as string)}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLES[r.status as string] || "bg-slate-100 text-slate-500"}`}>{r.status as string}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ size?: number; className?: string }>; color: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}><Icon size={18} /></div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
          <p className="text-xl font-extrabold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
