"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, ExternalLink, Search } from "lucide-react";
import { saveSop } from "@/app/actions/knowledge";

type Sop = Record<string, unknown>;

interface Props {
  initialSops: Sop[];
  categories: string[];
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function SopClient({ initialSops, categories }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function handleSave() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await saveSop(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "SOP berhasil disimpan!" });
    formRef.current.reset();
    setShowForm(false);
    router.refresh();
  }

  const filtered = initialSops.filter((s) => {
    const matchCat = activeCategory === "Semua" || s.category === activeCategory;
    const matchSearch = !search || (s.title as string || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Cari dokumen SOP..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> {showForm ? "Tutup Form" : "Tambah SOP Baru"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["Semua", ...categories].map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeCategory === cat ? "bg-[#CC0000] text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-[#CC0000] hover:text-[#CC0000]"}`}>
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Dokumen SOP</h3>
          </div>
          <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Judul SOP</label>
              <input name="title" type="text" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Nama dokumen SOP..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nomor SOP</label>
              <input name="number" type="text" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Kosongkan untuk auto-generate" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
              <select name="category" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Departemen</label>
              <input name="department" type="text" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Nama departemen terkait" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Versi</label>
              <input name="version" type="text" defaultValue="v1.0" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Link Dokumen (opsional)</label>
              <input name="document_url" type="url" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Deskripsi Singkat</label>
              <textarea name="description" rows={2} className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Deskripsi singkat SOP ini..." />
            </div>
            <div className="md:col-span-2">
              <Msg m={msg} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan SOP"}
              </button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">{initialSops.length === 0 ? "Belum ada dokumen SOP." : "Tidak ada hasil yang cocok."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sop) => (
            <div key={sop.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#CC0000]/10"><BookOpen size={16} className="text-[#CC0000]" /></div>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{sop.number as string}</span>
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm mb-1 line-clamp-2">{sop.title as string}</h4>
              <p className="text-[10px] text-slate-400 mb-3">{(sop.description as string) || ""}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded-md">{sop.category as string}</span>
                  <span className="text-[9px] text-slate-400">{sop.version as string}</span>
                </div>
                {sop.document_url ? (
                  <a href={sop.document_url as string} target="_blank" rel="noopener noreferrer"
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#CC0000] transition-colors">
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <button onClick={() => alert(`Dokumen: ${sop.title as string}\n\nBelum ada link dokumen yang ditautkan.`)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
