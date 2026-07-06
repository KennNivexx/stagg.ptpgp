"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Search, Calendar, FileText, Plus } from "lucide-react";
import { savePolicy } from "@/app/actions/knowledge";
import EmptyState from "@/components/EmptyState";

type Policy = Record<string, unknown>;

const CATEGORIES = ["Kepegawaian", "Keuangan", "Operasional", "IT", "HSE", "Lainnya"];

const categoryColorMap: Record<string, string> = {
  Kepegawaian: "bg-blue-50 text-blue-700",
  Keuangan: "bg-emerald-50 text-emerald-700",
  Operasional: "bg-amber-50 text-amber-700",
  IT: "bg-purple-50 text-purple-700",
  HSE: "bg-red-50 text-red-700",
  Lainnya: "bg-slate-100 text-slate-700",
};

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function PoliciesClient({ initialPolicies }: { initialPolicies: Policy[] }) {
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
    const result = await savePolicy(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "Kebijakan berhasil disimpan!" });
    formRef.current.reset();
    setShowForm(false);
    router.refresh();
  }

  const filtered = initialPolicies.filter((p) => {
    const matchCat = activeCategory === "Semua" || p.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || (p.title as string || "").toLowerCase().includes(q) || (p.content as string || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
          <div className="relative flex-1 max-w-md w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Cari kebijakan..."
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
          className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 shrink-0">
          <Plus size={14} /> {showForm ? "Tutup Form" : "Tambah Kebijakan"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Tambah Kebijakan Perusahaan</h3>
          </div>
          <form ref={formRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Judul Kebijakan</label>
              <input name="title" type="text" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Nama kebijakan..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kategori</label>
              <select name="category" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggal Berlaku</label>
              <input name="effective_date" type="date" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Revisi</label>
              <input name="revision" type="text" defaultValue="Rev. 1" className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Isi Kebijakan</label>
              <textarea name="content" rows={8} className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Tuliskan isi lengkap kebijakan ini..." />
            </div>
            <div className="md:col-span-2">
              <Msg m={msg} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading}
                className="px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                {loading ? "Menyimpan..." : "Simpan Kebijakan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title={initialPolicies.length === 0 ? "Belum ada kebijakan perusahaan." : "Tidak ada hasil yang cocok."} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((policy) => (
            <Link key={policy.id as string} href={`/hrd/knowledge/policies/${policy.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group cursor-pointer block">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${categoryColorMap[policy.category as string] || "bg-slate-50 text-slate-600"}`}>
                  {(policy.category as string) || "Umum"}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 mb-2 group-hover:text-[#CC0000] transition-colors line-clamp-2">
                {policy.title as string}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">{policy.content as string}</p>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium pt-4 border-t border-slate-50">
                {(policy.effective_date as string) && (
                  <span className="flex items-center gap-1"><Calendar size={10} /> Berlaku: {new Date(policy.effective_date as string).toLocaleDateString("id-ID")}</span>
                )}
                <span className="flex items-center gap-1"><Shield size={10} /> {(policy.revision as string) || "Rev. 1"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
