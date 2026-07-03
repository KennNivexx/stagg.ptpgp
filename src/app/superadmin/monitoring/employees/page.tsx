import Link from "next/link";
import { ArrowLeft, Users, Mail, Search } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import EmptyState from "@/components/EmptyState";

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

export default async function MonitoringEmployees({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

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

  let employees = (allEmployees || []).filter(
    (e) => (e.email as string) !== "__settings__@ptpgp.co.id"
  );

  if (q) {
    const query = q.toLowerCase();
    employees = employees.filter(
      (e) =>
        ((e.full_name as string) || "").toLowerCase().includes(query) ||
        ((e.email as string) || "").toLowerCase().includes(query) ||
        ((e.department as string) || "").toLowerCase().includes(query) ||
        ((e.position as string) || "").toLowerCase().includes(query)
    );
  }

  const total = employees.length;
  const active = employees.filter(
    (e) => e.status === "Tetap" || e.status === "Kontrak"
  ).length;

  const deptCount: Record<string, number> = {};
  for (const emp of employees) {
    const dept = (emp.department as string) || "Lainnya";
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  }

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
            <h1 className="text-2xl font-bold text-[#1A2530]">
              Data Karyawan
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Lihat seluruh data karyawan (read-only).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Karyawan
          </p>
          <p className="text-3xl font-extrabold text-slate-800 mt-1">{total}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Karyawan Aktif
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">
            {active}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Departemen
          </p>
          <p className="text-3xl font-extrabold text-blue-600 mt-1">
            {Object.keys(deptCount).length}
          </p>
        </div>
      </div>

      {/* Department breakdown */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(deptCount)
          .sort(([, a], [, b]) => b - a)
          .map(([dept, count]) => (
            <span
              key={dept}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold"
            >
              {dept}: {count}
            </span>
          ))}
      </div>

      {/* Search */}
      <form className="mb-6">
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Cari nama, email, departemen..."
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
          />
        </div>
      </form>

      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "Tidak ada hasil" : "Belum ada data karyawan"}
          description={
            q
              ? `Tidak ditemukan karyawan dengan kata kunci "${q}".`
              : "Tidak ada karyawan yang terdaftar dalam sistem."
          }
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
                    Role
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
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Tanggal Masuk
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp) => {
                  const role = parseRole(emp.address);
                  return (
                    <tr
                      key={emp.id as string}
                      className="hover:bg-slate-50/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
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
                        <span className={getRoleBadge(role)}>
                          {getRoleLabel(role)}
                        </span>
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
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">
                          {(emp.join_date as string) || "-"}
                        </span>
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
              <span className="font-bold text-slate-800">{total}</span> karyawan
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
