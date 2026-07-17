import Link from "next/link";
import { getAiRecommendations } from "@/app/actions/employee-relations";
import { Bot, ChevronRight, ShieldAlert, MessageSquareHeart, TrendingUp, Users, Sparkles } from "lucide-react";

const SUB_PAGES = [
  { href: "/hrd/relations/ai/risk-score", label: "Employee Risk Score", icon: ShieldAlert },
  { href: "/hrd/relations/ai/sentiment", label: "Sentiment Analysis", icon: MessageSquareHeart },
  { href: "/hrd/relations/ai/engagement-trend", label: "Engagement Trend", icon: TrendingUp },
  { href: "/hrd/relations/ai/conflict", label: "Conflict Prediction", icon: Users },
  { href: "/hrd/relations/ai/recommendations", label: "AI Recommendations", icon: Sparkles },
];

export default async function AiErEnginePage() {
  const { triggered } = await getAiRecommendations();
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Bot size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">AI ER Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Rekomendasi berbasis aturan (rule-based) yang dievaluasi dari data operasional Employee Relations secara real-time —
            bukan model machine learning terlatih, melainkan ambang batas (threshold) yang dapat dikonfigurasi di AI Recommendation Rule.
          </p>
        </div>
      </div>

      <div className="bg-[#1A2530] rounded-2xl p-6 text-white">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Peringatan Aktif</p>
        <p className="text-4xl font-extrabold">{triggered.length}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SUB_PAGES.map((p) => (
          <Link key={p.href} href={p.href} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-3 hover:shadow-md hover:border-slate-200 transition-all group">
            <div className="p-2.5 bg-red-50 text-pgp-red rounded-xl shrink-0"><p.icon size={18} /></div>
            <span className="text-sm font-bold text-slate-800 flex-1">{p.label}</span>
            <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
