"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video, Play, Clock, Search, Plus, Eye } from "lucide-react";
import { saveVideo } from "@/app/actions/knowledge";
import EmptyState from "@/components/EmptyState";
import VideoUploadField from "@/components/VideoUploadField";

type VideoRow = Record<string, unknown>;

const CATEGORIES = ["Onboarding", "Sistem HRIS", "Safety", "Technical", "Lainnya"];

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

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function VideosClient({ initialVideos }: { initialVideos: VideoRow[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  async function handleSave() {
    if (!formRef.current) return;
    if (!videoUrl.trim()) { setMsg({ type: "error", text: "Tempel link video atau unggah file video terlebih dahulu." }); return; }
    setLoading(true); setMsg(null);
    const result = await saveVideo(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Video berhasil ditambahkan!" });
    formRef.current.reset();
    setVideoUrl("");
    setShowForm(false);
    router.refresh();
  }

  const filtered = initialVideos.filter((v) => {
    const matchCat = activeCategory === "Semua" || v.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || (v.title as string || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Cari video tutorial..."
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {["Semua", ...CATEGORIES].map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${activeCategory === cat ? "bg-pgp-red text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 shrink-0">
          <Plus size={14} /> {showForm ? "Tutup Form" : "Unggah Video"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Video Tutorial</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tempel link YouTube atau URL file video (mp4).</p>
          </div>
          <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Judul Video</label>
              <input name="title" type="text" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Judul video tutorial..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
              <select name="category" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Durasi (opsional)</label>
              <input name="duration" type="text" placeholder="mis. 12:30" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="md:col-span-2">
              <input type="hidden" name="video_url" value={videoUrl} />
              <VideoUploadField
                label="Video"
                value={videoUrl}
                onChange={setVideoUrl}
                folder="videos"
                placeholder="https://www.youtube.com/watch?v=... atau https://.../video.mp4"
                hint="Tempel link YouTube/video, atau unggah file video langsung dari perangkat (maks. 200MB)."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Deskripsi (opsional)</label>
              <textarea name="description" rows={3} className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Deskripsi singkat video..." />
            </div>
            <div className="md:col-span-2">
              <Msg m={msg} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => { setShowForm(false); setVideoUrl(""); }} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan Video"}
              </button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Video} title={initialVideos.length === 0 ? "Belum ada video tutorial." : "Tidak ada hasil yang cocok."} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((video) => (
            <Link key={video.id as string} href={`/hrd/knowledge/videos/${video.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group cursor-pointer block">
              <div className={`h-40 bg-gradient-to-br ${gradientFor(video.id as string)} relative flex items-center justify-center`}>
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all">
                  <Play size={22} className="text-slate-800 ml-0.5" fill="currentColor" />
                </div>
                {(video.duration as string) && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white rounded-md text-[9px] font-bold">
                    {video.duration as string}
                  </span>
                )}
              </div>
              <div className="p-4">
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${categoryColorMap[video.category as string] || "bg-slate-50 text-slate-600"}`}>
                  {(video.category as string) || "Lainnya"}
                </span>
                <h3 className="text-xs font-extrabold text-slate-800 mt-2 mb-2 group-hover:text-[#CC0000] transition-colors leading-snug line-clamp-2">
                  {video.title as string}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><Eye size={9} /> {Number(video.views) || 0}x ditonton</span>
                  <span className="flex items-center gap-1"><Clock size={9} /> {video.created_at ? new Date(video.created_at as string).toLocaleDateString("id-ID") : "-"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
