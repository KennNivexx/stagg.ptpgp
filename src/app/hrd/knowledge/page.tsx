import { BookOpen, FileText, FolderOpen, Search, Tag } from "lucide-react";

export default async function HRDKnowledge() {
  const categories = [
    {
      icon: <FileText size={18} />,
      title: "SOP & Kebijakan",
      description: "Standard Operating Procedures dan kebijakan internal perusahaan.",
      count: "Segera tersedia",
      color: "blue",
    },
    {
      icon: <FolderOpen size={18} />,
      title: "Dokumen HR",
      description: "Template kontrak, form pengajuan, surat keputusan, dan dokumen kepegawaian.",
      count: "Segera tersedia",
      color: "emerald",
    },
    {
      icon: <BookOpen size={18} />,
      title: "Buku Panduan",
      description: "Panduan karyawan, buku saku kebijakan, dan manual operasional organisasi.",
      count: "Segera tersedia",
      color: "amber",
    },
    {
      icon: <Tag size={18} />,
      title: "Best Practices",
      description: "Kumpulan praktik terbaik, studi kasus, dan lessons learned dari berbagai proyek.",
      count: "Segera tersedia",
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
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Knowledge Management</h1>
        <p className="text-sm text-gray-500">Basis pengetahuan dan dokumentasi organisasi</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="mx-auto w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
          <BookOpen size={36} className="text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Pusat Pengetahuan Organisasi</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Modul ini akan menjadi pusat dokumentasi dan knowledge base organisasi, menyimpan SOP,
          kebijakan, panduan, dan best practices yang dapat diakses oleh seluruh karyawan.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2.5">
          <Search size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">Fitur pencarian dokumen akan segera tersedia</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const c = colorClasses[cat.color] || colorClasses.blue;
          return (
            <div key={cat.title} className={`p-6 rounded-2xl border border-slate-100 shadow-sm ${c.bg} hover:shadow-md transition-all`}>
              <div className={`p-3 rounded-xl ${c.iconBg} ${c.text} w-fit mb-4`}>
                {cat.icon}
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-2">{cat.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{cat.description}</p>
              <span className="text-[10px] font-bold text-slate-400 bg-white/60 px-2 py-1 rounded-lg">
                {cat.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
