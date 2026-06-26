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
  Building2,
  Clock,
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
  icon: Icon, title, desc, href, color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string; desc: string; href: string; color: string;
}) {
  const c = iconColorMap[color] || iconColorMap.blue;
  return (
    <Link href={href} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-slate-200 transition-all group">
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
  icon: Icon, label, value, color, tooltip,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string; value: number; color: string; tooltip?: string;
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

function BarChart({ data }: { data: { label: string; sublabel?: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const BAR_H = 120;
  const BAR_W = 32;
  const GAP = 14;
  const PADDING_LEFT = 28;
  const totalW = PADDING_LEFT + data.length * (BAR_W + GAP) - GAP + 10;

  return (
    <svg viewBox={`0 0 ${totalW} ${BAR_H + 52}`} className="w-full" aria-hidden>
      {/* y-axis gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = BAR_H - frac * BAR_H;
        const val = Math.round(frac * max);
        return (
          <g key={frac}>
            <line x1={PADDING_LEFT - 4} y1={y} x2={totalW - 6} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PADDING_LEFT - 6} y={y + 4} textAnchor="end" fontSize={8} fill="#cbd5e1">{val}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const barH = max === 0 ? 2 : Math.max((d.value / max) * BAR_H, d.value > 0 ? 4 : 2);
        const x = PADDING_LEFT + i * (BAR_W + GAP);
        const y = BAR_H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={BAR_W} height={barH} fill="#CC0000" rx={4}
              opacity={d.value === 0 ? 0.15 : 0.85} />
            {d.value > 0 && (
              <text x={x + BAR_W / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="#CC0000" fontWeight="700">
                {d.value}
              </text>
            )}
            <text x={x + BAR_W / 2} y={BAR_H + 14} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="600">
              {d.label}
            </text>
            {d.sublabel && (
              <text x={x + BAR_W / 2} y={BAR_H + 26} textAnchor="middle" fontSize={8} fill="#94a3b8">
                {d.sublabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function HorizontalBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px]">{d.label}</span>
            <span className="text-xs font-extrabold text-slate-800 ml-2">{d.value}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const R = 52;
  const CX = 64;
  const CY = 64;
  const strokeW = 20;
  const circumference = 2 * Math.PI * R;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = total === 0 ? 0 : seg.value / total;
    const dash = pct * circumference;
    const arc = { ...seg, dash, offset: offset * circumference };
    offset += pct;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 128 128" className="w-28 h-28 shrink-0" aria-hidden>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
        {total === 0 ? (
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e2e8f0" strokeWidth={strokeW} />
        ) : arcs.map((arc, i) => (
          <circle key={i} cx={CX} cy={CY} r={R} fill="none"
            stroke={arc.color} strokeWidth={strokeW}
            strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
            strokeDashoffset={circumference / 4 - arc.offset}
            transform={`rotate(-90 ${CX} ${CY})`}
          />
        ))}
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize={18} fontWeight="800" fill="#1e293b">{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">Total</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-slate-600 flex-1">{seg.label}</span>
            <span className="text-xs font-extrabold text-slate-800">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("id-ID", { weekday: "short" }),
      sublabel: `${d.getDate()}/${d.getMonth() + 1}`,
    });
  }
  return days;
}

const DEPT_COLORS = ["#CC0000", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];

import { requireRole } from "@/lib/auth-guard";

export default async function HRDDashboard() {
  const user = await requireRole("hrd", "superadmin");
  const userName = user.name || "Administrator HRD";

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentDateStr = now.toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalEmployees },
    { count: totalDepartments },
    { count: presentToday },
    { count: pendingRequests },
    { count: pendingLeaves },
    { count: activeJobs },
    { data: attendanceRaw },
    { data: employeesRaw },
    { data: leavesRaw },
    { data: applicantsRaw },
  ] = await Promise.all([
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).neq("status", "Inactive"),
    supabaseAdmin.from("departments").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).not("check_in", "is", null),
    supabaseAdmin.from("workforce_requests").select("*", { count: "exact", head: true }).eq("status", "Pending"),
    supabaseAdmin.from("leave_requests").select("*", { count: "exact", head: true }).eq("status", "Pending"),
    supabaseAdmin.from("job_postings").select("*", { count: "exact", head: true }).eq("status", "Open"),
    supabaseAdmin.from("attendance").select("date").gte("date", sevenDaysAgoStr).lte("date", today).not("check_in", "is", null),
    supabaseAdmin.from("employees").select("department").neq("status", "Inactive"),
    supabaseAdmin.from("leave_requests").select("status").gte("created_at", monthStart),
    supabaseAdmin.from("job_applications").select("status"),
  ]);

  // Process attendance per day
  const last7Days = getLast7Days();
  const attendanceByDate: Record<string, number> = {};
  (attendanceRaw || []).forEach((r) => {
    if (r.date) attendanceByDate[r.date] = (attendanceByDate[r.date] || 0) + 1;
  });
  const attendanceChartData = last7Days.map((d) => ({
    label: d.label,
    sublabel: d.sublabel,
    value: attendanceByDate[d.date] || 0,
  }));

  // Process employees by department (top 6)
  const deptCount: Record<string, number> = {};
  (employeesRaw || []).forEach((e) => {
    if (e.department) deptCount[e.department] = (deptCount[e.department] || 0) + 1;
  });
  const deptChartData = Object.entries(deptCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], i) => ({ label, value, color: DEPT_COLORS[i % DEPT_COLORS.length] }));

  // Process leave by status
  const leaveCount: Record<string, number> = { Pending: 0, Disetujui: 0, Ditolak: 0 };
  (leavesRaw || []).forEach((l) => {
    if (l.status && l.status in leaveCount) leaveCount[l.status]++;
  });
  const leaveTotal = Object.values(leaveCount).reduce((a, b) => a + b, 0);
  const leaveSegments = [
    { label: "Pending", value: leaveCount.Pending, color: "#f59e0b" },
    { label: "Disetujui", value: leaveCount.Disetujui, color: "#16a34a" },
    { label: "Ditolak", value: leaveCount.Ditolak, color: "#CC0000" },
  ];

  // Process applicants by status
  const appCount: Record<string, number> = {};
  (applicantsRaw || []).forEach((a) => {
    if (a.status) appCount[a.status] = (appCount[a.status] || 0) + 1;
  });
  const appChartData = Object.entries(appCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], i) => ({ label, value, color: DEPT_COLORS[i % DEPT_COLORS.length] }));

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
    { label: "Total Karyawan", value: totalEmployees || 0, icon: Users, color: "blue", tooltip: "Jumlah seluruh karyawan aktif" },
    { label: "Total Departemen", value: totalDepartments || 0, icon: Building2, color: "indigo", tooltip: "Jumlah departemen terdaftar" },
    { label: "Hadir Hari Ini", value: presentToday || 0, icon: CalendarCheck, color: "emerald", tooltip: "Karyawan hadir hari ini" },
    { label: "Permintaan Pending", value: pendingRequests || 0, icon: Clock, color: "amber", tooltip: "Permintaan tenaga kerja menunggu" },
    { label: "Cuti Pending", value: pendingLeaves || 0, icon: FileText, color: "red", tooltip: "Pengajuan cuti menunggu HRD" },
    { label: "Lowongan Aktif", value: activeJobs || 0, icon: Briefcase, color: "purple", tooltip: "Lowongan kerja yang dibuka" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Selamat Datang, {userName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{currentDateStr}</p>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-2">Akses Cepat</h2>
        <p className="text-xs text-slate-400 mb-4">Klik untuk langsung ke halaman aksi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccess.map((item) => (
            <QuickCard key={item.href} {...item} />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-4">Ringkasan Hari Ini</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <StatMiniCard key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-4">Grafik & Analitik</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Attendance 7 Days */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Kehadiran 7 Hari Terakhir</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Jumlah karyawan yang check-in per hari</p>
            </div>
            <BarChart data={attendanceChartData} />
          </div>

          {/* Dept Distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Distribusi Karyawan per Departemen</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Top departemen berdasarkan jumlah karyawan aktif</p>
            </div>
            {deptChartData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada data departemen.</p>
            ) : (
              <HorizontalBarChart data={deptChartData} />
            )}
          </div>

          {/* Leave Status */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Status Cuti Bulan Ini</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Distribusi status pengajuan cuti bulan berjalan</p>
            </div>
            {leaveTotal === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada pengajuan cuti bulan ini.</p>
            ) : (
              <DonutChart segments={leaveSegments} total={leaveTotal} />
            )}
          </div>

          {/* Applicant Pipeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Pipeline Rekrutmen</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Jumlah pelamar berdasarkan status seleksi</p>
            </div>
            {appChartData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada data pelamar.</p>
            ) : (
              <HorizontalBarChart data={appChartData} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
