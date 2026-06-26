import { supabaseAdmin } from "@/lib/supabase";
import { UserTable } from "./UserTable";

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
  const { data: users, error } = await supabaseAdmin
    .from("users")
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

  const userList = (users || []) as Record<string, unknown>[];

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
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="text-5xl mb-4 opacity-30">👥</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Belum ada data user</h3>
          <p className="text-sm text-slate-500">Belum ada akun yang terdaftar.</p>
        </div>
      ) : (
        <UserTable users={userList} />
      )}
    </div>
  );
}
