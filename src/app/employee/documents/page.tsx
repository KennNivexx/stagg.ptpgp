import { supabaseAdmin } from "@/lib/supabase";
import { BookOpen, FileText, Download, Shield, File, Clipboard } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import EmptyState from "@/components/EmptyState";

export default async function EmployeeDocuments() {
  let userEmail: string;
  try {
    const auth = await requireAuth();
    userEmail = auth.email;
  } catch {
    redirect("/login");
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position")
    .eq("email", userEmail)
    .limit(1)
    .single();

  let allDocs: Record<string, unknown>[] = [];
  if (employee?.id) {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("visible_to_employee", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error && !error.message.includes("Could not find the table")) {
      allDocs = [];
    } else {
      allDocs = data || [];
    }
  }

  // Group documents by category
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
    "Lainnya": <FileText size={16} />,
  };

  const hasDocs = allDocs.length > 0;
  const categoryNames = Object.keys(docsByCategory).length > 0
    ? Object.keys(docsByCategory)
    : ["Kontrak", "Kebijakan", "Formulir", "SOP"];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Dokumen & SOP</h1>
        <p className="text-sm text-gray-500">Dokumen perusahaan, kontrak, kebijakan, dan SOP yang relevan untuk Anda.</p>
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
                          {(d.type as string) || "PDF"} · {(d.size as string) || "-"}
                          {d.created_at ? ` · ${new Date(d.created_at as string).toLocaleDateString("id-ID")}` : ""}
                        </p>
                      </div>
                    </div>
                    {d.url ? (
                      <a href={d.url as string} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#CC0000] transition-colors shrink-0" download>
                        <Download size={14} />
                      </a>
                    ) : (
                      <span className="p-2 text-slate-300 shrink-0">
                        <Download size={14} />
                      </span>
                    )}
                  </div>
                ))}
                {docs.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Belum ada dokumen di kategori ini.
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Belum ada dokumen"
          description="Dokumen perusahaan, SOP, kontrak kerja, dan kebijakan akan muncul di sini setelah diunggah oleh HRD."
        />
      )}
    </div>
  );
}
