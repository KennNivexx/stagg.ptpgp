import { supabaseAdmin } from "@/lib/supabase";
import { Users, Clock } from "lucide-react";
import UsersClient from "./UsersClient";

export default async function ManajemenUser() {
  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("*")
    .order("full_name");

  const roles = ["Superadmin", "HRD", "Manager", "Karyawan"];

  const activeCount = (employees || []).filter((e: Record<string, unknown>) => e.status !== "Resigned").length;
  const resignedCount = (employees || []).filter((e: Record<string, unknown>) => e.status === "Resigned").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Manajemen User</h1>
        <p className="text-sm text-gray-500">Kelola akun pengguna sistem dan hak akses.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Total User", value: (employees || []).length, color: "bg-blue-50 text-blue-600" },
          { icon: Users, label: "Aktif", value: activeCount, color: "bg-emerald-50 text-emerald-600" },
          { icon: Clock, label: "Nonaktif", value: resignedCount, color: "bg-red-50 text-red-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <UsersClient
        employees={(employees || []) as Array<Record<string, unknown>>}
        roles={roles}
      />
    </div>
  );
}
