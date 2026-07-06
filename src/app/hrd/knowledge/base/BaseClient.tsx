"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Database, Search, BookOpen, TrendingUp, Eye, Clock, User, Plus } from "lucide-react";
import { saveArticle } from "@/app/actions/knowledge";
import EmptyState from "@/components/EmptyState";

type Article = Record<string, unknown>;

const CATEGORIES = ["HR & Kepegawaian", "Keuangan", "Operasional", "IT & Sistem", "HSE", "Umum"];

const categoryColorMap: Record<string, string> = {
  "HR & Kepegawaian": "bg-blue-50 text-blue-700",
  "Keuangan": "bg-emerald-50 text-emerald-700",
  "Operasional": "bg-amber-50 text-amber-700",
  "IT & Sistem": "bg-purple-50 text-purple-700",
  "HSE": "bg-red-50 text-red-700",
  "Umum": "bg-slate-100 text-slate-700",
};

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function BaseClient({ initialArticles }: { initialArticles: Article[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleSave() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await saveArticle(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Artikel berhasil disimpan!" });
    formRef.current.reset();
    setShowForm(false);
    router.refresh();
  }

  const filtered = initialArticles.filter((a) => {
    const matchCat = activeCategory === "Semua" || a.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || (a.title as string || "").toLowerCase().includes(q) || (a.content as string || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const popular = [...initialArticles].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, 4);

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-xl w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Cari artikel, panduan, atau dokumentasi..."
            className="w-full pl-11 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 shrink-0">
          <Plus size={14} /> {showForm ? "Tutup Form" : "Tambah Artikel"}
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {["Semua", ...CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${activeCategory === cat ? "bg-pgp-red text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Artikel Baru</h3>
          </div>
          <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Judul Artikel</label>
              <input name="title" type="text" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Judul artikel atau panduan..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
              <select name="category" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Isi Artikel</label>
              <textarea name="content" rows={8} className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Tuliskan isi artikel, panduan, atau dokumentasi..." />
            </div>
            <div className="md:col-span-2">
              <Msg m={msg} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan Artikel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {popular.length > 0 && activeCategory === "Semua" && !search && (
        <div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#CC0000]" />
            Artikel Populer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {popular.map((article) => (
              <Link key={article.id as string} href={`/hrd/knowledge/base/${article.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group block">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl"><BookOpen size={18} /></div>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${categoryColorMap[article.category as string] || "bg-slate-50 text-slate-600"}`}>
                    {(article.category as string) || "Umum"}
                  </span>
                </div>
                <h3 className="text-xs font-extrabold text-slate-800 mb-2 group-hover:text-[#CC0000] transition-colors leading-snug line-clamp-2">
                  {article.title as string}
                </h3>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-3 border-t border-slate-50">
                  <span className="flex items-center gap-1"><User size={9} /> {(article.author as string) || "-"}</span>
                  <span className="flex items-center gap-1"><Eye size={9} /> {Number(article.views) || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Database size={18} className="text-[#CC0000]" />
          Semua Artikel
        </h2>
        {filtered.length === 0 ? (
          <EmptyState icon={Database} title={initialArticles.length === 0 ? "Belum ada artikel." : "Tidak ada hasil yang cocok."} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((article) => (
              <Link key={article.id as string} href={`/hrd/knowledge/base/${article.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group block">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${categoryColorMap[article.category as string] || "bg-slate-50 text-slate-600"}`}>
                    {(article.category as string) || "Umum"}
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-2 group-hover:text-[#CC0000] transition-colors line-clamp-2">
                  {article.title as string}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{article.content as string}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><User size={9} /> {(article.author as string) || "-"}</span>
                  <span className="flex items-center gap-1"><Clock size={9} /> {article.created_at ? new Date(article.created_at as string).toLocaleDateString("id-ID") : "-"}</span>
                  <span className="flex items-center gap-1"><Eye size={9} /> {Number(article.views) || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
