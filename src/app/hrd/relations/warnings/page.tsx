import { supabaseAdmin } from "@/lib/supabase";
import { AlertTriangle, FileText, Clock, CheckCircle2 } from "lucide-react";
import IssueWarningButton from "@/components/IssueWarningButton";
import EmptyState from "@/components/EmptyState";

export default async function SuratPeringatan() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, email, department, position")
    .neq("status", "Resigned")
    .order("full_name");

  let warnings: Record<string, unknown>[] = [];
  const { data: allWarnings, error: warnError } = await supabaseAdmin
    .from("warnings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (warnError && !warnError.message.includes("Could not find the table")) {
    warnings = [];
  } else {
    warnings = allWarnings || [];
  }

  const sp1Active = warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP1" && w.status === "Aktif").length;
  const sp2Active = warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP2" && w.status === "Aktif").length;
  const sp3Active = warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP3" && w.status === "Aktif").length;

  const warningLevels = ["SP1", "SP2", "SP3"];
  const warningColors: Record<string, string> = {
    SP1: "bg-amber-50 text-amber-700",
    SP2: "bg-orange-50 text-orange-700",
    SP3: "bg-red-50 text-red-700",
  };

  const getStatusBadge = (status: string) => {
    if (status === "Aktif") return "bg-red-50 text-red-700";
    if (status === "Kadaluarsa") return "bg-slate-50 text-slate-500";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Surat Peringatan</h1>
          <p className="text-sm text-gray-500">Kelola surat peringatan dan riwayat pelanggaran karyawan.</p>
        </div>
        <IssueWarningButton employees={(employees || []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          full_name: e.full_name as string,
          email: e.email as string,
          department: e.department as string,
          position: e.position as string,
        }))} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP1 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{sp1Active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP2 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{sp2Active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP3 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{sp3Active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total SP</p>
              <p className="text-xl font-extrabold text-slate-800">{warnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Surat Peringatan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Riwayat surat peringatan seluruh karyawan</p>
        </div>

        {warnings.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Belum ada surat peringatan yang dikeluarkan."
            description='Klik tombol "Keluarkan SP" untuk membuat surat peringatan baru.'
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Level</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Alasan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dikeluarkan Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {warnings.map((w: Record<string, unknown>) => (
                  <tr key={w.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-800">{w.employee_name as string}</p>
                      <p className="text-[10px] text-slate-400">{w.employee_email as string}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${warningColors[w.sp_level as string] || "bg-slate-100 text-slate-600"}`}>
                        {w.sp_level as string}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">{w.reason as string}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {w.created_at ? new Date(w.created_at as string).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusBadge(w.status as string)}`}>
                        {w.status as string}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{w.issued_by as string || "-"}</td>
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
