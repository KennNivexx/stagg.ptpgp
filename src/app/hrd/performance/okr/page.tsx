import { supabaseAdmin } from "@/lib/supabase";
import { Target, TrendingUp, Building } from "lucide-react";
import OkrForm from "./OkrForm";

export default async function OKRPage() {
  const [{ data: employees }, { data: okrRaw }] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, department").limit(100),
    (async () => {
      const { data, error } = await supabaseAdmin
        .from("okr")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error && (error as unknown as Record<string, unknown>)?.code === "42P01") return { data: [], error: null };
      return { data, error };
    })(),
  ]);

  const okrData = (okrRaw || []) as Array<Record<string, unknown>>;
  const avgProgress = okrData.length > 0
    ? Math.round(okrData.reduce((s, o) => s + (Number(o.progress) || 0), 0) / okrData.length)
    : 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">OKR - Objectives & Key Results</h1>
        <p className="text-sm text-gray-500">Kelola objective dan key results untuk setiap departemen.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Target, label: "Total OKR", value: okrData.length, color: "bg-blue-50 text-blue-600" },
          { icon: TrendingUp, label: "Rata-rata Progress", value: `${avgProgress}%`, color: "bg-emerald-50 text-emerald-600" },
          { icon: Building, label: "Dept Terlibat", value: new Set(okrData.map((o) => o.department as string)).size, color: "bg-purple-50 text-purple-600" },
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

      <OkrForm
        employees={(employees || []) as Array<{ id: string; full_name: string; department: string }>}
        okrData={okrData}
      />
    </div>
  );
}
