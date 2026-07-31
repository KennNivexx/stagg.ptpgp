"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw, Building2, Phone, Mail, MapPin } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";

export default function InfoSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    company_name: "",
    company_phone: "",
    company_email: "",
    company_address: "",
    company_short_desc: "",
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const info = settings.info || {};
        setForm({
          company_name: (info.company_name as string) || "PT Pratama Galuh Perkasa",
          company_phone: (info.company_phone as string) || "(0524) 570700",
          company_email: (info.company_email as string) || "info@ptpgp.co.id",
          company_address: (info.company_address as string) || "Jl. Raya Anyer KM. 8, Cilegon, Banten 42415",
          company_short_desc: (info.company_short_desc as string) || "Industrial Excellence in Logistics. Melayani pengiriman barang dengan presisi dan keandalan di seluruh Nusantara.",
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
      const res = await saveWebsiteSettings("info", form as Record<string, unknown>);
      if ("error" in res) {
        setError(res.error);
      } else {
        setSuccess("Informasi perusahaan berhasil disimpan.");
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
        <h1 className="text-2xl font-bold text-[#1A2530]">Informasi Perusahaan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit nama, telepon, email, dan alamat perusahaan.
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
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-slate-500" />
            <h2 className="text-lg font-bold text-[#1A2530]">Data Perusahaan</h2>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Nama Perusahaan
            </label>
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 pl-10 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                placeholder="PT Pratama Galuh Perkasa"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Nomor Telepon
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="company_phone"
                value={form.company_phone}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 pl-10 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                placeholder="(0524) 570700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Email Perusahaan
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="company_email"
                value={form.company_email}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 pl-10 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                placeholder="info@ptpgp.co.id"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Alamat
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                name="company_address"
                value={form.company_address}
                onChange={handleChange}
                rows={2}
                className="w-full border border-slate-200 rounded-xl p-3 pl-10 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors resize-none"
                placeholder="Alamat lengkap perusahaan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Deskripsi Singkat
            </label>
            <textarea
              name="company_short_desc"
              value={form.company_short_desc}
              onChange={handleChange}
              rows={3}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors resize-none"
              placeholder="Deskripsi singkat perusahaan"
            />
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
                <Save size={16} /> Simpan Informasi Perusahaan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
