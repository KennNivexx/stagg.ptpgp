"use client";

import { useState, useEffect, use } from "react";
import { BookOpen, Plus, Pencil, Trash2, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getGuidesForManagement, saveGuide, deleteGuide } from "@/app/actions/guides";
import GuideContent from "@/components/GuideContent";
import EmptyState from "@/components/EmptyState";

const ROLE_LABELS: Record<string, string> = {
  hrd: "Panduan HRD",
  employee: "Panduan Karyawan",
  applicant: "Panduan Pelamar",
  department_manager: "Panduan Departemen",
  director: "Panduan Direktur",
};

const VALID_ROLES = Object.keys(ROLE_LABELS);

type Guide = {
  id: string;
  role: string;
  category: string;
  title: string;
  content: string;
  order_index: number;
};

export default function GuidesManagementPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = use(params);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Guide | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ category: "Umum", title: "", content: "", order_index: "0" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const roleLabel = ROLE_LABELS[role] || "Panduan";
  const isValidRole = VALID_ROLES.includes(role);

  const load = () => {
    setLoading(true);
    getGuidesForManagement(role).then(data => {
      setGuides(data as Guide[]);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (isValidRole) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const openNew = () => {
    setEditing(null);
    setFormData({ category: "Umum", title: "", content: "", order_index: "0" });
    setShowForm(true);
  };

  const openEdit = (g: Guide) => {
    setEditing(g);
    setFormData({ category: g.category || "Umum", title: g.title, content: g.content, order_index: String(g.order_index || 0) });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData();
    fd.append("role", role);
    fd.append("category", formData.category);
    fd.append("title", formData.title);
    fd.append("content", formData.content);
    fd.append("order_index", formData.order_index);
    const res = await saveGuide(editing?.id || null, fd);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setShowForm(false);
    showToast("ok", editing ? "Panduan diperbarui." : "Panduan ditambahkan.");
    load();
  };

  const handleDelete = async (g: Guide) => {
    if (!confirm(`Hapus panduan "${g.title}"?`)) return;
    const res = await deleteGuide(g.id);
    if (res.error) { showToast("err", res.error); return; }
    showToast("ok", "Panduan dihapus.");
    load();
  };

  if (!isValidRole) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertTriangle size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-sm font-bold text-red-700">Kategori panduan tidak valid.</p>
        </div>
      </div>
    );
  }

  const grouped = guides.reduce((acc, g) => {
    const cat = g.category || "Umum";
    (acc[cat] = acc[cat] || []).push(g);
    return acc;
  }, {} as Record<string, Guide[]>);

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "err" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "err" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">{roleLabel}</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola panduan penggunaan sistem yang tampil untuk akun ini.</p>
        </div>
        <button onClick={openNew} className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
          <Plus size={14} /> Tambah Panduan
        </button>
      </div>

      {/* Form dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800">{editing ? "Edit Panduan" : "Tambah Panduan"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Misal: Absensi, Payroll" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urutan</label>
                  <input type="number" value={formData.order_index} onChange={e => setFormData({ ...formData, order_index: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Panduan</label>
                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Misal: Cara Mengajukan Cuti" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Isi Panduan</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-slate-200 p-3 rounded-xl text-sm font-mono"
                  rows={10}
                  placeholder={"Tulis isi panduan di sini.\n\nGunakan **teks** untuk cetak tebal.\nGunakan baris diawali \"- \" untuk daftar poin.\nPisahkan paragraf dengan baris kosong."}
                />
                <p className="text-[11px] text-slate-400 mt-1">Format: **tebal**, baris diawali &quot;- &quot; untuk daftar, baris kosong untuk paragraf baru.</p>
              </div>

              {formData.content && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Preview</p>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <GuideContent content={formData.content} />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]" />
        </div>
      ) : guides.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={`Belum ada panduan untuk ${roleLabel.toLowerCase()}.`}
          description={'Klik "Tambah Panduan" untuk membuat panduan pertama.'}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{category}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map(g => (
                  <div key={g.id} className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-bold text-sm text-slate-800">{g.title}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(g)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(g)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <GuideContent content={g.content} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
