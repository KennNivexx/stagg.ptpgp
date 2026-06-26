"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Save, RefreshCw, Palette, RotateCcw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";

const DEFAULTS = {
  primary: "#dd2c00",
  primary_hover: "#b22200",
  navy: "#111827",
  background: "#FCF9F6",
};

export default function ThemeSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...DEFAULTS });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const theme = (settings.theme || {}) as Record<string, string>;
        setForm({
          primary: theme.primary || DEFAULTS.primary,
          primary_hover: theme.primary_hover || DEFAULTS.primary_hover,
          navy: theme.navy || DEFAULTS.navy,
          background: theme.background || DEFAULTS.background,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setColor = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("theme", form as Record<string, unknown>);
      if (res.error) setError(res.error);
      else {
        setSuccess("Tema warna berhasil disimpan. Buka halaman publik untuk melihat hasilnya.");
        setTimeout(() => setSuccess(""), 4000);
      }
    } catch {
      setError("Gagal menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => setForm({ ...DEFAULTS });

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

  const fields: { key: keyof typeof form; label: string; hint: string }[] = [
    { key: "primary", label: "Warna Utama (Primary)", hint: "Tombol, aksen, highlight — sebelumnya merah." },
    { key: "primary_hover", label: "Warna Utama saat Hover", hint: "Versi lebih gelap saat tombol disentuh." },
    { key: "navy", label: "Warna Gelap (Navy)", hint: "Judul, footer, elemen gelap." },
    { key: "background", label: "Warna Latar Halaman", hint: "Background utama halaman publik." },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link href="/superadmin" className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530] flex items-center gap-2">
          <Palette size={24} className="text-amber-600" /> Tema & Warna
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Atur warna utama halaman publik. Perubahan diterapkan ke seluruh komponen (tombol, judul, footer).
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1A2530]">Pilih Warna</h2>
            <button onClick={resetDefaults} className="text-xs font-semibold text-slate-500 hover:text-amber-600 inline-flex items-center gap-1">
              <RotateCcw size={13} /> Reset Default
            </button>
          </div>
          <div className="p-6 space-y-5">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{f.label}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form[f.key]}
                    onChange={(e) => setColor(f.key, e.target.value)}
                    className="w-12 h-11 rounded-lg border border-slate-200 cursor-pointer bg-white p-1"
                  />
                  <input
                    type="text"
                    value={form[f.key]}
                    onChange={(e) => setColor(f.key, e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl p-3 text-sm font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    placeholder="#dd2c00"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">{f.hint}</p>
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-6 py-3 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: form.primary }}
            >
              {saving ? <><RefreshCw size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Tema</>}
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
            <div className="rounded-xl overflow-hidden border border-slate-100" style={{ backgroundColor: form.background }}>
              <div className="p-6" style={{ backgroundColor: form.navy }}>
                <p className="text-white font-black text-lg">Judul Section</p>
                <p className="text-slate-300 text-xs mt-1">Contoh teks di area gelap (navy).</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-bold" style={{ color: form.navy }}>Contoh judul terang</p>
                <p className="text-xs text-slate-500">Latar halaman memakai warna background yang dipilih.</p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: form.primary }}>
                    Tombol Utama
                  </button>
                  <span className="px-4 py-2 rounded-lg text-xs font-bold border" style={{ color: form.primary, borderColor: form.primary }}>
                    Aksen
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 text-center">Pratinjau kasar — buka halaman publik untuk hasil sebenarnya.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
