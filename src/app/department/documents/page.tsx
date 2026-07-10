import { supabaseAdmin } from "@/lib/supabase";
import { BookOpen, FileText, Shield, File, Clipboard, Scale } from "lucide-react";
import { requireRole } from "@/lib/auth-guard";
import EmptyState from "@/components/EmptyState";

export default async function DepartmentDocuments() {
  await requireRole("department_manager", "superadmin");

  const { data, error } = await supabaseAdmin
    .from("dokumen_perusahaan")
    .select("*")
    .eq("visible_to_department_head", true)
    .order("created_at", { ascending: false })
    .limit(100);

  const allDocs: Record<string, unknown>[] = error ? [] : data || [];

  const docsByCategory: Record<string, Record<string, unknown>[]> = {};
  for (const d of allDocs) {
    const cat = (d.category as string) || "Lainnya";
    if (!docsByCategory[cat]) docsByCategory[cat] = [];
    docsByCategory[cat].push(d);
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    "Kontrak": <Clipboard size={16} />,
    "Kebijakan": <Shield size={16} />,
    "Formulir": <File size={16} />,
    "SOP": <BookOpen size={16} />,
    "Legal": <Scale size={16} />,
    "Lainnya": <FileText size={16} />,
  };

  const hasDocs = allDocs.length > 0;
  const categoryNames = Object.keys(docsByCategory);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Dokumen Perusahaan</h1>
        <p className="text-sm text-gray-500">Dokumen kebijakan, SOP, dan referensi yang dibagikan HRD untuk kepala departemen.</p>
      </div>

      {hasDocs ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryNames.map((category) => {
            const docs = docsByCategory[category] || [];
            return (
              <div key={category} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-[#CC0000] rounded-lg">
                    {categoryIcons[category] || <FileText size={16} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{category}</h3>
                    <p className="text-[10px] text-slate-400">{docs.length} dokumen</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {docs.map((d: Record<string, unknown>) => (
                    <div key={d.id as string} className="p-4 hover:bg-slate-50/30 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText size={14} className="text-slate-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{d.title as string}</p>
                          <p className="text-[10px] text-slate-400">
                            {(d.type as string) || "PDF"}
                            {d.created_at ? ` · ${new Date(d.created_at as string).toLocaleDateString("id-ID")}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Belum ada dokumen"
          description="Dokumen yang dibagikan HRD untuk kepala departemen akan muncul di sini."
        />
      )}
    </div>
  );
}
