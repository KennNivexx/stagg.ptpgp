import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import {
  Briefcase,
  Users,
  DollarSign,
  GraduationCap,
  TrendingUp,
  UserMinus,
} from "lucide-react";

const iconColorMap: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
};

function ReportCard({
  icon: Icon,
  title,
  desc,
  statLabel,
  statValue,
  href,
  color,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  statLabel: string;
  statValue: string | number;
  href: string;
  color: string;
}) {
  const c = iconColorMap[color] || iconColorMap.blue;
  return (
    <Link
      href={href}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:border-slate-200 transition-all group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 ${c.bg} ${c.text} rounded-xl group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-slate-800 mb-1">{title}</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{statLabel}</p>
          <p className="text-lg font-extrabold text-slate-800">{statValue}</p>
        </div>
        <span className="text-xs font-bold text-[#CC0000] group-hover:translate-x-1 transition-transform">
          Lihat &rarr;
        </span>
      </div>
    </Link>
  );
}

export default async function HRDReports() {
  const [
    { count: totalEmployees },
    { count: activeJobs },
    { count: payrollRecords },
    { count: trainingPrograms },
    { count: kpiEvaluations },
    { count: resignedEmployees },
  ] = await Promise.all([
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).neq("status", "Inactive"),
    supabaseAdmin.from("jobs").select("*", { count: "exact", head: true }).eq("status", "Open"),
    supabaseAdmin.from("payroll").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("training_programs").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("kpi_evaluations").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("status", "Resigned"),
  ]);

  const reports = [
    {
      icon: Briefcase,
      title: "Laporan Rekrutmen",
      desc: "Analisis lowongan, pelamar, dan proses hiring.",
      statLabel: "Lowongan Aktif",
      statValue: activeJobs || 0,
      href: "/hrd/reports/recruitment",
      color: "blue",
    },
    {
      icon: Users,
      title: "Laporan Karyawan",
      desc: "Demografi, status, dan data kepegawaian.",
      statLabel: "Total Karyawan",
      statValue: totalEmployees || 0,
      href: "/hrd/reports/employees",
      color: "emerald",
    },
    {
      icon: DollarSign,
      title: "Laporan Payroll",
      desc: "Rangkuman gaji, bonus, dan komponen payroll.",
      statLabel: "Slip Payroll",
      statValue: payrollRecords || 0,
      href: "/hrd/reports/payroll",
      color: "amber",
    },
    {
      icon: GraduationCap,
      title: "Laporan Training",
      desc: "Program pelatihan dan sertifikasi karyawan.",
      statLabel: "Program Training",
      statValue: trainingPrograms || 0,
      href: "/hrd/reports/training",
      color: "purple",
    },
    {
      icon: TrendingUp,
      title: "Laporan Performa",
      desc: "Evaluasi KPI dan penilaian kinerja.",
      statLabel: "Evaluasi KPI",
      statValue: kpiEvaluations || 0,
      href: "/hrd/reports/performance",
      color: "indigo",
    },
    {
      icon: UserMinus,
      title: "Laporan Turnover",
      desc: "Analisis karyawan keluar dan tingkat resign.",
      statLabel: "Resigned",
      statValue: resignedEmployees || 0,
      href: "/hrd/reports/turnover",
      color: "red",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A2530]">Laporan HR</h1>
        <p className="text-sm text-gray-500 mt-1">Rekap dan analisis data sumber daya manusia.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <ReportCard key={report.href} {...report} />
        ))}
      </div>
    </div>
  );
}
