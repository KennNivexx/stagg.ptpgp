import { Heart, Users, MessageCircle, Shield, Smile } from "lucide-react";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";

export default async function HRDRelations() {
  const pillars = [
    {
      icon: <MessageCircle size={20} />,
      title: "Komunikasi Internal",
      description: "Membangun saluran komunikasi terbuka antara manajemen dan karyawan untuk menciptakan transparansi dan kepercayaan.",
      color: "blue",
    },
    {
      icon: <Shield size={20} />,
      title: "Hubungan Industrial",
      description: "Mengelola hubungan dengan serikat pekerja, perjanjian kerja bersama, dan kepatuhan terhadap regulasi ketenagakerjaan.",
      color: "emerald",
    },
    {
      icon: <Smile size={20} />,
      title: "Employee Wellbeing",
      description: "Program kesejahteraan karyawan mencakup kesehatan mental, work-life balance, dan fasilitas pendukung.",
      color: "amber",
    },
    {
      icon: <Users size={20} />,
      title: "Employee Engagement",
      description: "Survei keterlibatan, program team building, dan inisiatif untuk meningkatkan kepuasan dan loyalitas karyawan.",
      color: "purple",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: "bg-blue-50/60", text: "text-blue-600", iconBg: "bg-blue-100" },
    emerald: { bg: "bg-emerald-50/60", text: "text-emerald-600", iconBg: "bg-emerald-100" },
    amber: { bg: "bg-amber-50/60", text: "text-amber-600", iconBg: "bg-amber-100" },
    purple: { bg: "bg-purple-50/60", text: "text-purple-600", iconBg: "bg-purple-100" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Employee Relations</h1>
        <p className="text-sm text-gray-500">Hubungan industrial dan kesejahteraan karyawan</p>
      </div>

      <SectionQuickLinks groupLabel="Hubungan Karyawan" excludeHref="/hrd/relations" />

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="mx-auto w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <Heart size={36} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Hubungan & Kesejahteraan Karyawan</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Modul ini akan mengelola hubungan industrial, komunikasi internal, kesejahteraan karyawan,
          dan program employee engagement untuk menciptakan lingkungan kerja yang harmonis dan produktif.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pillars.map((pillar) => {
          const c = colorClasses[pillar.color] || colorClasses.blue;
          return (
            <div key={pillar.title} className={`p-6 rounded-2xl border border-slate-100 shadow-sm ${c.bg} hover:shadow-md transition-all`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${c.iconBg} ${c.text} shrink-0`}>
                  {pillar.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2">{pillar.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{pillar.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
