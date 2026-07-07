import Link from "next/link";
import {
  Globe,
  Monitor,
  Users,
  UserCog,
  ShieldCheck,
  TrendingUp,
  Image,
  Building2,
  Link2,
  Eye,
  UserCheck,
  Settings,
  Info,
  Star,
  Briefcase,
  MapPin,
  BarChart3,
  Factory,
  Images,
  MessageSquare,
  Award,
  HelpCircle,
  Megaphone,
  Palette,
  KeyRound,
  ClipboardList,
  Phone,
  Layers,
  LogIn,
  Activity,
  AlertOctagon,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";

export default async function SuperadminDashboard() {
  await requireRole("superadmin");
  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { data: employees, error } = await supabaseAdmin
    .from("employees")
    .select("id, address, email, status");

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-sm font-semibold">
          Gagal memuat data: {error.message}
        </div>
      </div>
    );
  }

  const employeeList = (employees || []).filter(
    (e) => (e.email as string) !== "__settings__@ptpgp.co.id"
  );
  const totalUsers = employeeList.length;

  // Role lives in the users table (users.role), not employees.address — the
  // parseRole()/__auth__ pattern below is a legacy fallback for a
  // credentials-embedded-in-address auth path that current accounts don't
  // use, so counting via parseRole always came out 0.
  const { count: totalHRD } = await supabaseAdmin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "hrd");

  // System Overview — derived from real audit_logs entries (no dedicated
  // login/session table exists in the schema, so audit_logs is used as the
  // closest available proxy for activity/monitoring metrics).
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const { data: auditLogs7d } = await supabaseAdmin
    .from("audit_logs")
    .select("action, performed_by_email, created_at")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  const logsList = auditLogs7d || [];

  // "Login" proxy: attendance clock_in events are the closest real signal we
  // have to a daily login/session start. Falls back to all audit activity
  // for that day if there are no clock_in events at all in the window.
  const loginActions = logsList.filter(
    (l) => (l.action as string) === "attendance.clock_in"
  );
  const loginSourceList = loginActions.length > 0 ? loginActions : logsList;

  const loginsToday = loginSourceList.filter(
    (l) => new Date(l.created_at as string) >= startOfToday
  ).length;

  const activeUsers7d = new Set(
    logsList
      .map((l) => l.performed_by_email as string)
      .filter((email) => !!email && email !== "__settings__@ptpgp.co.id")
  ).size;

  // No centralized error-log table exists yet — show 0 rather than inventing
  // fabricated numbers.
  const errorCount7d = 0;

  // Sparkline data: activity count per day for the last 7 days.
  const dayBuckets: { label: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(
      startOfToday.getFullYear(),
      startOfToday.getMonth(),
      startOfToday.getDate() - i
    );
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const count = loginSourceList.filter((l) => {
      const t = new Date(l.created_at as string);
      return t >= dayStart && t < dayEnd;
    }).length;
    dayBuckets.push({
      label: dayStart.toLocaleDateString("id-ID", { weekday: "short" }),
      count,
    });
  }
  const maxDayCount = Math.max(1, ...dayBuckets.map((d) => d.count));

  const overviewCards = [
    {
      label: "Login Hari Ini",
      value: loginsToday,
      icon: LogIn,
      color: "blue",
      sub:
        loginActions.length > 0
          ? "Berdasarkan clock-in hari ini"
          : "Berdasarkan aktivitas tercatat hari ini",
    },
    {
      label: "User Aktif (7 Hari)",
      value: activeUsers7d,
      icon: Activity,
      color: "emerald",
      sub: "User unik dengan aktivitas tercatat",
    },
    {
      label: "Jumlah Error",
      value: errorCount7d,
      icon: AlertOctagon,
      color: "amber",
      sub: "Belum ada pencatatan error terpusat",
    },
  ];

  const statsCards = [
    {
      label: "Total Karyawan",
      value: totalUsers,
      icon: Users,
      color: "blue",
      sub: "Semua akun terdaftar",
    },
    {
      label: "Total HRD",
      value: totalHRD,
      icon: UserCog,
      color: "emerald",
      sub: "Manajemen HR",
    },
    {
      label: "Status Website",
      value: "Aktif",
      icon: Globe,
      color: "indigo",
      sub: "CMS operasional",
    },
  ];

  const colorMap: Record<
    string,
    { bg: string; text: string; iconBg: string; accent: string }
  > = {
    blue: {
      bg: "bg-blue-500/5",
      text: "text-blue-600",
      iconBg: "bg-blue-50",
      accent: "text-blue-600",
    },
    amber: {
      bg: "bg-amber-500/5",
      text: "text-amber-600",
      iconBg: "bg-amber-50",
      accent: "text-amber-600",
    },
    emerald: {
      bg: "bg-emerald-500/5",
      text: "text-emerald-600",
      iconBg: "bg-emerald-50",
      accent: "text-emerald-600",
    },
    indigo: {
      bg: "bg-indigo-500/5",
      text: "text-indigo-600",
      iconBg: "bg-indigo-50",
      accent: "text-indigo-600",
    },
  };

  const websiteCards = [
    {
      title: "Tema & Warna",
      desc: "Ganti warna utama, navy, dan latar halaman publik",
      href: "/superadmin/website/theme",
      icon: Palette,
      color: "bg-pink-50 text-pink-600",
    },
    {
      title: "Hero Section",
      desc: "Edit judul, subtitle, dan gambar latar halaman utama",
      href: "/superadmin/website/hero",
      icon: Image,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Informasi Perusahaan",
      desc: "Edit nama, telepon, email, alamat perusahaan",
      href: "/superadmin/website/info",
      icon: Building2,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Link & Navigasi",
      desc: "Edit menu navigasi dan link footer",
      href: "/superadmin/website/links",
      icon: Link2,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "About",
      desc: "Edit teks, gambar, visi & misi halaman tentang",
      href: "/superadmin/website/about",
      icon: Info,
      color: "bg-cyan-50 text-cyan-600",
    },
    {
      title: "Features",
      desc: "Edit judul, subtitle, dan daftar fitur unggulan",
      href: "/superadmin/website/features",
      icon: Star,
      color: "bg-yellow-50 text-yellow-600",
    },
    {
      title: "Services",
      desc: "Edit judul, subtitle, dan daftar layanan",
      href: "/superadmin/website/services",
      icon: Briefcase,
      color: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Coverage",
      desc: "Edit judul dan daftar cakupan wilayah",
      href: "/superadmin/website/coverage",
      icon: MapPin,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Stats",
      desc: "Edit judul dan daftar statistik perusahaan",
      href: "/superadmin/website/stats",
      icon: BarChart3,
      color: "bg-rose-50 text-rose-600",
    },
    {
      title: "Industries",
      desc: "Edit judul, subtitle, dan daftar industri",
      href: "/superadmin/website/industries",
      icon: Factory,
      color: "bg-slate-100 text-slate-600",
    },
    {
      title: "Gallery",
      desc: "Edit judul dan daftar gambar galeri",
      href: "/superadmin/website/gallery",
      icon: Images,
      color: "bg-pink-50 text-pink-600",
    },
    {
      title: "Testimonial",
      desc: "Edit judul dan daftar testimoni klien",
      href: "/superadmin/website/testimonial",
      icon: MessageSquare,
      color: "bg-violet-50 text-violet-600",
    },
    {
      title: "Certification",
      desc: "Edit judul dan daftar sertifikasi perusahaan",
      href: "/superadmin/website/certification",
      icon: Award,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "FAQ",
      desc: "Edit judul dan daftar pertanyaan umum",
      href: "/superadmin/website/faq",
      icon: HelpCircle,
      color: "bg-sky-50 text-sky-600",
    },
    {
      title: "CTA",
      desc: "Edit judul, subtitle, dan tombol Call-to-Action",
      href: "/superadmin/website/cta",
      icon: Megaphone,
      color: "bg-red-50 text-red-600",
    },
    {
      title: "Kontak",
      desc: "Edit info kontak, alamat, dan jam operasional",
      href: "/superadmin/website/contact",
      icon: Phone,
      color: "bg-teal-50 text-teal-600",
    },
    {
      title: "Teaser (Karir & E-Pro)",
      desc: "Edit banner karir dan e-procurement",
      href: "/superadmin/website/teaser",
      icon: Layers,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  const monitoringCards = [
    {
      title: "Data HRD",
      desc: "Lihat aktivitas dan data HRD (read-only)",
      href: "/superadmin/monitoring/hrd",
      icon: Eye,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Data Karyawan",
      desc: "Lihat seluruh data karyawan (read-only)",
      href: "/superadmin/monitoring/employees",
      icon: UserCheck,
      color: "bg-teal-50 text-teal-600",
    },
  ];

  const userCards = [
    {
      title: "Manajemen User",
      desc: "Edit email & password seluruh user",
      href: "/superadmin/employees",
      icon: UserCog,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Role & Permission",
      desc: "Atur hak akses dan role setiap pengguna sistem",
      href: "/hrd/admin/roles",
      icon: KeyRound,
      color: "bg-violet-50 text-violet-600",
    },
    {
      title: "Audit Log",
      desc: "Riwayat seluruh aktivitas pengguna di sistem",
      href: "/hrd/admin/audit",
      icon: ClipboardList,
      color: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Panel Kontrol Superadmin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hari ini:{" "}
            <span className="font-semibold text-slate-700">{currentDate}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
          <ShieldCheck size={14} className="text-amber-600" />
          <span className="text-xs font-bold text-amber-700">
            Superadmin Mode
          </span>
        </div>
      </div>

      {/* System Overview */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={18} className="text-slate-500" />
          <h2 className="text-lg font-bold text-[#1A2530]">System Overview</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {overviewCards.map((stat) => {
              const c = colorMap[stat.color];
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
                >
                  <div
                    className={`absolute top-0 right-0 w-20 h-20 ${c.bg} rounded-full -mr-6 -mt-6 transition-all group-hover:scale-110 duration-300`}
                  />
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                        {stat.label}
                      </p>
                      <h3 className="text-2xl font-extrabold text-slate-800 mt-2">
                        {stat.value}
                      </h3>
                      <p className={`mt-2 ${c.accent} text-[11px] font-semibold leading-snug`}>
                        {stat.sub}
                      </p>
                    </div>
                    <div className={`p-2.5 ${c.iconBg} ${c.text} rounded-xl`}>
                      <Icon size={18} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini sparkline: Login per Hari */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              Login per Hari
            </p>
            <p className="text-xs text-slate-500 mt-0.5 mb-2">7 hari terakhir</p>
            <div className="flex-1 flex items-end">
              <svg
                viewBox="0 0 140 50"
                preserveAspectRatio="none"
                className="w-full h-12"
              >
                {(() => {
                  const w = 140;
                  const h = 50;
                  const pad = 4;
                  const stepX =
                    dayBuckets.length > 1
                      ? (w - pad * 2) / (dayBuckets.length - 1)
                      : 0;
                  const points = dayBuckets.map((d, i) => {
                    const x = pad + i * stepX;
                    const y =
                      h - pad - (d.count / maxDayCount) * (h - pad * 2);
                    return { x, y };
                  });
                  const linePath = points
                    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
                    .join(" ");
                  const areaPath =
                    points.length > 0
                      ? `${linePath} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`
                      : "";
                  return (
                    <>
                      {areaPath && (
                        <path d={areaPath} fill="var(--color-pgp-red)" opacity="0.08" />
                      )}
                      {linePath && (
                        <path
                          d={linePath}
                          fill="none"
                          stroke="var(--color-pgp-red)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r="2"
                          fill="var(--color-pgp-red)"
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
            <div className="flex justify-between mt-1">
              {dayBuckets.map((d, i) => (
                <span key={i} className="text-[9px] text-slate-400 font-semibold">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {statsCards.map((stat) => {
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
                  <div
                    className={`flex items-center gap-1 mt-2 ${c.accent} text-xs font-semibold`}
                  >
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

      {/* Manajemen Website */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-slate-500" />
          <h2 className="text-lg font-bold text-[#1A2530]">
            Manajemen Website
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {websiteCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 group"
              >
                <div className={`p-3 rounded-xl inline-block mb-4 ${card.color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {card.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Monitoring */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={18} className="text-slate-500" />
          <h2 className="text-lg font-bold text-[#1A2530]">Monitoring</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {monitoringCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 group"
              >
                <div className={`p-3 rounded-xl inline-block mb-4 ${card.color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {card.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Manajemen User */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings size={18} className="text-slate-500" />
          <h2 className="text-lg font-bold text-[#1A2530]">
            Manajemen User
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 group"
              >
                <div className={`p-3 rounded-xl inline-block mb-4 ${card.color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {card.desc}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
