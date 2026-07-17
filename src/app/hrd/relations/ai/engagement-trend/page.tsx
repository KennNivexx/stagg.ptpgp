import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import TrendArea from "@/components/charts/TrendArea";
import { TrendingUp } from "lucide-react";

export default async function EngagementTrendPage() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("participation_entries")
    .select("score, created_at")
    .eq("participation_type", "Satisfaction Survey")
    .not("score", "is", null)
    .order("created_at");
  const rows = (data || []) as { score: number; created_at: string }[];

  const byMonth: Record<string, number[]> = {};
  rows.forEach((r) => {
    const d = new Date(r.created_at);
    const key = d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(r.score);
  });
  const chartData = Object.entries(byMonth).map(([label, scores]) => ({
    label, value: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <TrendingUp size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Engagement Trend</h1>
          <p className="text-sm text-slate-500 mt-1">Tren rata-rata skor Satisfaction Survey dari waktu ke waktu.</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {chartData.length < 2 ? (
          <p className="text-sm text-slate-400 text-center py-12">Data historis belum cukup untuk menampilkan tren (butuh survei di lebih dari satu periode).</p>
        ) : (
          <TrendArea data={chartData} xKey="label" series={[{ key: "value", label: "Rata-rata Skor" }]} height={260} />
        )}
      </div>
    </div>
  );
}
