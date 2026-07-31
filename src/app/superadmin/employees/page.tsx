import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { UserTable } from "./UserTable";
import { Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";

function getRoleBadge(role: string) {
  const base = "px-2 py-1 rounded text-[11px] font-bold";
  switch (role) {
    case "superadmin": return `${base} bg-red-100 text-red-700`;
    case "hrd": return `${base} bg-emerald-100 text-emerald-700`;
    case "director": return `${base} bg-purple-100 text-purple-700`;
    case "department_manager": return `${base} bg-indigo-100 text-indigo-700`;
    case "employee": return `${base} bg-slate-100 text-slate-600`;
    case "applicant": return `${base} bg-amber-100 text-amber-700`;
    default: return `${base} bg-slate-100 text-slate-600`;
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "superadmin": return "Superadmin";
    case "hrd": return "HRD";
    case "director": return "Direktur";
    case "department_manager": return "Dept. Manager";
    case "employee": return "Karyawan";
    case "applicant": return "Pelamar";
    default: return role;
  }
}

export default async function SuperadminEmployees() {
  await requireRole("superadmin");
  const { data: users, error } = await supabaseAdmin
    .from("pengguna")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-sm font-semibold">
          Gagal memuat data user: {error.message}
        </div>
      </div>
    );
  }

  // `users` (auth/login accounts) and `employees` (HR records) are separate
  // tables with unrelated primary keys, matched only by email. Resolve each
  // user's corresponding employees.id (if any) here so the table can link to
  // the "Edit User" detail page, which looks records up by employees.id.
  const { data: employeesForLookup } = await supabaseAdmin
    .from("karyawan")
    .select("id, email");
  const employeeIdByEmail = new Map<string, string>();
  for (const e of employeesForLookup || []) {
    const email = (e.email as string)?.toLowerCase();
    if (email) employeeIdByEmail.set(email, e.id as string);
  }

  const userList = ((users || []) as Record<string, unknown>[]).map((u) => ({
    ...u,
    employeeId: employeeIdByEmail.get(((u.email as string) || "").toLowerCase()) || null,
  })) as Record<string, unknown>[];

  const roleCounts: Record<string, number> = {};
  for (const u of userList) {
    const r = (u.role as string) || "employee";
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A2530]">Manajemen User</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola seluruh akun login sistem — termasuk akun sementara pelamar.
        </p>
      </div>

      {/* Role summary */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {Object.entries(roleCounts).map(([role, count]) => (
          <span key={role} className={getRoleBadge(role)}>
            {getRoleLabel(role)}: {count}
          </span>
        ))}
      </div>

      {userList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada data user"
          description="Belum ada akun yang terdaftar."
        />
      ) : (
        <UserTable users={userList} />
      )}
    </div>
  );
}
