import { supabaseAdmin } from "@/lib/supabase";
import { RefreshCw, TrendingUp, Clock, CheckCircle2, Target } from "lucide-react";
import InitiativesForm from "./InitiativesForm";
import EmptyState from "@/components/EmptyState";

export default async function InisiatifPerubahan() {
  const { data: managers } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, position")
    .or("position.ilike.%Manager%, position.ilike.%Direktur%, position.ilike.%Head%")
    .neq("status", "Resigned")
    .order("full_name")
    .limit(10);

  let initiatives: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("change_initiatives")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    initiatives = data || [];
  }

  const statuses = ["Perencanaan", "Berjalan", "Tertunda", "Selesai"];

  const countByStatus = (s: string) => initiatives.filter((i) => i.status === s).length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Inisiatif Perubahan</h1>
        <p className="text-sm text-gray-500">Kelola inisiatif perubahan organisasi, lacak progres, dan kelola timeline.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Target size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Inisiatif</p>
              <p className="text-xl font-extrabold text-slate-800">{initiatives.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Berjalan</p>
              <p className="text-xl font-extrabold text-slate-800">{countByStatus("Berjalan")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tertunda</p>
              <p className="text-xl font-extrabold text-slate-800">{countByStatus("Tertunda")}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Selesai</p>
              <p className="text-xl font-extrabold text-slate-800">{countByStatus("Selesai")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Inisiatif Perubahan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Proyek perubahan organisasi</p>
          </div>
          {initiatives.length === 0 ? (
            <EmptyState
              icon={RefreshCw}
              title="Belum ada inisiatif perubahan."
              description="Gunakan formulir di samping untuk menambahkan inisiatif baru."
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {initiatives.map((ini) => (
                <div key={ini.id as string} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{ini.title as string}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{ini.description as string}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ml-4 ${
                      ini.status === "Berjalan" ? "bg-emerald-50 text-emerald-700" :
                      ini.status === "Selesai" ? "bg-blue-50 text-blue-700" :
                      ini.status === "Tertunda" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-50 text-slate-700"
                    }`}>{ini.status as string}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <InitiativesForm
          managers={(managers || []) as Array<{ id: string; full_name: string; position: string }>}
          statuses={statuses}
        />
      </div>
    </div>
  );
}
