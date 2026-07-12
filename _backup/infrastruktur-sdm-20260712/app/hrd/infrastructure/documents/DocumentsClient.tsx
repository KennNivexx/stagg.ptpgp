"use client";

import { useState } from "react";
import { FileText, BookOpen, ClipboardList, File, Scale, Upload, Search, X, Users, Building2, Lock, Trash2, ExternalLink } from "lucide-react";
import { saveDocument, updateDocumentVisibility, deleteDocument } from "@/app/actions/infrastructure";
import DocumentUploadField from "@/components/DocumentUploadField";

type Document = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  url?: string | null;
  visible_to_employee: boolean;
  visible_to_department_head: boolean;
};

const CATEGORIES = [
  { id: "Kebijakan", label: "Kebijakan", icon: Scale, color: "bg-blue-50 text-blue-700" },
  { id: "SOP", label: "SOP", icon: ClipboardList, color: "bg-emerald-50 text-emerald-700" },
  { id: "Formulir", label: "Formulir", icon: File, color: "bg-amber-50 text-amber-700" },
  { id: "Template", label: "Template", icon: FileText, color: "bg-purple-50 text-purple-700" },
  { id: "Legal", label: "Legal", icon: Scale, color: "bg-rose-50 text-rose-700" },
  { id: "Kontrak", label: "Kontrak", icon: ClipboardList, color: "bg-cyan-50 text-cyan-700" },
];

export default function DocumentsClient({ initialDocuments }: { initialDocuments: Document[] }) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", category: "Kebijakan", url: "", visible_to_employee: false, visible_to_department_head: false });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filterDocs = () => {
    let docs = documents;
    if (activeCategory) docs = docs.filter((d) => d.category === activeCategory);
    if (searchQuery) docs = docs.filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return docs;
  };

  const filteredDocs = filterDocs();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg(null);
    const fd = new FormData();
    fd.append("title", uploadForm.title);
    fd.append("category", uploadForm.category);
    fd.append("url", uploadForm.url);
    if (uploadForm.visible_to_employee) fd.append("visible_to_employee", "on");
    if (uploadForm.visible_to_department_head) fd.append("visible_to_department_head", "on");
    const result = await saveDocument(fd);
    setSaving(false);
    if (result?.error) { setSaveMsg({ type: "error", text: result.error }); return; }
    setDocuments([
      { id: "tmp-" + Date.now(), title: uploadForm.title, category: uploadForm.category, status: "Aktif", created_at: new Date().toISOString(), url: uploadForm.url, visible_to_employee: uploadForm.visible_to_employee, visible_to_department_head: uploadForm.visible_to_department_head },
      ...documents,
    ]);
    setShowUpload(false);
    setUploadForm({ title: "", category: "Kebijakan", url: "", visible_to_employee: false, visible_to_department_head: false });
    setSaveMsg({ type: "success", text: "Dokumen berhasil ditambahkan." });
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleToggleVisibility = async (doc: Document, field: "visible_to_employee" | "visible_to_department_head") => {
    setTogglingId(doc.id);
    const newValue = !doc[field];
    const result = await updateDocumentVisibility(doc.id, field, newValue);
    setTogglingId(null);
    if (result?.error) { setSaveMsg({ type: "error", text: result.error }); return; }
    setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, [field]: newValue } : d)));
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const getCategoryInfo = (catId: string) => CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Dokumen Perusahaan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola dokumen dan atur siapa saja yang dapat melihatnya.</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
        >
          <Upload size={14} /> Unggah Dokumen
        </button>
      </div>

      {saveMsg && (
        <div className={`p-3 rounded-xl text-xs font-semibold mb-4 flex items-center gap-2 ${saveMsg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {saveMsg.text}
        </div>
      )}

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
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Visibilitas</label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={uploadForm.visible_to_employee} onChange={(e) => setUploadForm({ ...uploadForm, visible_to_employee: e.target.checked })} className="h-4 w-4" />
                  <Users size={13} className="text-slate-400" />
                  <span className="text-xs text-slate-700">Tampilkan ke portal Karyawan</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 cursor-pointer">
                  <input type="checkbox" checked={uploadForm.visible_to_department_head} onChange={(e) => setUploadForm({ ...uploadForm, visible_to_department_head: e.target.checked })} className="h-4 w-4" />
                  <Building2 size={13} className="text-slate-400" />
                  <span className="text-xs text-slate-700">Tampilkan ke portal Kepala Departemen</span>
                </label>
                {!uploadForm.visible_to_employee && !uploadForm.visible_to_department_head && (
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5"><Lock size={10} /> Tidak dicentang berarti dokumen hanya terlihat oleh HRD.</p>
                )}
              </div>
              <DocumentUploadField
                label="Dokumen"
                value={uploadForm.url}
                onChange={(url) => setUploadForm({ ...uploadForm, url })}
                folder="company-documents"
                hint="Tempel link dokumen, atau unggah file PDF/DOCX/XLSX langsung dari perangkat (maks. 20MB)."
              />
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Upload size={14} /> {saving ? "Menyimpan..." : "Simpan Dokumen"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const cat = getCategoryInfo(doc.category);
            const isToggling = togglingId === doc.id;
            return (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all hover:border-slate-200 group">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${cat.color}`}>
                    <cat.icon size={20} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      doc.status === "Aktif" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {doc.status}
                    </span>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-[#CC0000] transition-colors" title="Buka dokumen">
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <button onClick={() => handleDelete(doc.id)} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h3 className="font-extrabold text-sm text-slate-800 mb-1 line-clamp-2">{doc.title}</h3>
                <p className="text-[10px] text-slate-400 mb-3">
                  {new Date(doc.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <div className="pt-3 border-t border-slate-50 space-y-2">
                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${cat.color}`}>{cat.label}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      disabled={isToggling}
                      onClick={() => handleToggleVisibility(doc, "visible_to_employee")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${
                        doc.visible_to_employee ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Users size={10} /> Karyawan {doc.visible_to_employee ? "✓" : ""}
                    </button>
                    <button
                      disabled={isToggling}
                      onClick={() => handleToggleVisibility(doc, "visible_to_department_head")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${
                        doc.visible_to_department_head ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Building2 size={10} /> Kadept {doc.visible_to_department_head ? "✓" : ""}
                    </button>
                  </div>
                  {!doc.visible_to_employee && !doc.visible_to_department_head && (
                    <p className="text-[9px] text-slate-400 flex items-center gap-1"><Lock size={9} /> Hanya HRD</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
