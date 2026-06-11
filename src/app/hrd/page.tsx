import { cookies } from "next/headers";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import {
  Users,
  Briefcase,
  CalendarCheck,
  Wallet,
  TrendingUp,
  FileText,
  Settings,
  GraduationCap,
} from "lucide-react";

const iconColorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
  teal: { bg: "bg-teal-50", text: "text-teal-600" },
};

function QuickCard({
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
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-slate-200 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 ${c.bg} ${c.text} rounded-xl shrink-0 group-hover:scale-110 transition-transform`}>
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

function StatMiniCard({
  icon: Icon,
  label,
  value,
  color,
  tooltip,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
  color: string;
  tooltip?: string;
}) {
  const c = iconColorMap[color] || iconColorMap.blue;
  return (
    <div title={tooltip} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`p-2.5 ${c.bg} ${c.text} rounded-xl`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{label}</p>
        <p className="text-xl font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default async function HRDDashboard() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("user_name")?.value || "Administrator HRD";

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentDateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [
    { count: totalEmployees },
    { count: presentToday },
    { count: activeJobs },
    { count: pendingLeaves },
  ] = await Promise.all([
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).neq("status", "Inactive"),
    supabaseAdmin.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "Present"),
    supabaseAdmin.from("jobs").select("*", { count: "exact", head: true }).eq("status", "Open"),
    supabaseAdmin.from("leaves").select("*", { count: "exact", head: true }).eq("status", "Pending"),
  ]);

  const quickAccess = [
    { icon: Users, title: "Data Karyawan", desc: "Kelola data, kontrak, dan struktur organisasi", href: "/hrd/employees", color: "blue" },
    { icon: Briefcase, title: "Rekrutmen", desc: "Lowongan, pelamar, dan hiring", href: "/hrd/recruitment", color: "emerald" },
    { icon: CalendarCheck, title: "Absensi & Cuti", desc: "Pantau kehadiran dan setujui cuti", href: "/hrd/attendance", color: "amber" },
    { icon: Wallet, title: "Payroll", desc: "Gaji, slip, dan komponen salary", href: "/hrd/payroll", color: "purple" },
    { icon: TrendingUp, title: "KPI & Performa", desc: "Penilaian kinerja karyawan", href: "/hrd/kpi", color: "red" },
    { icon: FileText, title: "Laporan", desc: "Rekap dan analisis data HR", href: "/hrd/reports", color: "indigo" },
    { icon: Settings, title: "Pengaturan", desc: "User, role, dan konfigurasi sistem", href: "/hrd/admin", color: "slate" },
    { icon: GraduationCap, title: "Pelatihan", desc: "Program training dan sertifikasi", href: "/hrd/learning", color: "teal" },
  ];

  const stats = [
    { label: "Total Karyawan", value: totalEmployees || 0, icon: Users, color: "blue", tooltip: "Jumlah seluruh karyawan aktif yang terdaftar di sistem" },
    { label: "Hadir Hari Ini", value: presentToday || 0, icon: CalendarCheck, color: "emerald", tooltip: "Jumlah karyawan yang tercatat hadir pada hari ini" },
    { label: "Lowongan Aktif", value: activeJobs || 0, icon: Briefcase, color: "amber", tooltip: "Jumlah lowongan kerja yang sedang dibuka dan aktif" },
    { label: "Cuti Pending", value: pendingLeaves || 0, icon: FileText, color: "red", tooltip: "Jumlah pengajuan cuti yang menunggu persetujuan HRD" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Selamat Datang, {userName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {currentDateStr}
        </p>
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-2">Akses Cepat</h2>
        <p className="text-xs text-slate-400 mb-4">Klik untuk langsung ke halaman aksi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccess.map((item) => (
            <QuickCard key={item.href} {...item} />
          ))}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 flex items-center gap-2">
        <span className="text-sm">📊</span>
        <p className="text-xs text-slate-500">Grafik &mdash; data ditampilkan sebagai visual, tidak bisa diklik</p>
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-4">Ringkasan Hari Ini</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <StatMiniCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </div>
  );
}
