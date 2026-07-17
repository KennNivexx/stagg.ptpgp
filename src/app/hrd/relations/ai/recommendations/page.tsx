import { getAiRecommendations } from "@/app/actions/employee-relations";
import { Sparkles, ShieldAlert } from "lucide-react";

export default async function AiRecommendationsPage() {
  const { triggered, metrics } = await getAiRecommendations();

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">AI Recommendations</h1>
          <p className="text-sm text-slate-500 mt-1">Rekomendasi otomatis dari aturan AI ER Engine yang aktif terpicu terhadap metrik real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-extrabold text-slate-800">{metrics.turnoverPct}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Turnover Rate</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-extrabold text-slate-800">{metrics.overdueCases}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Kasus Terlambat</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-extrabold text-slate-800">{metrics.engagementIndex}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Engagement Index</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xl font-extrabold text-slate-800">{metrics.enps}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">eNPS</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-slate-800 mb-4">Rekomendasi Aktif</h3>
        {triggered.length === 0 ? (
          <p className="text-xs text-slate-400">Tidak ada rekomendasi aktif — seluruh metrik dalam ambang batas normal.</p>
        ) : (
          <ul className="space-y-3">
            {triggered.map((t) => (
              <li key={t.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <ShieldAlert size={16} className="text-pgp-red shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{t.recommendation_text}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
