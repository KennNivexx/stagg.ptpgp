import { Database, Search, BookOpen, TrendingUp, Eye, Clock, User } from "lucide-react";

export default async function KnowledgeBasePage() {
  const categories = ["Semua", "HR & Kepegawaian", "Keuangan", "Operasional", "IT & Sistem", "HSE", "Umum"];

  const articles = [
    { id: 1, title: "Panduan Penggunaan HRIS untuk Karyawan Baru", category: "IT & Sistem", author: "Tim IT", date: "05 Jun 2026", views: 245, popular: true },
    { id: 2, title: "Cara Mengajukan Cuti Melalui Sistem", category: "HR & Kepegawaian", author: "HRD", date: "01 Jun 2026", views: 189, popular: true },
    { id: 3, title: "Prosedur Klaim Biaya Perjalanan Dinas", category: "Keuangan", author: "Finance", date: "28 Mei 2026", views: 156, popular: true },
    { id: 4, title: "Panduan Keselamatan Kerja di Lapangan", category: "HSE", author: "HSE Dept", date: "25 Mei 2026", views: 412, popular: true },
    { id: 5, title: "Tata Cara Pengajuan Lembur", category: "HR & Kepegawaian", author: "HRD", date: "20 Mei 2026", views: 134, popular: false },
    { id: 6, title: "Panduan Pengadaan Barang Operasional", category: "Operasional", author: "Procurement", date: "18 Mei 2026", views: 98, popular: false },
    { id: 7, title: "Cara Reset Password & Akses Sistem", category: "IT & Sistem", author: "Tim IT", date: "15 Mei 2026", views: 312, popular: true },
    { id: 8, title: "Kebijakan Work From Home (WFH)", category: "HR & Kepegawaian", author: "HRD", date: "10 Mei 2026", views: 276, popular: false },
    { id: 9, title: "Prosedur Pelaporan Insiden K3", category: "HSE", author: "HSE Dept", date: "05 Mei 2026", views: 87, popular: false },
  ];

  const categoryColorMap: Record<string, string> = {
    "HR & Kepegawaian": "bg-blue-50 text-blue-700",
    "Keuangan": "bg-emerald-50 text-emerald-700",
    "Operasional": "bg-amber-50 text-amber-700",
    "IT & Sistem": "bg-purple-50 text-purple-700",
    "HSE": "bg-red-50 text-red-700",
    "Umum": "bg-slate-100 text-slate-700",
  };

  const popularArticles = articles.filter((a) => a.popular).slice(0, 4);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Basis Pengetahuan</h1>
        <p className="text-sm text-gray-500">Pusat informasi, panduan, dan dokumentasi internal perusahaan.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-xl">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari artikel, panduan, atau dokumentasi..."
            className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              cat === "Semua"
                ? "bg-[#CC0000] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-[#CC0000]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-[#CC0000]" />
          Artikel Populer
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularArticles.map((article) => (
            <div key={article.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
                  <BookOpen size={18} />
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${categoryColorMap[article.category] || "bg-slate-50 text-slate-600"}`}>
                  {article.category}
                </span>
              </div>
              <h3 className="text-xs font-extrabold text-slate-800 mb-2 group-hover:text-[#CC0000] transition-colors leading-snug">
                {article.title}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-3 border-t border-slate-50">
                <span className="flex items-center gap-1"><User size={9} /> {article.author}</span>
                <span className="flex items-center gap-1"><Eye size={9} /> {article.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Database size={18} className="text-[#CC0000]" />
          Semua Artikel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${categoryColorMap[article.category] || "bg-slate-50 text-slate-600"}`}>
                  {article.category}
                </span>
                {article.popular && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[9px] font-bold flex items-center gap-1">
                    <TrendingUp size={9} /> Populer
                  </span>
                )}
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 mb-2 group-hover:text-[#CC0000] transition-colors">
                {article.title}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><User size={9} /> {article.author}</span>
                <span className="flex items-center gap-1"><Clock size={9} /> {article.date}</span>
                <span className="flex items-center gap-1"><Eye size={9} /> {article.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
