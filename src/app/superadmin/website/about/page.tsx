"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";
import { ImageUploadField } from "../_lib/ImageUploadField";

export default function AboutCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    show: true,
    title: "",
    description: "",
    image_url: "",
    years_experience: "",
    mission_text: "",
    vision_text: "",
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const s = settings.about || {};
        setForm({
          show: (s.show as boolean) ?? true,
          title: (s.title as string) || "Mitra Logistik Terpercaya Sejak 1996",
          description: (s.description as string) || "Berawal dari CV Putra Galuh yang didirikan oleh Bapak Maman Rohman pada tahun 1996, PT Pratama Galuh Perkasa (PGP) telah berkembang menjadi salah satu perusahaan jasa transportasi dan logistik terkemuka yang berpusat di Cilegon, Banten.\n\nSelama lebih dari dua dekade, kami telah melayani kebutuhan pengiriman barang industri dan komersial dengan cakupan layanan seluruh Indonesia hingga jangkauan internasional.\n\nSebagai perusahaan yang memiliki legalitas penuh dan mematuhi standar keselamatan industri, visi kami adalah menjadi perusahaan logistik terintegrasi dengan kapabilitas layanan global yang andal, aman, dan efisien.",
          image_url: (s.image_url as string) || "",
          years_experience: (s.years_experience as string) || "28+",
          mission_text: (s.mission_text as string) || "Memberikan solusi pengiriman tepat waktu, aman, dan transparan.",
          vision_text: (s.vision_text as string) || "Menjadi penyedia layanan logistik global terpadu yang profesional.",
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
      const res = await saveWebsiteSettings("about", form as Record<string, unknown>);
      if (res.error) setError(res.error);
      else {
        setSuccess("About section berhasil disimpan.");
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
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit About Section</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit teks, gambar, visi & misi halaman Tentang Kami.
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-[#1A2530]">Pengaturan About</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Tampilkan Seksi</p>
              <p className="text-xs text-slate-500">Toggle untuk menampilkan/menyembunyikan seksi ini</p>
            </div>
            <button
              onClick={() => setForm({ ...form, show: !form.show })}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.show ? "bg-amber-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  form.show ? "left-[26px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Judul</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              placeholder="Tentang Kami"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Deskripsi</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              placeholder="Deskripsi tentang perusahaan..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Tahun Pengalaman</label>
            <input
              type="text"
              name="years_experience"
              value={form.years_experience}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              placeholder="28+"
            />
            <p className="text-[10px] text-gray-400 mt-1">Ditampilkan sebagai badge di atas foto (misal: 28+)</p>
          </div>

          <ImageUploadField
            label="Gambar (opsional)"
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            folder="about"
            placeholder="https://example.com/about.jpg"
          />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Teks Misi</label>
            <textarea
              name="mission_text"
              value={form.mission_text}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              placeholder="Misi perusahaan..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Teks Visi</label>
            <textarea
              name="vision_text"
              value={form.vision_text}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
              placeholder="Visi perusahaan..."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-[#D97706] hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} /> Simpan About Section
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
