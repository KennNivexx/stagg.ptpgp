import { Video, Play, Clock, Filter, Search } from "lucide-react";

export default async function VideoTutorialPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const params = await searchParams;
  const activeCategory = params.category || "Semua";

  const categories = ["Semua", "Onboarding", "Sistem HRIS", "Safety", "Technical"];

  const videos = [
    { id: 1, title: "Selamat Datang di PT Pratama Galuh Perkasa", category: "Onboarding", duration: "12:30", uploadDate: "01 Jun 2026", thumbnail: "bg-gradient-to-br from-blue-500 to-blue-700" },
    { id: 2, title: "Pengenalan Struktur Organisasi Perusahaan", category: "Onboarding", duration: "08:45", uploadDate: "28 Mei 2026", thumbnail: "bg-gradient-to-br from-slate-700 to-slate-900" },
    { id: 3, title: "Cara Menggunakan Portal Karyawan HRIS", category: "Sistem HRIS", duration: "15:20", uploadDate: "25 Mei 2026", thumbnail: "bg-gradient-to-br from-emerald-500 to-emerald-700" },
    { id: 4, title: "Panduan Absensi & Check-in Digital", category: "Sistem HRIS", duration: "10:15", uploadDate: "20 Mei 2026", thumbnail: "bg-gradient-to-br from-purple-500 to-purple-700" },
    { id: 5, title: "Prosedur Keselamatan di Area Gudang", category: "Safety", duration: "18:00", uploadDate: "15 Mei 2026", thumbnail: "bg-gradient-to-br from-red-500 to-red-700" },
    { id: 6, title: "Penggunaan Alat Pemadam Api Ringan", category: "Safety", duration: "09:30", uploadDate: "10 Mei 2026", thumbnail: "bg-gradient-to-br from-orange-500 to-orange-700" },
    { id: 7, title: "Dasar-Dasar Pengoperasian Forklift", category: "Technical", duration: "22:15", uploadDate: "05 Mei 2026", thumbnail: "bg-gradient-to-br from-amber-500 to-amber-700" },
    { id: 8, title: "Prosedur Bongkar Muat Kontainer", category: "Technical", duration: "14:50", uploadDate: "01 Mei 2026", thumbnail: "bg-gradient-to-br from-teal-500 to-teal-700" },
    { id: 9, title: "Cara Submit Pengajuan Cuti Online", category: "Sistem HRIS", duration: "06:40", uploadDate: "28 Apr 2026", thumbnail: "bg-gradient-to-br from-indigo-500 to-indigo-700" },
    { id: 10, title: "Pengenalan Sistem Manajemen Mutu ISO", category: "Onboarding", duration: "20:00", uploadDate: "25 Apr 2026", thumbnail: "bg-gradient-to-br from-cyan-500 to-cyan-700" },
    { id: 11, title: "P3K & Pertolongan Pertama Kecelakaan", category: "Safety", duration: "25:10", uploadDate: "20 Apr 2026", thumbnail: "bg-gradient-to-br from-pink-500 to-pink-700" },
    { id: 12, title: "Manajemen Inventori & Stok Gudang", category: "Technical", duration: "16:30", uploadDate: "15 Apr 2026", thumbnail: "bg-gradient-to-br from-lime-500 to-lime-700" },
  ];

  const filteredVideos = activeCategory === "Semua" ? videos : videos.filter((v) => v.category === activeCategory);

  const categoryColorMap: Record<string, string> = {
    Onboarding: "bg-blue-50 text-blue-700",
    "Sistem HRIS": "bg-purple-50 text-purple-700",
    Safety: "bg-red-50 text-red-700",
    Technical: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Video Tutorial</h1>
        <p className="text-sm text-gray-500">Video pelatihan dan tutorial internal untuk karyawan.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari video tutorial..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          {categories.map((cat) => {
            const href = cat === "Semua" ? "?" : `?category=${encodeURIComponent(cat)}`;
            const active = "px-4 py-2 rounded-xl text-xs font-bold bg-pgp-red text-white shadow-sm";
            const inactive = "px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200";
            return (
              <a
                key={cat}
                href={href}
                className={activeCategory === cat ? active : inactive}
              >
                {cat}
              </a>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredVideos.map((video) => (
          <div key={video.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group cursor-pointer">
            <div className={`h-40 ${video.thumbnail} relative flex items-center justify-center`}>
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all">
                <Play size={22} className="text-slate-800 ml-0.5" fill="currentColor" />
              </div>
              <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white rounded-md text-[9px] font-bold">
                {video.duration}
              </span>
            </div>
            <div className="p-4">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${categoryColorMap[video.category] || "bg-slate-50 text-slate-600"}`}>
                {video.category}
              </span>
              <h3 className="text-xs font-extrabold text-slate-800 mt-2 mb-2 group-hover:text-[#CC0000] transition-colors leading-snug">
                {video.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <Clock size={9} />
                <span>{video.uploadDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
