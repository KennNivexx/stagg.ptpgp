import {
  Users,
  UserCog,
  UserCheck,
  Shield,
  TrendingUp,
} from "lucide-react";
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

export default async function SuperadminDashboard() {
  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { data: employees, error } = await supabaseAdmin
    .from("employees")
    .select("id, address");

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
  const totalUsers = employeeList.length;

  let totalHRD = 0;
  let totalEmployees = 0;
  let totalSuperadmins = 0;

  for (const emp of employeeList) {
    const role = parseRole(emp.address);
    if (role === "superadmin") totalSuperadmins++;
    else if (role === "hrd") totalHRD++;
    else totalEmployees++;
  }

  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "blue",
      sub: "Semua akun terdaftar",
    },
    {
      label: "Total Superadmin",
      value: totalSuperadmins,
      icon: Shield,
      color: "amber",
      sub: "Akses penuh sistem",
    },
    {
      label: "Total HRD",
      value: totalHRD,
      icon: UserCog,
      color: "emerald",
      sub: "Manajemen HR",
    },
    {
      label: "Total Karyawan",
      value: totalEmployees,
      icon: UserCheck,
      color: "indigo",
      sub: "Akun employee",
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; iconBg: string; accent: string }> = {
    blue: { bg: "bg-blue-500/5", text: "text-blue-600", iconBg: "bg-blue-50", accent: "text-blue-600" },
    amber: { bg: "bg-amber-500/5", text: "text-amber-600", iconBg: "bg-amber-50", accent: "text-amber-600" },
    emerald: { bg: "bg-emerald-500/5", text: "text-emerald-600", iconBg: "bg-emerald-50", accent: "text-emerald-600" },
    indigo: { bg: "bg-indigo-500/5", text: "text-indigo-600", iconBg: "bg-indigo-50", accent: "text-indigo-600" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Superadmin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hari ini:{" "}
            <span className="font-semibold text-slate-700">{currentDate}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
          <Shield size={14} className="text-amber-600" />
          <span className="text-xs font-bold text-amber-700">Superadmin Mode</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const c = colorMap[stat.color];
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
            >
              <div
                className={`absolute top-0 right-0 w-24 h-24 ${c.bg} rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110 duration-300`}
              />
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    {stat.label}
                  </p>
                  <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                    {stat.value}
                  </h3>
                  <div className={`flex items-center gap-1 mt-2 ${c.accent} text-xs font-semibold`}>
                    <TrendingUp size={14} />
                    <span>{stat.sub}</span>
                  </div>
                </div>
                <div className={`p-3 ${c.iconBg} ${c.text} rounded-xl`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
