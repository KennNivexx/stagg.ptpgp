import Link from "next/link";
import { ArrowLeft, UserCog, Mail } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import EmptyState from "@/components/EmptyState";

function parseAuth(address: unknown): Record<string, unknown> {
  if (!address || typeof address !== "string") return {};
  try {
    const parsed = JSON.parse(address);
    return parsed.__auth__ || {};
  } catch {
    return {};
  }
}

function getStatusBadge(status: string) {
  const base = "px-2.5 py-1 rounded-lg text-xs font-bold";
  if (status === "Tetap") return `${base} bg-emerald-50 text-emerald-700`;
  if (status === "Kontrak") return `${base} bg-amber-50 text-amber-700`;
  if (status === "Magang") return `${base} bg-purple-50 text-purple-700`;
  return `${base} bg-slate-100 text-slate-600`;
}

export default async function MonitoringHRD() {
  const { data: allEmployees, error } = await supabaseAdmin
    .from("employees")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-sm font-semibold">
          Gagal memuat data: {error.message}
        </div>
      </div>
    );
  }

  const hrdStaff = (allEmployees || []).filter((e) => {
    const email = (e.email as string) || "";
    if (email === "__settings__@ptpgp.co.id") return false;
    const auth = parseAuth(e.address);
    return auth.role === "hrd";
  });

  const activeHRD = hrdStaff.filter(
    (e) => e.status === "Tetap" || e.status === "Kontrak"
  ).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <Link
          href="/superadmin"
          className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A2530]">Data HRD</h1>
            <p className="text-sm text-gray-500 mt-1">
              Lihat aktivitas dan data HRD (read-only).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total HRD
          </p>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">
            {hrdStaff.length}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            HRD Aktif
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">
            {activeHRD}
          </p>
        </div>
      </div>

      {hrdStaff.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Belum ada staff HRD"
          description="Tidak ada karyawan dengan role HRD dalam sistem."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Departemen
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Jabatan
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {hrdStaff.map((emp) => (
                  <tr
                    key={emp.id as string}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {(emp.full_name as string)
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {emp.full_name as string}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Mail size={11} /> {emp.email as string}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                        {(emp.department as string) || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600">
                        {(emp.position as string) || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(emp.status as string)}>
                        {(emp.status as string) || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Total:{" "}
              <span className="font-bold text-slate-800">{hrdStaff.length}</span>{" "}
              staff HRD
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
