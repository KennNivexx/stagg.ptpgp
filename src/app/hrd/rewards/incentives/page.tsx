import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { Gift, Star, TrendingUp } from "lucide-react";
import IncentivesForm from "./IncentivesForm";

export default async function IncentivesPage() {
  await requireRole("hrd", "superadmin", "director");
  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, department, position, kode_jabatan, nik")
    .limit(100);

  const programs = [
    "Insentif Target Pengiriman",
    "Insentif Kehadiran Sempurna",
    "Insentif Zero Accident",
    "Insentif Efisiensi BBM",
    "Insentif Customer Satisfaction",
  ];

  let payments: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("insentif")
    .select("*, karyawan(full_name, department, position)")
    .eq("type", "incentive")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    payments = data || [];
  }

  const totalAmount = payments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  function fmt(n: number) { return n.toLocaleString("id-ID"); }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Insentif Karyawan</h1>
        <p className="text-sm text-gray-500">Program dan tracking insentif karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Gift, label: "Program Aktif", value: programs.length, color: "bg-blue-50 text-blue-600" },
          { icon: TrendingUp, label: "Total Insentif Dibayar", value: `Rp ${fmt(totalAmount)}`, color: "bg-emerald-50 text-emerald-600" },
          { icon: Star, label: "Penerima Bulan Ini", value: payments.length, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Program Insentif Aktif</h3>
          <p className="text-xs text-slate-400 mt-0.5">Program reward yang tersedia</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {programs.map((prog, i) => (
            <div key={prog} className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Star size={12} /></div>
                <span className="text-xs font-bold text-slate-700">{prog}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Program #{i + 1}</p>
            </div>
          ))}
        </div>
      </div>

      <IncentivesForm
        employees={(employees || []) as Array<{ id: string; full_name: string; department: string; position: string; kode_jabatan?: string | null; nik?: string | null }>}
        payments={payments}
        programs={programs}
      />
    </div>
  );
}
