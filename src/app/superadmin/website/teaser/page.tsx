"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";

export default function TeaserCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    career_badge: "Peluang Karir",
    career_title: "Karir di Pratama Galuh Perkasa",
    career_description: "Kami percaya bahwa sumber daya manusia adalah kunci keberhasilan. Oleh karena itu, kami menyediakan berbagai peluang karir bagi individu dinamis yang memiliki semangat untuk berkembang bersama.",
    career_link_text: "Lihat Lowongan Tersedia",
    career_href: "/career",
    career_image_url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800",
    epro_badge: "Kemitraan",
    epro_title: "E-Procurement Pratama Galuh Perkasa",
    epro_description: "Pratama Galuh Perkasa membuka peluang bagi para vendor untuk menjadi mitra resmi kami dalam mendukung kebutuhan pengadaan barang dan jasa dengan sistem yang transparan dan akuntabel.",
    epro_link_text: "Daftar sebagai Vendor",
    epro_href: "/e-procurement",
    epro_image_url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800",
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const s = settings.teaser || {};
        setForm({
          career_badge: (s.career_badge as string) || "Peluang Karir",
          career_title: (s.career_title as string) || "Karir di Pratama Galuh Perkasa",
          career_description: (s.career_description as string) || "Kami percaya bahwa sumber daya manusia adalah kunci keberhasilan.",
          career_link_text: (s.career_link_text as string) || "Lihat Lowongan Tersedia",
          career_href: (s.career_href as string) || "/career",
          career_image_url: (s.career_image_url as string) || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800",
          epro_badge: (s.epro_badge as string) || "Kemitraan",
          epro_title: (s.epro_title as string) || "E-Procurement Pratama Galuh Perkasa",
          epro_description: (s.epro_description as string) || "Pratama Galuh Perkasa membuka peluang bagi para vendor.",
          epro_link_text: (s.epro_link_text as string) || "Daftar sebagai Vendor",
          epro_href: (s.epro_href as string) || "/e-procurement",
          epro_image_url: (s.epro_image_url as string) || "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&q=80&w=800",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("teaser", form as Record<string, unknown>);
      if (res.error) setError(res.error);
      else {
        setSuccess("Teaser section berhasil disimpan.");
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
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit Teaser Section</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit banner Karir dan E-Procurement yang tampil di bawah halaman publik.
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}

      <div className="space-y-6">
        {/* Career */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-bold text-[#1A2530]">Banner Karir</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Badge</label>
              <input type="text" name="career_badge" value={form.career_badge} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Peluang Karir" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Judul</label>
              <input type="text" name="career_title" value={form.career_title} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Karir di Pratama Galuh Perkasa" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Deskripsi</label>
              <textarea name="career_description" value={form.career_description} onChange={handleChange}
                rows={3} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                placeholder="Deskripsi karir..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Teks Link</label>
              <input type="text" name="career_link_text" value={form.career_link_text} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Lihat Lowongan Tersedia" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">URL Tujuan</label>
              <input type="text" name="career_href" value={form.career_href} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="/career" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">URL Gambar</label>
              <input type="text" name="career_image_url" value={form.career_image_url} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="https://..." />
              {form.career_image_url && (
                <img src={form.career_image_url} alt="Preview" className="mt-3 rounded-xl max-h-40 object-cover border w-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
          </div>
        </div>

        {/* E-Procurement */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-bold text-[#1A2530]">Banner E-Procurement</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Badge</label>
              <input type="text" name="epro_badge" value={form.epro_badge} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Kemitraan" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Judul</label>
              <input type="text" name="epro_title" value={form.epro_title} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="E-Procurement Pratama Galuh Perkasa" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Deskripsi</label>
              <textarea name="epro_description" value={form.epro_description} onChange={handleChange}
                rows={3} className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                placeholder="Deskripsi e-procurement..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Teks Link</label>
              <input type="text" name="epro_link_text" value={form.epro_link_text} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Daftar sebagai Vendor" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">URL Tujuan</label>
              <input type="text" name="epro_href" value={form.epro_href} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="/e-procurement" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">URL Gambar</label>
              <input type="text" name="epro_image_url" value={form.epro_image_url} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="https://..." />
              {form.epro_image_url && (
                <img src={form.epro_image_url} alt="Preview" className="mt-3 rounded-xl max-h-40 object-cover border w-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
            </div>
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
            <><Save size={16} /> Simpan Teaser Section</>
          )}
        </button>
      </div>
    </div>
  );
}
