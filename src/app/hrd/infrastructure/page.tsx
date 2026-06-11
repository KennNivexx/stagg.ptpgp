import { Database, Wifi, Shield, Monitor, Cpu, HardDrive } from "lucide-react";

export default async function HRDInfrastructure() {
  const systems = [
    {
      icon: <Database size={20} />,
      title: "Database HRIS",
      description: "PostgreSQL via Supabase",
      status: "Online",
      statusColor: "emerald",
      uptime: "99.9%",
    },
    {
      icon: <Wifi size={20} />,
      title: "API Gateway",
      description: "Next.js Server Actions + Supabase API",
      status: "Online",
      statusColor: "emerald",
      uptime: "99.7%",
    },
    {
      icon: <Monitor size={20} />,
      title: "Attendance System",
      description: "Modul Absensi & Cuti",
      status: "Online",
      statusColor: "emerald",
      uptime: "99.5%",
    },
    {
      icon: <Cpu size={20} />,
      title: "Payroll System",
      description: "Modul Penggajian & Slip Gaji",
      status: "Online",
      statusColor: "emerald",
      uptime: "99.8%",
    },
    {
      icon: <HardDrive size={20} />,
      title: "Storage & Backup",
      description: "Supabase Storage + CDN",
      status: "Online",
      statusColor: "emerald",
      uptime: "99.9%",
    },
    {
      icon: <Shield size={20} />,
      title: "Security Layer",
      description: "Row Level Security + JWT Auth",
      status: "Online",
      statusColor: "emerald",
      uptime: "100%",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Human Resource Infrastructure</h1>
        <p className="text-sm text-gray-500">Infrastruktur dan sistem pendukung manajemen SDM</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {systems.map((sys) => {
          const statusStyles: Record<string, { dot: string; badge: string }> = {
            emerald: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700" },
            amber: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
            red: { dot: "bg-red-500", badge: "bg-red-50 text-red-700" },
          };
          const s = statusStyles[sys.statusColor] || statusStyles.emerald;
          return (
            <div key={sys.title} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                  {sys.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${s.dot} animate-pulse`} />
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.badge}`}>
                    {sys.status}
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">{sys.title}</h3>
              <p className="text-xs text-slate-500 mb-3">{sys.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-medium">{sys.uptime} uptime</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
