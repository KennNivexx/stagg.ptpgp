import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Calendar, Plane } from "lucide-react";
import BusinessTripRequestButton from "@/components/BusinessTripRequestButton";
import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import EmptyState from "@/components/EmptyState";

export default async function EmployeeBusinessTripPage() {
  let userId: string;
  try {
    const auth = await requireAuth();
    userId = auth.id;
  } catch {
    redirect("/login");
  }

  // business_trips.employee_id stores the session's users.id (set at submit
  // time in submitBusinessTrip()), same convention as leave_requests.
  const { data: trips } = await supabaseAdmin
    .from("perjalanan_dinas")
    .select("*")
    .eq("employee_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Disetujui": return "bg-emerald-50 text-emerald-700";
      case "Ditolak": return "bg-red-50 text-red-700";
      default: return "bg-amber-50 text-amber-700";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Perjalanan Dinas</h1>
          <p className="text-sm text-gray-500">Ajukan dan pantau perjalanan dinas Anda. Selama masa dinas disetujui, Anda tetap bisa absen tanpa terkendala radius lokasi kerja.</p>
        </div>
        <BusinessTripRequestButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Pengajuan" value={trips?.length || 0} icon={FileText} color="bg-blue-50 text-blue-600" />
        <StatCard label="Disetujui" value={trips?.filter((t: Record<string, unknown>) => t.status === "Disetujui").length || 0} icon={Calendar} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending" value={trips?.filter((t: Record<string, unknown>) => t.status === "Pending").length || 0} icon={FileText} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Perjalanan Dinas</h3>
        </div>

        {!trips || trips.length === 0 ? (
          <EmptyState
            icon={Plane}
            title="Belum ada pengajuan dinas."
            description={'Klik tombol "Ajukan Dinas" untuk membuat pengajuan baru.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tujuan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mulai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keperluan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(trips || []).map((t: Record<string, unknown>) => (
                  <tr key={t.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">{t.destination as string}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{formatDate(t.start_date as string)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{formatDate(t.end_date as string)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{(t.reason as string) || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusBadge(t.status as string)}`}>
                        {t.status as string}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
