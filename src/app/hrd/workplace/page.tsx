import { Building2, Palette, Sofa, Sun } from "lucide-react";

export default async function HRDWorkplace() {
  const features = [
    {
      icon: <Palette size={22} />,
      title: "Ruang Kolaboratif",
      description: "Desain ruang kerja yang mendorong kolaborasi tim dan kreativitas karyawan untuk produktivitas optimal.",
      color: "blue",
    },
    {
      icon: <Sofa size={22} />,
      title: "Area Istirahat & Rekreasi",
      description: "Fasilitas istirahat dan rekreasi untuk menjaga keseimbangan kerja dan kesejahteraan mental karyawan.",
      color: "emerald",
    },
    {
      icon: <Sun size={22} />,
      title: "Lingkungan Kerja Sehat",
      description: "Standar ergonomi, pencahayaan, dan sirkulasi udara yang mendukung kesehatan fisik karyawan.",
      color: "amber",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    blue: { bg: "bg-blue-50/50", text: "text-blue-600", border: "border-blue-100", iconBg: "bg-blue-50" },
    emerald: { bg: "bg-emerald-50/50", text: "text-emerald-600", border: "border-emerald-100", iconBg: "bg-emerald-50" },
    amber: { bg: "bg-amber-50/50", text: "text-amber-600", border: "border-amber-100", iconBg: "bg-amber-50" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Workplace Design</h1>
        <p className="text-sm text-gray-500">Desain lingkungan kerja dan budaya organisasi</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="mx-auto w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
          <Building2 size={36} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Fasilitas & Lingkungan Kerja</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Modul ini akan menyediakan pengelolaan desain ruang kerja, fasilitas kantor,
          dan standar lingkungan kerja untuk menciptakan budaya organisasi yang positif dan produktif.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feat) => {
          const c = colorClasses[feat.color];
          return (
            <div key={feat.title} className={`p-6 rounded-2xl border ${c.border} ${c.bg} hover:shadow-sm transition-all`}>
              <div className={`p-3 rounded-xl ${c.iconBg} ${c.text} w-fit mb-4`}>
                {feat.icon}
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-2">{feat.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
