import { supabaseAdmin } from "@/lib/supabase";
import { FileText, ExternalLink, Calendar, Building2, Plus } from "lucide-react";
import Link from "next/link";

export default async function WorkInstructions() {
  const { data: docs } = await supabaseAdmin
    .from("sop_documents")
    .select("*")
    .order("created_at", { ascending: false });

  const allDocs = (docs || []) as Record<string, unknown>[];

  const byDept: Record<string, number> = {};
  allDocs.forEach((d) => {
    const dept = (d.department as string) || "Umum";
    byDept[dept] = (byDept[dept] || 0) + 1;
  });

  const statusBadge = (s: unknown) => {
    if (s === "Aktif")    return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (s === "Revisi")   return "bg-amber-50 text-amber-700 border border-amber-100";
    if (s === "Arsip")    return "bg-slate-100 text-slate-500 border border-slate-200";
    return "bg-slate-100 text-slate-500";
  };

  const formatDate = (d: unknown) =>
    d ? new Date(d as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Work Instructions</h1>
          <p className="text-sm text-gray-500">Dokumen instruksi kerja, prosedur teknis, dan panduan operasional</p>
        </div>
        <Link href="/hrd/knowledge/sop"
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Tambah Dokumen
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Dokumen", value: allDocs.length, color: "bg-blue-50 text-blue-600" },
          { label: "Aktif",         value: allDocs.filter(d => d.status === "Aktif").length,  color: "bg-emerald-50 text-emerald-600" },
          { label: "Revisi",        value: allDocs.filter(d => d.status === "Revisi").length, color: "bg-amber-50 text-amber-600" },
          { label: "Departemen",    value: Object.keys(byDept).length, color: "bg-purple-50 text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><FileText size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {Object.keys(byDept).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4">Sebaran per Departemen</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byDept).sort((a,b) => b[1]-a[1]).map(([dept, count]) => (
              <span key={dept} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                <Building2 size={11} className="text-slate-400" />
                {dept}
                <span className="ml-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Instruksi Kerja & SOP</h3>
          <p className="text-xs text-slate-400 mt-0.5">Semua dokumen prosedur dan instruksi kerja yang terdaftar</p>
        </div>

        {allDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada dokumen instruksi kerja.</p>
            <p className="text-xs text-slate-400 mt-1">Tambahkan dokumen melalui menu Kelola SOP.</p>
            <Link href="/hrd/knowledge/sop"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              <Plus size={12} /> Tambah Dokumen
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {allDocs.map((doc) => (
              <div key={doc.id as string} className="px-6 py-4 hover:bg-slate-50/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-slate-400 font-mono">{doc.number as string}</span>
                        {(doc.version as string) && (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold">{doc.version as string}</span>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 text-sm truncate">{doc.title as string}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                        {(doc.department as string) && (
                          <span className="flex items-center gap-1">
                            <Building2 size={10} /> {doc.department as string}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(doc.created_at)}
                        </span>
                      </div>
                      {(doc.description as string) && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{doc.description as string}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statusBadge(doc.status)}`}>
                      {doc.status as string || "Aktif"}
                    </span>
                    {doc.document_url ? (
                      <a href={doc.document_url as string} target="_blank" rel="noopener noreferrer"
                        className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors border border-slate-100"
                        title="Buka dokumen">
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="p-2 bg-slate-50 text-slate-200 rounded-lg border border-slate-100 cursor-not-allowed" title="Belum ada link dokumen">
                        <ExternalLink size={13} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {allDocs.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Total <strong className="text-slate-800">{allDocs.length}</strong> dokumen
            </p>
            <Link href="/hrd/knowledge/sop" className="text-xs font-bold text-[#CC0000] hover:underline">
              Kelola SOP & Instruksi →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
