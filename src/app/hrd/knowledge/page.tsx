import { supabaseAdmin } from "@/lib/supabase";
import { BookOpen, FileText, FolderOpen, Tag, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function HRDKnowledge() {
  const { count: sopCount } = await supabaseAdmin
    .from("dokumen_sop")
    .select("*", { count: "exact", head: true });

  const categories = [
    {
      icon: <FileText size={18} />,
      title: "SOP & Kebijakan",
      description: "Standard Operating Procedures dan kebijakan internal perusahaan.",
      count: sopCount ?? 0,
      color: "blue",
      href: "/hrd/knowledge/sop",
    },
    {
      icon: <FolderOpen size={18} />,
      title: "Dokumen HR",
      description: "Template kontrak, form pengajuan, surat keputusan, dan dokumen kepegawaian.",
      count: null,
      color: "emerald",
      href: "/hrd/knowledge/base",
    },
    {
      icon: <BookOpen size={18} />,
      title: "Buku Panduan",
      description: "Panduan karyawan, buku saku kebijakan, dan manual operasional organisasi.",
      count: null,
      color: "amber",
      href: "/hrd/knowledge/policies",
    },
    {
      icon: <Tag size={18} />,
      title: "Best Practices",
      description: "Kumpulan praktik terbaik, studi kasus, dan lessons learned dari berbagai proyek.",
      count: null,
      color: "purple",
      href: "/hrd/knowledge/videos",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string; hover: string }> = {
    blue:    { bg: "bg-blue-50/60",    text: "text-blue-600",    iconBg: "bg-blue-100",    hover: "hover:border-blue-200" },
    emerald: { bg: "bg-emerald-50/60", text: "text-emerald-600", iconBg: "bg-emerald-100", hover: "hover:border-emerald-200" },
    amber:   { bg: "bg-amber-50/60",   text: "text-amber-600",   iconBg: "bg-amber-100",   hover: "hover:border-amber-200" },
    purple:  { bg: "bg-purple-50/60",  text: "text-purple-600",  iconBg: "bg-purple-100",  hover: "hover:border-purple-200" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Knowledge Management</h1>
          <p className="text-sm text-gray-500">Basis pengetahuan dan dokumentasi organisasi</p>
        </div>
        <Link href="/hrd/knowledge/sop"
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <FileText size={14} /> Kelola SOP
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const c = colorClasses[cat.color] || colorClasses.blue;
          return (
            <Link key={cat.title} href={cat.href}
              className={`p-6 rounded-2xl border border-slate-100 shadow-sm ${c.bg} ${c.hover} hover:shadow-md transition-all group`}>
              <div className={`p-3 rounded-xl ${c.iconBg} ${c.text} w-fit mb-4`}>
                {cat.icon}
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-2">{cat.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">{cat.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 bg-white/60 px-2 py-1 rounded-lg">
                  {cat.count !== null ? `${cat.count} dokumen` : "Lihat dokumen"}
                </span>
                <ChevronRight size={14} className={`${c.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start gap-3">
        <BookOpen size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Tips: Tambah dokumen SOP</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Untuk menambah SOP baru, masuk ke menu <strong>SOP &amp; Kebijakan</strong> → Tambah SOP. Isi nomor, judul, kategori, dan tautkan URL dokumen dari Google Drive / SharePoint.
          </p>
        </div>
      </div>
    </div>
  );
}
