import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, BookOpen, Users, Calendar, Clock, CheckCircle2, Play, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function HRDLearning() {
  const [{ data: trainings }, { data: enrollments }] = await Promise.all([
    supabaseAdmin.from("trainings").select("*").order("date_start", { ascending: false }),
    supabaseAdmin.from("training_enrollments").select("training_id, status"),
  ]);

  const trainingList = (trainings || []) as Record<string, unknown>[];
  const enrollmentList = (enrollments || []) as Record<string, unknown>[];

  const totalTrainings = trainingList.length;
  const planned  = trainingList.filter((t) => t.status === "Planned").length;
  const ongoing  = trainingList.filter((t) => t.status === "Ongoing").length;
  const completed = trainingList.filter((t) => t.status === "Completed").length;
  const totalEnrollments = enrollmentList.length;

  const recent = trainingList.slice(0, 6);

  const statusBadge = (s: unknown) => {
    if (s === "Planned")   return "bg-amber-50 text-amber-700 border border-amber-100";
    if (s === "Ongoing")   return "bg-blue-50 text-blue-700 border border-blue-100";
    if (s === "Completed") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    return "bg-slate-100 text-slate-500";
  };

  const formatDate = (d: unknown) =>
    d ? new Date(d as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

  const subMenus = [
    { label: "Program Pelatihan", href: "/hrd/learning/programs", icon: BookOpen, desc: "Kelola katalog program", color: "bg-blue-50 text-blue-600" },
    { label: "Jadwal Pelatihan", href: "/hrd/learning/schedule", icon: Calendar, desc: "Atur jadwal & sesi", color: "bg-purple-50 text-purple-600" },
    { label: "Materi & Konten", href: "/hrd/learning/materials", icon: Play, desc: "Upload materi belajar", color: "bg-emerald-50 text-emerald-600" },
    { label: "Sertifikasi", href: "/hrd/learning/certificates", icon: CheckCircle2, desc: "Rekap sertifikat", color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Learning Management</h1>
          <p className="text-sm text-gray-500">Manajemen pelatihan dan pengembangan kompetensi karyawan</p>
        </div>
        <Link href="/hrd/learning/programs"
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <GraduationCap size={14} /> Kelola Program
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Program",   value: totalTrainings,   icon: BookOpen,      color: "bg-blue-50 text-blue-600" },
          { label: "Sedang Berjalan", value: ongoing,          icon: Play,          color: "bg-amber-50 text-amber-600" },
          { label: "Selesai",         value: completed,        icon: CheckCircle2,  color: "bg-emerald-50 text-emerald-600" },
          { label: "Total Peserta",   value: totalEnrollments, icon: Users,         color: "bg-purple-50 text-purple-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}><stat.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {subMenus.map((m) => (
          <Link key={m.href} href={m.href}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">
            <div className={`p-2.5 rounded-xl ${m.color} w-fit mb-3`}><m.icon size={18} /></div>
            <p className="font-extrabold text-slate-800 text-sm group-hover:text-[#CC0000] transition-colors">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BarChart3 size={18} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Program Terbaru</h3>
              <p className="text-xs text-slate-400 mt-0.5">Daftar program pelatihan aktif & terjadwal</p>
            </div>
          </div>
          <Link href="/hrd/learning/programs" className="text-xs font-bold text-[#CC0000] hover:underline">
            Lihat semua →
          </Link>
        </div>

        {trainingList.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada program pelatihan.</p>
            <p className="text-xs text-slate-400 mt-1">Tambahkan program pertama di menu Program Pelatihan.</p>
            <Link href="/hrd/learning/programs"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              <GraduationCap size={12} /> Tambah Program
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recent.map((t) => (
              <div key={t.id as string} className="px-6 py-4 hover:bg-slate-50/30 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="p-2.5 bg-slate-100 text-slate-500 rounded-xl shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm truncate">{t.title as string}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <Clock size={10} />
                      {formatDate(t.date_start)} — {formatDate(t.date_end)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Users size={10} />
                    {(enrollmentList.filter((e) => e.training_id === t.id)).length} peserta
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusBadge(t.status)}`}>
                    {t.status as string}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {trainingList.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-6 text-xs text-slate-500">
              <span>Planned: <strong className="text-amber-600">{planned}</strong></span>
              <span>Berjalan: <strong className="text-blue-600">{ongoing}</strong></span>
              <span>Selesai: <strong className="text-emerald-600">{completed}</strong></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
