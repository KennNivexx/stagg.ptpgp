import { 
  Clock, 
  Calendar, 
  Download, 
  MapPin, 
  Coffee, 
  FileText, 
  CheckCircle2, 
  Megaphone, 
  CalendarDays, 
  ChevronRight,
  EyeOff,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

export default async function EmployeeDashboard() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("user_name")?.value || "Karyawan";
  const userEmail = cookieStore.get("user_email")?.value || "";

  const todayDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const employeeId = employee?.id;
  const department = employee?.department || "-";

  let annualLeaveUsed = 0;
  let annualLeaveTotal = 12;
  if (employeeId) {
    const { data: approvedLeaves } = await supabaseAdmin
      .from("leaves")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("type", "Cuti Tahunan")
      .eq("status", "Approved");
    annualLeaveUsed = (approvedLeaves || []).length;
  }

  let lastPayroll: Record<string, unknown> | null = null;
  if (employeeId) {
    const { data } = await supabaseAdmin
      .from("payroll")
      .select("basic_salary, net_salary, period, payment_date")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(1);
    lastPayroll = data?.[0] || null;
  }

  const annualLeaveRemaining = annualLeaveTotal - annualLeaveUsed;
  const leavePercent = Math.min((annualLeaveUsed / annualLeaveTotal) * 100, 100);

  const formatCurrency = (val: unknown) => {
    const n = Number(val);
    if (isNaN(n)) return "••••••••";
    return `Rp ${n.toLocaleString("id-ID")}`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-900 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -mr-12 -mt-12 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 backdrop-blur-sm">
            Portal Karyawan
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-4">
            Selamat Datang, {userName}!
          </h1>
          <p className="text-slate-300 text-sm mt-2 font-light leading-relaxed">
            Pantau kehadiran, cuti, slip gaji, dan informasi penting lainnya di satu tempat.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-slate-300 border-t border-white/10 pt-4">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-red-500" />
              <span>{todayDate}</span>
            </div>
            <span className="h-3 w-px bg-white/20 hidden sm:block"></span>
            <div className="flex items-center gap-1.5">
              <UserCheck size={14} className="text-emerald-500" />
              <span>Divisi: {department}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-50 text-slate-700 rounded-2xl border border-slate-100 shrink-0">
                <Clock size={28} className="animate-pulse text-red-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base">Presensi Harian Anda</h3>
                <p className="text-xs text-slate-400 mt-0.5">Jadwal Masuk: 08:00 WIB</p>
                <div className="flex items-center gap-1.5 mt-2 text-red-600 bg-red-50 px-2.5 py-1 rounded-lg w-fit text-[11px] font-bold">
                  <MapPin size={12} />
                  <span>Belum Check-in</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/employee/attendance" className="w-full md:w-auto bg-[#0F172A] hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-xs transition-all shadow-md shadow-slate-900/10 active:scale-95">
                Check-in Sekarang
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Sisa Cuti Tahunan</span>
                  <span className="p-2 bg-red-50 text-red-600 rounded-lg"><Coffee size={16} /></span>
                </div>
                <div className="mt-4">
                  <h4 className="text-3xl font-extrabold text-slate-900">{annualLeaveRemaining} Hari</h4>
                  <p className="text-xs text-slate-500 mt-1">Dari total jatah {annualLeaveTotal} hari cuti tahunan</p>
                </div>
              </div>
              <div className="mt-6 space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: `${leavePercent}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>Terpakai: {annualLeaveUsed} Hari</span>
                  <span>Tersedia: {annualLeaveRemaining} Hari</span>
                </div>
              </div>
              <Link 
                href="/employee/leaves" 
                className="w-full text-center py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors mt-6 block"
              >
                Ajukan Cuti Baru
              </Link>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Slip Gaji Terakhir</span>
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16} /></span>
                </div>
                <div className="mt-4">
                  {lastPayroll ? (
                    <>
                      <p className="text-[10px] font-bold text-slate-400">Periode: {lastPayroll.period as string || "-"}</p>
                      <p className="text-xl font-extrabold text-slate-800 mt-2">{formatCurrency(lastPayroll.net_salary)}</p>
                      {lastPayroll.payment_date && (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Ditransfer {new Date(lastPayroll.payment_date as string).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold text-slate-400">Belum ada slip gaji</p>
                      <p className="text-sm text-slate-500 mt-2">Data payroll akan muncul setelah diproses HRD.</p>
                    </>
                  )}
                </div>
              </div>
              <Link 
                href="/employee/payslip" 
                className="w-full text-center py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 mt-12"
              >
                <Download size={12} /> Lihat Slip Gaji
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-red-500" />
                <h3 className="font-extrabold text-slate-800">Pengumuman Internal</h3>
              </div>
            </div>
            <div className="text-center py-10">
              <Megaphone size={36} className="mx-auto text-slate-200 mb-3" />
              <p className="text-sm text-slate-400">Belum ada pengumuman terbaru.</p>
              <p className="text-xs text-slate-300 mt-1">HRD akan mengirimkan pengumuman penting di sini.</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-red-500" />
                <h3 className="font-extrabold text-slate-800">Menu Cepat</h3>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Profil Saya", href: "/employee/profile" },
                { label: "Absensi & Kehadiran", href: "/employee/attendance" },
                { label: "Cuti & Izin", href: "/employee/leaves" },
                { label: "Slip Gaji", href: "/employee/payslip" },
                { label: "KPI & Performa", href: "/employee/kpi" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-xs font-medium text-slate-700"
                >
                  {item.label}
                  <ChevronRight size={14} className="text-slate-400" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-3xl text-white shadow-md shadow-red-600/10 flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold">Butuh Bantuan HRD?</h4>
              <p className="text-xs text-red-100 mt-2 leading-relaxed">Mengalami kendala terkait payroll, absensi, data diri, atau sistem? Segera hubungi Tim HRD.</p>
            </div>
            <Link 
              href="mailto:hrd@ptpgp.co.id" 
              className="w-full text-center py-2.5 bg-white text-red-600 hover:bg-red-50 rounded-2xl text-xs font-bold transition-colors mt-6 block"
            >
              Hubungi Tim HRD
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
