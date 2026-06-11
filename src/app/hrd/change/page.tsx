import { RefreshCw, ArrowRight, Lightbulb, Users, TrendingUp } from "lucide-react";

export default async function HRDChange() {
  const phases = [
    {
      icon: <Lightbulb size={20} />,
      title: "Awareness & Preparation",
      description: "Membangun kesadaran akan kebutuhan perubahan dan mempersiapkan organisasi untuk transformasi.",
      color: "blue",
      status: "In Progress",
    },
    {
      icon: <Users size={20} />,
      title: "Stakeholder Engagement",
      description: "Melibatkan seluruh pemangku kepentingan dalam proses perubahan untuk mendapatkan dukungan dan partisipasi.",
      color: "emerald",
      status: "Planned",
    },
    {
      icon: <RefreshCw size={20} />,
      title: "Implementation & Adoption",
      description: "Eksekusi rencana perubahan dan memastikan adopsi oleh seluruh anggota organisasi.",
      color: "amber",
      status: "Upcoming",
    },
    {
      icon: <TrendingUp size={20} />,
      title: "Sustain & Optimize",
      description: "Mempertahankan momentum perubahan dan melakukan optimalisasi berkelanjutan untuk hasil maksimal.",
      color: "purple",
      status: "Upcoming",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; line: string; dot: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", line: "border-blue-200", dot: "bg-blue-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", line: "border-emerald-200", dot: "bg-emerald-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", line: "border-amber-200", dot: "bg-amber-500" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", line: "border-purple-200", dot: "bg-purple-500" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Change Management</h1>
        <p className="text-sm text-gray-500">Manajemen perubahan organisasi dan transformasi</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="mx-auto w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
          <RefreshCw size={36} className="text-blue-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Organizational Change Framework</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Modul ini menyediakan kerangka kerja manajemen perubahan untuk memandu transformasi organisasi,
          mulai dari perencanaan hingga keberlanjutan, dengan pendekatan yang terstruktur dan terukur.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        <h3 className="font-extrabold text-slate-800 text-sm mb-6">Change Management Phases</h3>

        <div className="relative">
          {phases.map((phase, idx) => {
            const c = colorClasses[phase.color] || colorClasses.blue;
            return (
              <div key={phase.title} className="relative flex gap-6 pb-8 last:pb-0">
                {idx < phases.length - 1 && (
                  <div className={`absolute left-[19px] top-12 bottom-0 w-px border-l-2 border-dashed ${c.line}`} />
                )}

                <div className={`shrink-0 h-10 w-10 rounded-full ${c.bg} ${c.text} flex items-center justify-center z-10 ring-4 ring-white`}>
                  {phase.icon}
                </div>

                <div className="flex-1 min-w-0 bg-slate-50 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{phase.title}</h4>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                      phase.status === "In Progress" ? "bg-emerald-50 text-emerald-700" :
                      phase.status === "Planned" ? "bg-blue-50 text-blue-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {phase.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{phase.description}</p>
                  <div className="flex items-center gap-1.5 mt-3">
                    <ArrowRight size={12} className={c.text} />
                    <span className="text-[10px] font-bold text-slate-500">Pelajari lebih lanjut</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
