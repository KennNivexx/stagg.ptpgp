"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Save, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";
import { ImageUploadField } from "../_lib/ImageUploadField";

export default function HeroSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    hero_title: "",
    hero_title_highlight: "",
    hero_subtitle: "",
    hero_bg_image_url: "",
    hero_badge_text: "",
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const hero = settings.hero || {};
        setForm({
          hero_title:
            (hero.hero_title as string) ||
            "Solusi Transportasi & Freight Forwarding Terpercaya",
          hero_title_highlight: (hero.hero_title_highlight as string) || "",
          hero_subtitle:
            (hero.hero_subtitle as string) ||
            "Melayani pengiriman darat, laut, dan udara dengan jaringan luas, armada modern, serta layanan yang tepat waktu dan aman untuk pengiriman domestik maupun internasional.",
          hero_bg_image_url:
            (hero.hero_bg_image_url as string) || "",
          hero_badge_text:
            (hero.hero_badge_text as string) || "PT Pratama Galuh Perkasa",
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

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("hero", form as Record<string, unknown>);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Hero section berhasil disimpan.");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Gagal menyimpan pengaturan.");
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
        <h1 className="text-2xl font-bold text-[#1A2530]">Hero Section</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit judul, subtitle, dan gambar latar halaman utama.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-[#1A2530]">
              Pengaturan Hero
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Badge Teks
              </label>
              <input
                type="text"
                name="hero_badge_text"
                value={form.hero_badge_text}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                placeholder="PT Pratama Galuh Perkasa"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Judul Hero
              </label>
              <input
                type="text"
                name="hero_title"
                value={form.hero_title}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                placeholder="Solusi Transportasi & Freight Forwarding"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Judul Highlight (opsional)
              </label>
              <input
                type="text"
                name="hero_title_highlight"
                value={form.hero_title_highlight}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                placeholder="Terpercaya"
              />
              <p className="text-[10px] text-gray-400 mt-1">Bagian judul yang ditampilkan dengan warna aksen berbeda.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">
                Subtitle / Deskripsi
              </label>
              <textarea
                name="hero_subtitle"
                value={form.hero_subtitle}
                onChange={handleChange}
                rows={4}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors resize-none"
                placeholder="Deskripsi singkat layanan..."
              />
            </div>
            <ImageUploadField
              label="Gambar Latar (opsional)"
              value={form.hero_bg_image_url}
              onChange={(url) => setForm({ ...form, hero_bg_image_url: url })}
              folder="hero"
              placeholder="https://example.com/bg.jpg"
              hint="Biarkan kosong untuk menggunakan video YouTube default. Bisa isi URL atau unggah dari perangkat."
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 bg-[#CC0000] hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} /> Simpan Hero Section
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Eye size={18} className="text-slate-500" />
            <h2 className="text-lg font-bold text-[#1A2530]">Pratinjau</h2>
          </div>
          <div className="p-6">
            <div
              className="relative rounded-xl overflow-hidden min-h-[300px] flex items-center p-8"
              style={
                form.hero_bg_image_url
                  ? {
                      backgroundImage: `url(${form.hero_bg_image_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : {
                      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
                    }
              }
            >
              <div className="relative z-10 w-full">
                <span className="inline-block py-1.5 px-4 bg-red-600/30 text-orange-400 font-extrabold text-xs tracking-wider uppercase rounded-full mb-4 border border-orange-500/30">
                  {form.hero_badge_text || "PT Pratama Galuh Perkasa"}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3 tracking-tight">
                  {form.hero_title || "Solusi Transportasi & Freight Forwarding"}
                </h2>
                <p className="text-sm md:text-base text-zinc-200 leading-relaxed line-clamp-3">
                  {form.hero_subtitle ||
                    "Melayani pengiriman darat, laut, dan udara dengan jaringan luas."}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              Pratinjau kasar — tampilan aktual dapat berbeda di halaman publik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
