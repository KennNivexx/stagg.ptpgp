import Link from "next/link";
import { Pencil, Mail, Phone, ShieldCheck, UserCog } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";

function parseRole(address: unknown): string {
  if (!address || typeof address !== "string") return "employee";
  try {
    const parsed = JSON.parse(address);
    return parsed.__auth__?.role || "employee";
  } catch {
    return "employee";
  }
}

function getRoleBadge(role: string) {
  const base = "px-2.5 py-1 rounded-lg text-xs font-bold";
  if (role === "superadmin") return `${base} bg-amber-50 text-amber-700`;
  if (role === "hrd") return `${base} bg-emerald-50 text-emerald-700`;
  return `${base} bg-slate-100 text-slate-600`;
}

function getRoleLabel(role: string) {
  if (role === "superadmin") return "Superadmin";
  if (role === "hrd") return "HRD";
  return "Employee";
}

function getStatusBadge(status: string) {
  const base = "px-2.5 py-1 rounded-lg text-xs font-bold";
  if (status === "Tetap") return `${base} bg-emerald-50 text-emerald-700`;
  if (status === "Kontrak") return `${base} bg-amber-50 text-amber-700`;
  if (status === "Magang") return `${base} bg-purple-50 text-purple-700`;
  return `${base} bg-slate-100 text-slate-600`;
}

export default async function SuperadminEmployees() {
  const { data: employees, error } = await supabaseAdmin
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

  const employeeList = employees || [];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Manajemen User</h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola akun, role, dan password seluruh pengguna sistem.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1">
          <ShieldCheck size={12} />
          Superadmin: {employeeList.filter((e) => parseRole(e.address) === "superadmin").length}
        </div>
        <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
          <UserCog size={12} />
          HRD: {employeeList.filter((e) => parseRole(e.address) === "hrd").length}
        </div>
        <div className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
          Employee: {employeeList.filter((e) => parseRole(e.address) === "employee").length}
        </div>
      </div>

      {employeeList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="text-5xl mb-4 opacity-30">👥</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Belum ada data user</h3>
          <p className="text-sm text-slate-500">Tidak ada karyawan yang terdaftar dalam sistem.</p>
        </div>
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
                    Role
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Departemen
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employeeList.map((emp) => {
                  const role = parseRole(emp.address);
                  return (
                    <tr
                      key={emp.id as string}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
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
                        <span className={getRoleBadge(role)}>
                          {getRoleLabel(role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                          {emp.department as string || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(emp.status as string)}>
                          {emp.status as string || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/superadmin/employees/${emp.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          <Pencil size={12} /> Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Total:{" "}
              <span className="font-bold text-slate-800">{employeeList.length}</span>{" "}
              user
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
