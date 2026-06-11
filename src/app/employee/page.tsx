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
    .select("department, position")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const department = employee?.department || "Operational";

  const announcements = [
    { id: 1, title: "Evaluasi Kinerja Kuartal II (Q2)", desc: "Diharapkan mengisi formulir penilaian KPI mandiri sebelum tanggal 20 Juni 2026.", date: "10 Jun 2026", category: "HRD Info" },
    { id: 2, title: "Sosialisasi Manfaat BPJS Kesehatan Terbaru", desc: "Pertemuan online hari Jumat jam 14:00 WIB via Zoom. Link undangan dikirim ke email.", date: "08 Jun 2026", category: "Benefit" },
  ];

  const scheduleToday = [
    { id: 1, title: "Daily Standup Meeting", time: "09:00 - 09:30 WIB", room: "Ruang Rapat Utama / Zoom" },
    { id: 2, title: "Operational Briefing", time: "13:00 - 14:00 WIB", room: "Gudang Logistik C" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-[#1E293B] to-slate-900 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -mr-12 -mt-12 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 backdrop-blur-sm">
            Portal Karyawan
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-4">
            Selamat Pagi, {userName}!
          </h1>
          <p className="text-slate-300 text-sm mt-2 font-light leading-relaxed">
            Semoga harimu menyenangkan dan penuh produktivitas. Pastikan untuk melakukan check-in kehadiran harian sebelum jam kerja dimulai.
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Attendance & Stats */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Check-in Section */}
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
              <button className="w-full md:w-auto bg-[#0F172A] hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-xs transition-all shadow-md shadow-slate-900/10 active:scale-95">
                Check-in Sekarang
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Leave Balance */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Sisa Cuti Tahunan</span>
                  <span className="p-2 bg-red-50 text-red-600 rounded-lg"><Coffee size={16} /></span>
                </div>
                <div className="mt-4">
                  <h4 className="text-3xl font-extrabold text-slate-900">10 Hari</h4>
                  <p className="text-xs text-slate-500 mt-1">Dari total jatah 12 hari cuti tahunan</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6 space-y-2">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: "83.3%" }}></div>
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>Terpakai: 2 Hari</span>
                  <span>Tersedia: 10 Hari</span>
                </div>
              </div>

              <Link 
                href="/employee/attendance" 
                className="w-full text-center py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors mt-6 block"
              >
                Ajukan Cuti Baru
              </Link>
            </div>

            {/* Salary slip */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Slip Gaji Terakhir</span>
                  <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText size={16} /></span>
                </div>
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-slate-400">Bulan: Mei 2026</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xl font-extrabold text-slate-800">Rp ••••••••</span>
                    <EyeOff size={14} className="text-slate-400 cursor-pointer" />
                  </div>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Ditransfer pada 25 Mei 2026
                  </p>
                </div>
              </div>

              <Link 
                href="/employee/payslip" 
                className="w-full text-center py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 mt-12"
              >
                <Download size={12} /> Unduh Slip PDF
              </Link>
            </div>
          </div>

          {/* Announcements Feed */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-red-500" />
                <h3 className="font-extrabold text-slate-800">Pengumuman Internal</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Pemberitahuan Terbaru</span>
            </div>

            <div className="divide-y divide-slate-100">
              {announcements.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 group">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{item.category}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.date}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-1.5 group-hover:text-red-600 transition-colors">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all mt-1.5 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Schedule / Quick Contacts */}
        <div className="space-y-8">
          
          {/* Day Schedule Planner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-red-500" />
                <h3 className="font-extrabold text-slate-800">Agenda Hari Ini</h3>
              </div>
            </div>

            <div className="space-y-4">
              {scheduleToday.map((event) => (
                <div key={event.id} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">{event.time}</span>
                  <h4 className="text-xs font-bold text-slate-800">{event.title}</h4>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} className="text-slate-400" />
                    <span>{event.room}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-3xl text-white shadow-md shadow-red-600/10 flex flex-col justify-between">
            <div>
              <h4 className="text-base font-bold">Butuh Bantuan HRD?</h4>
              <p className="text-xs text-red-100 mt-2 leading-relaxed">Mengalami kendala terkait payroll, absensi, data diri, atau sistem HRIS? Segera hubungi Tim HRD PT Pratama Galuh Perkasa.</p>
            </div>
            <Link 
              href="mailto:hrd@pratamagaluh.co.id" 
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
