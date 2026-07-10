import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import {
  Users,
  Shield,
  CheckCircle2,
  FileText,
  Bell,
  Settings,
  Database,
  Globe,
  Server,
} from "lucide-react";

const iconColorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
};

function AdminCard({
  icon: Icon,
  title,
  desc,
  href,
  color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  href: string;
  color: string;
}) {
  const c = iconColorMap[color] || iconColorMap.blue;
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-slate-200 active:shadow-md active:scale-[0.98] transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 ${c.bg} ${c.text} rounded-xl group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">{desc}</p>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#CC0000] group-hover:gap-2 transition-all">
            Buka <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

function StatusItem({
  icon: Icon,
  label,
  status,
  color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  status: string;
  color: string;
}) {
  const c = iconColorMap[color] || iconColorMap.blue;
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 ${c.bg} ${c.text} rounded-lg`}>
        <Icon size={16} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-600">{label}</p>
      </div>
      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {status}
      </span>
    </div>
  );
}

export default async function HRDAdmin() {
  let dbConnected = false;
  try {
    const { error } = await supabaseAdmin.from("karyawan").select("id", { count: "exact", head: true });
    dbConnected = !error;
  } catch {
    dbConnected = false;
  }

  const adminCards = [
    {
      icon: Users,
      title: "User Management",
      desc: "Kelola akun pengguna dan akses.",
      href: "/hrd/admin/users",
      color: "blue",
    },
    {
      icon: Shield,
      title: "Roles & Permissions",
      desc: "Atur peran dan hak akses sistem.",
      href: "/hrd/admin/roles",
      color: "emerald",
    },
    {
      icon: CheckCircle2,
      title: "Approval Workflow",
      desc: "Konfigurasi alur persetujuan.",
      href: "/hrd/admin/approvals",
      color: "amber",
    },
    {
      icon: FileText,
      title: "Audit Logs",
      desc: "Catatan aktivitas dan perubahan.",
      href: "/hrd/admin/audit",
      color: "purple",
    },
    {
      icon: Bell,
      title: "Notifikasi",
      desc: "Pengaturan notifikasi sistem.",
      href: "/hrd/admin/notifications",
      color: "red",
    },
    {
      icon: Settings,
      title: "Company Settings",
      desc: "Konfigurasi data perusahaan.",
      href: "/hrd/admin/settings",
      color: "indigo",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530]">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Konfigurasi sistem dan manajemen pengguna.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-extrabold text-slate-800 mb-4">Status Sistem</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatusItem
            icon={Database}
            label="Database"
            status={dbConnected ? "Connected" : "Error"}
            color="blue"
          />
          <StatusItem
            icon={Globe}
            label="API"
            status="Online"
            color="emerald"
          />
          <StatusItem
            icon={Server}
            label="Server"
            status="Running"
            color="purple"
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-extrabold text-slate-800 mb-4">Konfigurasi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminCards.map((card) => (
            <AdminCard key={card.href} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
