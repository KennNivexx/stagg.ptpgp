import { GraduationCap, BookOpen, Play, Clock, Users } from "lucide-react";

export default async function HRDLearning() {
  const programs = [
    {
      icon: <Play size={18} />,
      title: "Onboarding Program",
      description: "Program orientasi untuk karyawan baru agar cepat beradaptasi dengan budaya dan sistem perusahaan.",
      duration: "2 minggu",
      participants: "Semua karyawan baru",
      color: "blue",
    },
    {
      icon: <BookOpen size={18} />,
      title: "Technical Training",
      description: "Pelatihan teknis untuk meningkatkan keahlian spesifik sesuai dengan bidang pekerjaan masing-masing.",
      duration: "Berbasis modul",
      participants: "Per departemen",
      color: "emerald",
    },
    {
      icon: <Users size={18} />,
      title: "Soft Skills Development",
      description: "Pengembangan kemampuan komunikasi, kepemimpinan, dan kolaborasi untuk semua level karyawan.",
      duration: "Berbasis workshop",
      participants: "Semua karyawan",
      color: "amber",
    },
    {
      icon: <GraduationCap size={18} />,
      title: "Leadership Program",
      description: "Program pengembangan kepemimpinan untuk manajer dan calon pemimpin masa depan organisasi.",
      duration: "6 bulan",
      participants: "Manager & Supervisor",
      color: "purple",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Learning Management</h1>
        <p className="text-sm text-gray-500">Manajemen pelatihan dan pengembangan karyawan</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
          <GraduationCap size={36} className="text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Learning Management System</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Modul ini akan menyediakan platform manajemen pembelajaran dan pengembangan,
          termasuk katalog pelatihan, tracking progress, dan sertifikasi karyawan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((prog) => {
          const c = colorClasses[prog.color] || colorClasses.blue;
          return (
            <div key={prog.title} className={`p-6 rounded-2xl border border-slate-100 shadow-sm ${c.bg} hover:shadow-md transition-all`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${c.iconBg} ${c.text} shrink-0`}>
                  {prog.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 text-sm mb-1">{prog.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{prog.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={10} /> {prog.duration}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Users size={10} /> {prog.participants}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
