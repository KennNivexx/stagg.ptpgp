import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Eye, User } from "lucide-react";
import { getArticleById } from "@/app/actions/knowledge";

export const dynamic = "force-dynamic";

const categoryColorMap: Record<string, string> = {
  "HR & Kepegawaian": "bg-blue-50 text-blue-700",
  "Keuangan": "bg-emerald-50 text-emerald-700",
  "Operasional": "bg-amber-50 text-amber-700",
  "IT & Sistem": "bg-purple-50 text-purple-700",
  "HSE": "bg-red-50 text-red-700",
  "Umum": "bg-slate-100 text-slate-700",
};

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  const category = (article.category as string) || "Umum";

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/hrd/knowledge/base" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#CC0000] transition-colors">
        <ArrowLeft size={14} /> Kembali ke Basis Pengetahuan
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${categoryColorMap[category] || "bg-slate-50 text-slate-600"}`}>{category}</span>
        <h1 className="text-2xl font-extrabold text-[#1A2530] mt-4 mb-4">{article.title as string}</h1>
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 pb-6 border-b border-slate-100">
          <span className="flex items-center gap-1"><User size={12} /> {(article.author as string) || "-"}</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {article.created_at ? new Date(article.created_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</span>
          <span className="flex items-center gap-1"><Eye size={12} /> {Number(article.views) || 0} kali dilihat</span>
        </div>
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{article.content as string}</div>
      </div>
    </div>
  );
}
