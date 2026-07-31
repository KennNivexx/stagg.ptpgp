"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, RefreshCw, Plus, Trash2, GripVertical } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";

interface LinkItem {
  label: string;
  url: string;
}

interface LinksForm {
  navbar: LinkItem[];
  footer_quick: LinkItem[];
  footer_support: LinkItem[];
  social: LinkItem[];
}

const defaultLinks: LinksForm = {
  navbar: [
    { label: "Home", url: "/" },
    { label: "Tentang Kami", url: "/#about" },
    { label: "Layanan", url: "/#services" },
    { label: "Karir", url: "/career" },
    { label: "Kontak", url: "/#contact" },
  ],
  footer_quick: [
    { label: "Tentang Kami", url: "/#about" },
    { label: "Karir", url: "/career" },
    { label: "Kontak", url: "/#contact" },
  ],
  footer_support: [
    { label: "Network", url: "/#services" },
    { label: "Client Portal", url: "/" },
    { label: "Privacy Policy", url: "/" },
  ],
  social: [
    { label: "LinkedIn", url: "https://linkedin.com/company/ptpgp" },
    { label: "Instagram", url: "https://instagram.com/ptpgp" },
  ],
};

export default function LinksSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<LinksForm>(defaultLinks);

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const links = settings.links as LinksForm | undefined;
        if (links) {
          setForm({
            navbar: links.navbar || defaultLinks.navbar,
            footer_quick: links.footer_quick || defaultLinks.footer_quick,
            footer_support: links.footer_support || defaultLinks.footer_support,
            social: links.social || defaultLinks.social,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLinkChange = (
    section: keyof LinksForm,
    index: number,
    field: keyof LinkItem,
    value: string
  ) => {
    const updated = { ...form };
    updated[section] = [...updated[section]];
    updated[section][index] = { ...updated[section][index], [field]: value };
    setForm(updated);
  };

  const addLink = (section: keyof LinksForm) => {
    const updated = { ...form };
    updated[section] = [...updated[section], { label: "", url: "" }];
    setForm(updated);
  };

  const removeLink = (section: keyof LinksForm, index: number) => {
    const updated = { ...form };
    updated[section] = updated[section].filter((_, i) => i !== index);
    setForm(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("links", form as unknown as Record<string, unknown>);
      if ("error" in res) {
        setError(res.error);
      } else {
        setSuccess("Link & navigasi berhasil disimpan.");
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
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Memuat pengaturan...</p>
          </div>
        </div>
      </div>
    );
  }

  const sections: { key: keyof LinksForm; title: string; desc: string }[] = [
    { key: "navbar", title: "Menu Navigasi (Navbar)", desc: "Link yang muncul di menu utama website." },
    { key: "footer_quick", title: "Footer — Quick Links", desc: "Link cepat di bagian footer." },
    { key: "footer_support", title: "Footer — Layanan", desc: "Link layanan di footer." },
    { key: "social", title: "Social Media", desc: "Link sosial media perusahaan." },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/superadmin"
          className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Link & Navigasi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit menu navigasi dan link footer website.
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

      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.key}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1A2530]">{section.title}</h3>
                <p className="text-[10px] text-gray-400">{section.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => addLink(section.key)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus size={12} /> Tambah
              </button>
            </div>
            <div className="p-5 space-y-3">
              {form[section.key].length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">
                  Belum ada link. Klik &quot;Tambah&quot; untuk menambahkan.
                </p>
              )}
              {form[section.key].map((link, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="pt-3 text-gray-300">
                    <GripVertical size={14} />
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Label"
                      value={link.label}
                      onChange={(e) =>
                        handleLinkChange(section.key, idx, "label", e.target.value)
                      }
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) =>
                          handleLinkChange(section.key, idx, "url", e.target.value)
                        }
                        className="flex-1 border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeLink(section.key, idx)}
                        className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

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
              <Save size={16} /> Simpan Semua Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
