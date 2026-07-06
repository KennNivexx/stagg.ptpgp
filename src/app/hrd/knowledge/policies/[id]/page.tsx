import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Shield, User } from "lucide-react";
import { getPolicyById } from "@/app/actions/knowledge";

export const dynamic = "force-dynamic";

const categoryColorMap: Record<string, string> = {
  Kepegawaian: "bg-blue-50 text-blue-700",
  Keuangan: "bg-emerald-50 text-emerald-700",
  Operasional: "bg-amber-50 text-amber-700",
  IT: "bg-purple-50 text-purple-700",
  HSE: "bg-red-50 text-red-700",
  Lainnya: "bg-slate-100 text-slate-700",
};

export default async function PolicyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const policy = await getPolicyById(id);
  if (!policy) notFound();

  const category = (policy.category as string) || "Umum";

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/hrd/knowledge/policies" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#CC0000] transition-colors">
        <ArrowLeft size={14} /> Kembali ke Kebijakan Perusahaan
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${categoryColorMap[category] || "bg-slate-50 text-slate-600"}`}>{category}</span>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-600 flex items-center gap-1"><Shield size={10} /> {(policy.revision as string) || "Rev. 1"}</span>
        </div>
        <h1 className="text-2xl font-extrabold text-[#1A2530] mb-4">{policy.title as string}</h1>
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-6 pb-6 border-b border-slate-100">
          {(policy.effective_date as string) && (
            <span className="flex items-center gap-1"><Calendar size={12} /> Berlaku sejak {new Date(policy.effective_date as string).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
          )}
          {(policy.created_by as string) && (
            <span className="flex items-center gap-1"><User size={12} /> {policy.created_by as string}</span>
          )}
        </div>
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{policy.content as string}</div>
      </div>
    </div>
  );
}
