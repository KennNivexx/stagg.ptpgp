import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Calendar, Coffee, Heart, Star } from "lucide-react";
import LeaveRequestButton from "@/components/LeaveRequestButton";
import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";

export default async function EmployeeLeaves() {
  let userEmail: string;
  try {
    const auth = await requireAuth();
    userEmail = auth.email;
  } catch {
    redirect("/login");
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const employeeId = employee?.id;

  const { data: leaves } = employeeId ? await supabaseAdmin
    .from("leave_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50) : { data: [] };

  const annualLeaves = leaves?.filter((l: Record<string, unknown>) => l.type === "Cuti Tahunan") || [];
  const sickLeaves = leaves?.filter((l: Record<string, unknown>) => l.type === "Cuti Sakit") || [];
  const specialLeaves = leaves?.filter((l: Record<string, unknown>) => l.type === "Cuti Khusus") || [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved": return "bg-emerald-50 text-emerald-700";
      case "Rejected": return "bg-red-50 text-red-700";
      default: return "bg-amber-50 text-amber-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Approved": return "Disetujui";
      case "Rejected": return "Ditolak";
      default: return "Pending";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Cuti & Izin</h1>
          <p className="text-sm text-gray-500">Riwayat pengajuan cuti dan izin Anda.</p>
        </div>
        <LeaveRequestButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl w-fit mb-3">
                <Coffee size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cuti Tahunan</p>
              <div className="mt-1">
                <p className="text-2xl font-extrabold text-slate-800">12 Hari</p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Terpakai: <span className="font-semibold text-slate-600">{annualLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length} hari</span>
                </p>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-blue-100 flex items-center justify-center">
              <span className="text-xs font-extrabold text-blue-600">{12 - annualLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length}</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(((annualLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length) / 12) * 100, 100)}%` }}></div>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">Sisa: {12 - annualLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length} hari</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit mb-3">
                <Heart size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cuti Sakit</p>
              <div className="mt-1">
                <p className="text-2xl font-extrabold text-slate-800">Tidak Terbatas</p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Digunakan: <span className="font-semibold text-slate-600">{sickLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length} kali</span>
                </p>
              </div>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Heart size={20} />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-4">*Dengan surat keterangan dokter</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit mb-3">
                <Star size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cuti Khusus</p>
              <div className="mt-1">
                <p className="text-2xl font-extrabold text-slate-800">3 Hari</p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Terpakai: <span className="font-semibold text-slate-600">{specialLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length} hari</span>
                </p>
              </div>
            </div>
            <div className="w-14 h-14 rounded-full border-4 border-amber-100 flex items-center justify-center">
              <span className="text-xs font-extrabold text-amber-600">{3 - specialLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length}</span>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(((specialLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length) / 3) * 100, 100)}%` }}></div>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">Sisa: {3 - specialLeaves.filter((l: Record<string, unknown>) => l.status === "Approved").length} hari</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Pengajuan" value={leaves?.length || 0} icon={FileText} color="bg-blue-50 text-blue-600" />
        <StatCard label="Disetujui" value={leaves?.filter((l: Record<string, unknown>) => l.status === "Approved").length || 0} icon={Calendar} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Pending" value={leaves?.filter((l: Record<string, unknown>) => l.status === "Pending").length || 0} icon={FileText} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Cuti & Izin</h3>
          <p className="text-xs text-slate-400 mt-0.5">Semua pengajuan cuti dan izin Anda</p>
        </div>

        {!leaves || leaves.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada pengajuan cuti.</p>
            <p className="text-xs text-slate-400 mt-1">Klik tombol &quot;Ajukan Cuti&quot; untuk membuat pengajuan baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Mulai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Selesai</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Alasan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(leaves || []).map((leave: Record<string, unknown>) => (
                  <tr key={leave.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">{leave.type as string}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{formatDate(leave.start_date as string)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{formatDate(leave.end_date as string)}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{leave.reason as string || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusBadge(leave.status as string)}`}>
                        {getStatusLabel(leave.status as string)}
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
