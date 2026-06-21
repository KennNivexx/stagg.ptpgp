import { supabaseAdmin } from "@/lib/supabase";
import { BookOpen, FileText, Building } from "lucide-react";
import SopClient from "./SopClient";

export default async function SOPPage() {
  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const categories = (departments || []).map((d: Record<string, unknown>) => d.name as string).filter(Boolean);

  let sops: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("sop_documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    sops = data || [];
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Standard Operating Procedure</h1>
        <p className="text-sm text-gray-500">Dokumen SOP dan prosedur kerja perusahaan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "Total SOP", value: sops.length, color: "bg-blue-50 text-blue-600" },
          { icon: FileText, label: "Kategori", value: categories.length, color: "bg-emerald-50 text-emerald-600" },
          { icon: Building, label: "Departemen", value: new Set(sops.map((s) => s.department)).size, color: "bg-purple-50 text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SopClient initialSops={sops} categories={categories} />
    </div>
  );
}
