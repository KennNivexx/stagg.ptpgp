import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Eye, Play } from "lucide-react";
import { getVideoById, getVideos } from "@/app/actions/knowledge";
import { toEmbedUrl } from "@/lib/video-embed";

export const dynamic = "force-dynamic";

const categoryColorMap: Record<string, string> = {
  Onboarding: "bg-blue-50 text-blue-700",
  "Sistem HRIS": "bg-purple-50 text-purple-700",
  Safety: "bg-red-50 text-red-700",
  Technical: "bg-amber-50 text-amber-700",
  Lainnya: "bg-slate-100 text-slate-700",
};

const gradients = [
  "from-blue-500 to-blue-700", "from-slate-700 to-slate-900", "from-emerald-500 to-emerald-700",
  "from-purple-500 to-purple-700", "from-red-500 to-red-700", "from-orange-500 to-orange-700",
  "from-amber-500 to-amber-700", "from-teal-500 to-teal-700", "from-indigo-500 to-indigo-700",
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return gradients[hash % gradients.length];
}

export default async function WatchVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [video, allVideos] = await Promise.all([getVideoById(id), getVideos()]);
  if (!video) notFound();

  const embed = toEmbedUrl(video.video_url as string);
  const category = (video.category as string) || "Lainnya";
  const related = allVideos.filter((v) => v.id !== id);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link href="/hrd/knowledge/videos" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#CC0000] transition-colors">
        <ArrowLeft size={14} /> Kembali ke Video Tutorial
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-black rounded-2xl overflow-hidden shadow-sm aspect-video">
            {embed.type === "youtube" ? (
              <iframe
                src={embed.src}
                title={video.title as string}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={embed.src} controls className="w-full h-full" />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${categoryColorMap[category] || "bg-slate-50 text-slate-600"}`}>{category}</span>
            <h1 className="text-xl font-extrabold text-[#1A2530] mt-3 mb-2">{video.title as string}</h1>
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 pb-4 border-b border-slate-100">
              <span className="flex items-center gap-1"><Eye size={12} /> {Number(video.views) || 0}x ditonton</span>
              {(video.duration as string) && <span className="flex items-center gap-1"><Clock size={12} /> {video.duration as string}</span>}
              <span>{video.created_at ? new Date(video.created_at as string).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</span>
            </div>
            {(video.description as string) && (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{video.description as string}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-800 text-sm px-1">Video Lainnya</h3>
          {related.length === 0 ? (
            <p className="text-xs text-slate-400 px-1">Belum ada video lain.</p>
          ) : (
            related.map((v) => (
              <Link key={v.id as string} href={`/hrd/knowledge/videos/${v.id}`}
                className="flex gap-3 bg-white rounded-xl border border-slate-100 shadow-sm p-2 hover:shadow-md transition-all group">
                <div className={`w-32 h-20 shrink-0 rounded-lg bg-gradient-to-br ${gradientFor(v.id as string)} relative flex items-center justify-center`}>
                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                    <Play size={12} className="text-slate-800 ml-0.5" fill="currentColor" />
                  </div>
                  {(v.duration as string) && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[8px] font-bold">{v.duration as string}</span>
                  )}
                </div>
                <div className="min-w-0 py-1">
                  <p className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-[#CC0000] transition-colors">{v.title as string}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{Number(v.views) || 0}x ditonton</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
