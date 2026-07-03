import { supabaseAdmin } from "@/lib/supabase";
import { FileText, Clock, CheckCircle2 } from "lucide-react";
import PoliciesForm from "./PoliciesForm";
import EmptyState from "@/components/EmptyState";

export default async function PerubahanKebijakan() {
  const { data: managers } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, position")
    .or("position.ilike.%Manager%, position.ilike.%Direktur%, position.ilike.%Head%")
    .neq("status", "Resigned")
    .order("full_name")
    .limit(10);

  let policies: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("change_policies")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    policies = data || [];
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Perubahan Kebijakan</h1>
        <p className="text-sm text-gray-500">Kelola log perubahan kebijakan, draft kebijakan baru, dan riwayat versi.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, label: "Kebijakan Aktif", value: policies.filter((p) => p.status === "Aktif").length, color: "bg-blue-50 text-blue-600" },
          { icon: Clock, label: "Draft", value: policies.filter((p) => p.status === "Draft").length, color: "bg-amber-50 text-amber-600" },
          { icon: CheckCircle2, label: "Total", value: policies.length, color: "bg-emerald-50 text-emerald-600" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Kebijakan</h3>
          </div>
          {policies.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum ada perubahan kebijakan."
              description="Gunakan formulir di samping untuk membuat draft kebijakan baru."
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {policies.map((pol) => (
                <div key={pol.id as string} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{pol.title as string} <span className="text-slate-400 font-normal">{pol.version as string}</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{pol.description as string}</p>
                      {!!pol.effective_date && <p className="text-[10px] text-slate-400 mt-1">Efektif: {pol.effective_date as string}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ml-4 ${
                      pol.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}>{(pol.status as string) || "Draft"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <PoliciesForm
          managers={(managers || []) as Array<{ id: string; full_name: string }>}
        />
      </div>
    </div>
  );
}
