import { supabaseAdmin } from "@/lib/supabase";
import { BookOpen, FileText, FolderOpen, Video, ChevronRight, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import Link from "next/link";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";

export default async function HRDKnowledge() {
  const today = new Date().toISOString().slice(0, 10);

  const [sopRes, policyRes, articleRes, videoRes] = await Promise.all([
    supabaseAdmin.from("dokumen_sop").select("id, status, mandatory, expiry_date"),
    supabaseAdmin.from("kebijakan_perusahaan").select("id, status, mandatory, expiry_date"),
    supabaseAdmin.from("artikel_pengetahuan").select("id, status, mandatory, expiry_date"),
    supabaseAdmin.from("video_pelatihan").select("id, status, mandatory, expiry_date"),
  ]);

  const all = [
    ...(sopRes.data || []), ...(policyRes.data || []), ...(articleRes.data || []), ...(videoRes.data || []),
  ] as { id: string; status?: string; mandatory?: boolean; expiry_date?: string | null }[];

  const publishedCount = all.filter(r => (r.status || "").toLowerCase() !== "draft" && (r.status || "").toLowerCase() !== "archived").length;
  const mandatoryCount = all.filter(r => r.mandatory).length;
  const expiredCount = all.filter(r => r.expiry_date && r.expiry_date < today).length;

  // Label & link per kategori diperbaiki supaya cocok dengan tabel yang
  // sebenarnya di-link — sebelumnya "Buku Panduan" mengarah ke /policies
  // (kebijakan_perusahaan) dan "Best Practices" ke /videos (video_pelatihan),
  // membingungkan karena isinya tidak sesuai judul kartu.
  const categories = [
    { icon: <FileText size={18} />, title: "SOP", description: "Standard Operating Procedures dan instruksi kerja.", count: sopRes.data?.length ?? 0, color: "blue", href: "/hrd/knowledge/sop" },
    { icon: <FolderOpen size={18} />, title: "Kebijakan Perusahaan", description: "Kebijakan resmi dan aturan internal perusahaan.", count: policyRes.data?.length ?? 0, color: "emerald", href: "/hrd/knowledge/policies" },
    { icon: <BookOpen size={18} />, title: "Basis Pengetahuan", description: "Artikel, best practice, dan lessons learned.", count: articleRes.data?.length ?? 0, color: "amber", href: "/hrd/knowledge/base" },
    { icon: <Video size={18} />, title: "Video Tutorial", description: "Video pelatihan dan panduan visual.", count: videoRes.data?.length ?? 0, color: "purple", href: "/hrd/knowledge/videos" },
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
          <p className="text-sm text-gray-500">Basis pengetahuan dipetakan ke kompetensi jabatan — begitu karyawan ditempatkan, materi relevan otomatis muncul di Employee 360°.</p>
        </div>
        <Link href="/hrd/knowledge/mapping"
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          Mapping Kompetensi
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Published</p><p className="text-xl font-extrabold text-slate-800">{publishedCount}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><ShieldAlert size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Mandatory</p><p className="text-xl font-extrabold text-slate-800">{mandatoryCount}</p></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Kedaluwarsa</p><p className="text-xl font-extrabold text-slate-800">{expiredCount}</p></div>
          </div>
        </div>
      </div>

      <SectionQuickLinks groupLabel="Knowledge Management" excludeHref="/hrd/knowledge" />

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
                  {cat.count} dokumen
                </span>
                <ChevronRight size={14} className={`${c.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
