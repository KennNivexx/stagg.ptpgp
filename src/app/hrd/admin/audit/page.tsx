import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Search, Clock, User, Filter } from "lucide-react";

function getModuleFromAction(action: string): string {
  if (action.startsWith("employee.")) return "Karyawan";
  if (action.startsWith("job.") || action.startsWith("application.") || action.startsWith("applicant.")) return "Rekrutmen";
  if (action.startsWith("leave.")) return "Cuti";
  if (action.startsWith("org.")) return "Organisasi";
  if (action.startsWith("headcount.")) return "Headcount";
  if (action.startsWith("request.")) return "Permintaan";
  if (action.startsWith("attendance.")) return "Kehadiran";
  if (action.startsWith("settings.")) return "Pengaturan";
  if (action.startsWith("position.") || action.startsWith("jobdesc.") || action.startsWith("jobspec.")) return "Jabatan";
  return "Sistem";
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    "employee.create": "Karyawan dibuat",
    "employee.update": "Karyawan diubah",
    "employee.delete": "Karyawan dihapus",
    "employee.status_change": "Status karyawan diubah",
    "employee.password_reset": "Password direset",
    "job.create": "Lowongan dibuat",
    "job.status_change": "Status lowongan diubah",
    "application.update": "Lamaran diperbarui",
    "applicant.convert": "Pelamar dikonversi",
    "leave.submit": "Cuti diajukan",
    "leave.status_change": "Status cuti diubah",
    "org.add_unit": "Unit org ditambah",
    "org.update_unit": "Unit org diubah",
    "org.delete_unit": "Unit org dihapus",
    "org.move_unit": "Unit org dipindah",
    "settings.save": "Pengaturan disimpan",
    "position.add": "Jabatan ditambah",
    "position.update": "Jabatan diubah",
    "position.delete": "Jabatan dihapus",
    "headcount.update": "Headcount diubah",
    "headcount.sync": "Headcount disinkron",
    "request.add": "Permintaan SDM dibuat",
    "request.status_change": "Status permintaan diubah",
    "request.delete": "Permintaan SDM dihapus",
    "attendance.clock_in": "Clock-in",
    "attendance.clock_out": "Clock-out",
  };
  return labels[action] || action;
}

export default async function AuditLog() {
  const { data: logs } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const auditEntries = (logs || []).map((log: Record<string, unknown>) => ({
    id: log.id as string,
    timestamp: log.created_at as string,
    user: (log.performed_by_name as string) || (log.performed_by_email as string) || "System",
    role: log.performed_by_role as string,
    action: getActionLabel(log.action as string),
    module: getModuleFromAction(log.action as string),
    details: [log.target_name, log.detail].filter(Boolean).join(" — ") || (log.action as string),
  }));

  const uniqueModules = [...new Set(auditEntries.map((a) => a.module))];
  const uniqueUsers = [...new Set(auditEntries.map((a) => a.user))];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Audit Log</h1>
        <p className="text-sm text-gray-500">Catatan aktivitas dan perubahan data di seluruh modul sistem HRD.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Aktivitas</p>
              <p className="text-xl font-extrabold text-slate-800">{auditEntries.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><User size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Pengguna Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{uniqueUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Filter size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Modul Tercatat</p>
              <p className="text-xl font-extrabold text-slate-800">{uniqueModules.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Aktivitas Terbaru</p>
              <p className="text-xs font-extrabold text-slate-800 mt-0.5">
                {auditEntries[0]?.timestamp
                  ? new Date(auditEntries[0].timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                  : "-"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Aktivitas Sistem</h3>
            <p className="text-xs text-slate-400 mt-0.5">50 aktivitas terbaru dari seluruh modul</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none">
              <option value="">Semua Modul</option>
              {uniqueModules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none">
              <option value="">Semua User</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <input type="date" className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] outline-none" />
          </div>
        </div>

        {auditEntries.length === 0 ? (
          <div className="p-12 text-center">
            <Search size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada aktivitas tercatat.</p>
            <p className="text-xs text-slate-400 mt-1">Aktivitas akan muncul saat data dibuat atau diubah di sistem.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Timestamp</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">User</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Aksi</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Modul</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditEntries.map((entry, i) => (
                  <tr key={entry.id || `${entry.timestamp}-${i}`} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleDateString("id-ID", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                          {entry.user.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs text-slate-700 block">{entry.user}</span>
                          {entry.role && <span className="text-[9px] text-slate-400">{entry.role}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">{entry.action}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">{entry.module}</span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 max-w-[300px] truncate">{entry.details}</td>
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
