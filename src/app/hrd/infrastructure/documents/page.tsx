"use client";

import { useState } from "react";
import { FileText, BookOpen, ClipboardList, File, Scale, Upload, Search, X, Plus } from "lucide-react";

type Document = {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  status: string;
};

const CATEGORIES = [
  { id: "kebijakan", label: "Kebijakan", icon: Scale, color: "bg-blue-50 text-blue-700" },
  { id: "sop", label: "SOP", icon: ClipboardList, color: "bg-emerald-50 text-emerald-700" },
  { id: "formulir", label: "Formulir", icon: File, color: "bg-amber-50 text-amber-700" },
  { id: "template", label: "Template", icon: FileText, color: "bg-purple-50 text-purple-700" },
  { id: "legal", label: "Legal", icon: Scale, color: "bg-rose-50 text-rose-700" },
];

const INITIAL_DOCS: Document[] = [
  { id: "1", title: "Kebijakan Cuti Karyawan", category: "kebijakan", updatedAt: "2026-05-20", status: "Aktif" },
  { id: "2", title: "Peraturan Disiplin Kerja", category: "kebijakan", updatedAt: "2026-04-15", status: "Aktif" },
  { id: "3", title: "SOP Rekrutmen", category: "sop", updatedAt: "2026-05-01", status: "Aktif" },
  { id: "4", title: "SOP Penggajian", category: "sop", updatedAt: "2026-03-10", status: "Aktif" },
  { id: "5", title: "Formulir Cuti", category: "formulir", updatedAt: "2026-02-20", status: "Aktif" },
  { id: "6", title: "Formulir Lembur", category: "formulir", updatedAt: "2026-01-15", status: "Aktif" },
  { id: "7", title: "Template Kontrak Kerja", category: "template", updatedAt: "2026-05-10", status: "Aktif" },
  { id: "8", title: "Template Surat Peringatan", category: "template", updatedAt: "2026-04-25", status: "Aktif" },
  { id: "9", title: "Peraturan Perusahaan", category: "legal", updatedAt: "2026-03-01", status: "Aktif" },
  { id: "10", title: "Perjanjian Kerja Bersama", category: "legal", updatedAt: "2025-12-10", status: "Draft" },
  { id: "11", title: "Kebijakan Work From Home", category: "kebijakan", updatedAt: "2026-06-01", status: "Aktif" },
  { id: "12", title: "Formulir Penilaian Kinerja", category: "formulir", updatedAt: "2026-05-28", status: "Aktif" },
];

export default function DokumenPerusahaan() {
  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCS);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", category: "kebijakan" });

  const filterDocs = () => {
    let docs = documents;
    if (activeCategory) docs = docs.filter((d) => d.category === activeCategory);
    if (searchQuery) docs = docs.filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return docs;
  };

  const filteredDocs = filterDocs();

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: Document = {
      id: Date.now().toString(),
      title: uploadForm.title,
      category: uploadForm.category,
      updatedAt: new Date().toISOString().split("T")[0],
      status: "Aktif",
    };
    setDocuments([newDoc, ...documents]);
    setShowUpload(false);
    setUploadForm({ title: "", category: "kebijakan" });
  };

  const getCategoryInfo = (catId: string) => CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Dokumen Perusahaan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dokumen kebijakan, SOP, formulir, template, dan dokumen legal.</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Upload size={14} /> Unggah Dokumen
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={() => setActiveCategory("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            !activeCategory ? "bg-[#1A2530] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Semua
        </button>
        {CATEGORIES.map((cat) => {
          const count = documents.filter((d) => d.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                activeCategory === cat.id ? `${cat.color} ring-1 ring-current` : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <cat.icon size={12} /> {cat.label} ({count})
            </button>
          );
        })}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dokumen..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-56 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          />
        </div>
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Unggah Dokumen Baru</h3>
              <button onClick={() => setShowUpload(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Dokumen</label>
                <input
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                  placeholder="Nama dokumen"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-[#CC0000] transition-colors cursor-pointer">
                <Upload size={28} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-500">Klik atau seret file ke sini</p>
                <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, XLSX (Max 10MB)</p>
              </div>
              <button type="submit" className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2">
                <Upload size={14} /> Unggah
              </button>
            </form>
          </div>
        </div>
      )}

      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Tidak ada dokumen ditemukan.</p>
          {activeCategory && <p className="text-xs text-slate-400 mt-1">Coba ubah filter kategori.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => {
            const cat = getCategoryInfo(doc.category);
            return (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all hover:border-slate-200 group cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${cat.color}`}>
                    <cat.icon size={20} />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    doc.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {doc.status}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mb-1 line-clamp-2 group-hover:text-[#CC0000] transition-colors">{doc.title}</h3>
                <p className="text-[10px] text-slate-400 mb-3">
                  {new Date(doc.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${cat.color}`}>{cat.label}</span>
                  <span className="ml-auto text-[10px] text-slate-300 cursor-not-allowed flex items-center gap-1" title="Segera tersedia">
                    <FileText size={10} /> Lihat
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
