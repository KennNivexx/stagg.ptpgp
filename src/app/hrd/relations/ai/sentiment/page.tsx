import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { MessageSquareHeart } from "lucide-react";

/** "Sentiment" here is honestly a proxy derived from real numeric scores on
 * Feedback/Voice of Employee/Satisfaction entries — not NLP text-sentiment
 * analysis (this app has no such model). Framed transparently as such. */
export default async function SentimentAnalysisPage() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("participation_entries")
    .select("participation_type, score, status, title, created_at")
    .in("participation_type", ["Feedback", "Voice of Employee", "Satisfaction Survey"])
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = (data || []) as { participation_type: string; score: number | null; status: string; title: string; created_at: string }[];
  const scored = rows.filter((r) => r.score != null);
  const avg = scored.length > 0 ? Math.round((scored.reduce((a, b) => a + (b.score || 0), 0) / scored.length) * 10) / 10 : 0;
  const tone = avg >= 75 ? "Positif" : avg >= 50 ? "Netral" : "Perlu Perhatian";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center gap-2">
        <MessageSquareHeart size={18} className="text-pgp-red" />
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Sentiment Analysis</h1>
          <p className="text-sm text-slate-500 mt-1">Dihitung dari skor Feedback, Voice of Employee, dan Satisfaction Survey — indikator proksi, bukan analisis teks NLP.</p>
        </div>
      </div>
      <div className="bg-[#1A2530] rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Skor Rata-rata</p>
          <p className="text-4xl font-extrabold">{avg}</p>
        </div>
        <span className="text-sm font-bold px-3 py-1.5 rounded-full bg-white/10">{tone}</span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <ul className="divide-y divide-slate-50">
          {rows.length === 0 ? (
            <li className="p-6 text-sm text-slate-400 text-center">Belum ada data.</li>
          ) : rows.map((r, i) => (
            <li key={i} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">{r.title}</p>
                <p className="text-[10px] text-slate-400">{r.participation_type}</p>
              </div>
              {r.score != null && <span className="text-sm font-extrabold text-slate-800">{r.score}</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
