"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";

export default function FooterSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    footer_copyright: "",
    footer_description: "",
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const footer = settings.footer || {};
        setForm({
          footer_copyright:
            (footer.footer_copyright as string) ||
            `\u00a9 ${new Date().getFullYear()} PT Pratama Galuh Perkasa. All rights reserved. Industrial Excellence in Logistics.`,
          footer_description:
            (footer.footer_description as string) ||
            "Industrial Excellence in Logistics. Delivering precision and reliability across the archipelago.",
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
      const res = await saveWebsiteSettings("footer", form as Record<string, unknown>);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Footer berhasil disimpan.");
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
      <div className="p-8 max-w-2xl mx-auto">
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
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link
          href="/superadmin"
          className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Pengaturan Footer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit teks copyright dan deskripsi footer website.
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
          <h2 className="text-lg font-bold text-[#1A2530]">Konten Footer</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Deskripsi Footer
            </label>
            <textarea
              name="footer_description"
              value={form.footer_description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors resize-none"
              placeholder="Deskripsi singkat di footer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Teks Copyright
            </label>
            <input
              type="text"
              name="footer_copyright"
              value={form.footer_copyright}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
              placeholder="© 2026 PT Pratama Galuh Perkasa..."
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Gunakan <code className="bg-slate-100 px-1 rounded">{"{year}"}</code> untuk menampilkan tahun otomatis.
            </p>
          </div>

          {/* Footer Preview */}
          <div className="mt-6 p-6 bg-zinc-50 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Pratinjau Footer
            </p>
            <div className="text-center">
              <p className="text-xs text-zinc-600 leading-relaxed mb-2">
                {form.footer_description}
              </p>
              <p className="text-[10px] font-bold text-zinc-500">
                {form.footer_copyright.replace("{year}", String(new Date().getFullYear()))}
              </p>
            </div>
          </div>

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
                <Save size={16} /> Simpan Footer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
