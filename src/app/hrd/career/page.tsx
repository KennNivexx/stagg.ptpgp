import { TrendingUp, Briefcase, ArrowUp, Target, Star } from "lucide-react";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";

export default async function HRDCareer() {
  const paths = [
    {
      icon: <Briefcase size={20} />,
      title: "Jalur Manajerial",
      description: "Pengembangan karir menuju posisi manajemen dan kepemimpinan tim dengan tanggung jawab yang semakin besar.",
      steps: ["Staff", "Supervisor", "Manager", "Senior Manager", "Director"],
      color: "blue",
    },
    {
      icon: <Star size={20} />,
      title: "Jalur Spesialis",
      description: "Pendalaman keahlian teknis pada bidang tertentu tanpa harus mengambil peran manajerial.",
      steps: ["Junior", "Associate", "Specialist", "Senior Specialist", "Principal"],
      color: "emerald",
    },
    {
      icon: <Target size={20} />,
      title: "Jalur Proyek",
      description: "Karir berbasis proyek dengan kesempatan memimpin inisiatif strategis lintas departemen.",
      steps: ["Member", "Lead", "PM", "Program Manager", "Portfolio Manager"],
      color: "amber",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; badge: string; stepBg: string }> = {
    blue: { bg: "bg-blue-50/60", text: "text-blue-600", badge: "bg-blue-100 text-blue-700", stepBg: "bg-blue-500" },
    emerald: { bg: "bg-emerald-50/60", text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700", stepBg: "bg-emerald-500" },
    amber: { bg: "bg-amber-50/60", text: "text-amber-600", badge: "bg-amber-100 text-amber-700", stepBg: "bg-amber-500" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Career Development</h1>
        <p className="text-sm text-gray-500">Pengembangan karir dan jalur promosi karyawan</p>
      </div>

      <SectionQuickLinks groupLabel="Pengembangan Karir" excludeHref="/hrd/career" />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
          <TrendingUp size={36} className="text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Career Development Framework</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Modul ini akan menyediakan kerangka pengembangan karir yang terstruktur, termasuk jalur promosi,
          rencana pengembangan individu (IDP), dan program mentoring untuk seluruh karyawan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paths.map((path) => {
          const c = colorClasses[path.color] || colorClasses.blue;
          return (
            <div key={path.title} className={`p-6 rounded-2xl border border-slate-100 shadow-sm ${c.bg} hover:shadow-md transition-all`}>
              <div className={`w-fit p-3 rounded-xl ${c.badge} mb-4`}>
                {path.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{path.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-5">{path.description}</p>

              <div className="space-y-2">
                {path.steps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`h-5 w-5 rounded-full ${c.stepBg} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}>
                      {idx + 1}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className={`text-xs font-semibold ${c.text}`}>{step}</span>
                      {idx < path.steps.length - 1 && (
                        <div className="flex-1 flex items-center">
                          <div className="h-px flex-1 bg-slate-300" />
                          <ArrowUp size={10} className="text-slate-400 -rotate-90" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
