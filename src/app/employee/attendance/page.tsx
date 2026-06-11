import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { Calendar, Clock, CheckCircle2, AlertCircle, Coffee, Plus } from "lucide-react";

export default async function EmployeeAttendance() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "";

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const employeeId = employee?.id;

  const { data: attendances } = employeeId ? await supabaseAdmin
    .from("attendance")
    .select("*")
    .eq("employee_id", employeeId)
    .order("date", { ascending: false })
    .limit(30) : { data: [] };

  const { data: leaves } = employeeId ? await supabaseAdmin
    .from("leaves")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(10) : { data: [] };

  const pendingLeaves = leaves?.filter((l: Record<string, unknown>) => l.status === "Pending").length || 0;
  const totalLeaveDays = leaves?.filter((l: Record<string, unknown>) => l.status === "Approved")
    .reduce((sum: number, l: Record<string, unknown>) => {
      if (l.start_date && l.end_date) {
        return sum + Math.ceil((new Date(l.end_date as string).getTime() - new Date(l.start_date as string).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      return sum;
    }, 0) || 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Kehadiran & Cuti</h1>
        <p className="text-sm text-gray-500">Monitor riwayat kehadiran dan ajukan cuti Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Hadir Bulan Ini</p>
              <p className="text-xl font-extrabold text-slate-800">{attendances?.filter((a: Record<string, unknown>) => a.status === "Present").length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Terlambat</p>
              <p className="text-xl font-extrabold text-slate-800">{attendances?.filter((a: Record<string, unknown>) => a.status !== "Present" && a.status !== "Absent").length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Coffee size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cuti Terpakai</p>
              <p className="text-xl font-extrabold text-slate-800">{totalLeaveDays} Hari</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pengajuan Pending</p>
              <p className="text-xl font-extrabold text-slate-800">{pendingLeaves}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Kehadiran</h3>
            <p className="text-xs text-slate-400 mt-0.5">30 hari terakhir</p>
          </div>

          {!attendances || attendances.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data kehadiran.</p>
              <p className="text-xs text-slate-400 mt-1">Riwayat akan muncul setelah Anda melakukan check-in.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-in</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-out</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {attendances.map((att: Record<string, unknown>) => {
                    const isPresent = att.status === "Present";
                    const isLate = att.check_in && (att.check_in as string) > "08:00:00";
                    return (
                      <tr key={att.id as string} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-medium text-slate-700">
                          {new Date(att.date as string).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">{att.check_in as string || "-"}</td>
                        <td className="px-6 py-4 text-xs text-slate-600">{att.check_out as string || "-"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                            isLate ? "bg-amber-50 text-amber-700" :
                            isPresent ? "bg-emerald-50 text-emerald-700" :
                            "bg-red-50 text-red-700"
                          }`}>
                            {isPresent ? (att.check_in as string) <= "08:00:00" ? "Tepat Waktu" : "Terlambat" : att.status as string}
                        </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Cuti</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pengajuan cuti Anda</p>
            </div>
            <button className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-slate-600" title="Ajukan Cuti">
              <Plus size={14} />
            </button>
          </div>

          {!leaves || leaves.length === 0 ? (
            <div className="p-12 text-center">
              <Coffee size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada riwayat cuti.</p>
              <p className="text-xs text-slate-400 mt-1">Ajukan cuti melalui tombol di atas.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {leaves.map((leave: Record<string, unknown>) => (
                <div key={leave.id as string} className="px-6 py-4 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">{leave.type as string}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      leave.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                      leave.status === "Rejected" ? "bg-red-50 text-red-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {leave.status === "Pending" ? "Pending" : leave.status === "Approved" ? "Disetujui" : "Ditolak"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{leave.reason as string}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {leave.start_date as string} s/d {leave.end_date as string}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
