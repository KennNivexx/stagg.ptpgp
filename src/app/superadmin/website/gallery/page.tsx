"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";
import { ImageUploadField } from "../_lib/ImageUploadField";

interface GalleryImage {
  url: string;
  caption: string;
}

const defaultImages: GalleryImage[] = [
  { url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800", caption: "Gudang PGP" },
  { url: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800", caption: "Armada Truk" },
  { url: "https://images.unsplash.com/photo-1494412519320-aa3da3715a41?auto=format&fit=crop&q=80&w=800", caption: "Loading Barang" },
  { url: "https://images.unsplash.com/photo-1551281136-231362e59cd7?auto=format&fit=crop&q=80&w=800", caption: "Kontainer" },
  { url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800", caption: "Pelabuhan" },
  { url: "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=800", caption: "Tim Operasional" },
];

export default function GalleryCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    show: true,
    badge: "Galeri Operasional",
    title: "Dokumentasi Aktivitas",
    subtitle: "",
    images: defaultImages as GalleryImage[],
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const s = settings.gallery || {};
        setForm({
          show: (s.show as boolean) ?? true,
          badge: (s.badge as string) || "Galeri Operasional",
          title: (s.title as string) || "Dokumentasi Aktivitas",
          subtitle: (s.subtitle as string) || "",
          images:
            (s.images as GalleryImage[])?.length
              ? (s.images as GalleryImage[])
              : defaultImages,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (
    idx: number,
    field: keyof GalleryImage,
    value: string
  ) => {
    const updated = [...form.images];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, images: updated });
  };

  const addImage = () => {
    setForm({ ...form, images: [...form.images, { url: "", caption: "" }] });
  };

  const removeImage = (idx: number) => {
    if (form.images.length <= 1) return;
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("gallery", form as Record<string, unknown>);
      if ("error" in res) setError(res.error);
      else {
        setSuccess("Gallery section berhasil disimpan.");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Memuat pengaturan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/superadmin"
          className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit Gallery — Dokumentasi Aktivitas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit judul, deskripsi, dan gambar dokumentasi. Caption ditampilkan di bawah setiap foto.
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}

      <div className="space-y-6">
        {/* Pengaturan umum */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1A2530]">Pengaturan Umum</h2>
            <button
              onClick={() => setForm({ ...form, show: !form.show })}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.show ? "bg-amber-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.show ? "left-[26px]" : "left-0.5"}`} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Badge / Label kecil di atas judul</label>
              <input type="text" name="badge" value={form.badge} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Galeri Operasional" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Judul</label>
              <input type="text" name="title" value={form.title} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Dokumentasi Aktivitas" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Deskripsi singkat (opsional)</label>
              <textarea name="subtitle" value={form.subtitle} onChange={handleChange} rows={2}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                placeholder="Dokumentasi kegiatan operasional PT Pratama Galuh Perkasa..." />
            </div>
          </div>
        </div>

        {/* Gambar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A2530]">Gambar</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ganti URL gambar untuk update foto. Caption tampil di bawah foto.</p>
            </div>
            <button onClick={addImage} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 px-3 py-1.5 bg-amber-50 rounded-lg">
              <Plus size={14} /> Tambah Gambar
            </button>
          </div>
          <div className="p-5 space-y-4">
            {form.images.map((img, idx) => (
              <div key={img.url} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Gambar #{idx + 1}</span>
                  {form.images.length > 1 && (
                    <button onClick={() => removeImage(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <ImageUploadField
                  label="Gambar"
                  value={img.url}
                  onChange={(url) => handleImageChange(idx, "url", url)}
                  folder="gallery"
                  placeholder="URL Gambar (https://...)"
                />
                <input
                  type="text"
                  placeholder="Caption / keterangan gambar"
                  value={img.caption}
                  onChange={(e) => handleImageChange(idx, "caption", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-6 py-3 bg-[#D97706] hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><RefreshCw size={16} className="animate-spin" /> Menyimpan...</>
          ) : (
            <><Save size={16} /> Simpan Gallery Section</>
          )}
        </button>
      </div>
    </div>
  );
}
