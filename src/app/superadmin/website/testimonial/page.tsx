"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";
import { ImageUploadField } from "../_lib/ImageUploadField";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  avatar_url: string;
}

const defaultItem: Testimonial = {
  name: "",
  role: "",
  company: "",
  quote: "",
  avatar_url: "",
};

export default function TestimonialCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    show: true,
    title: "",
    testimonials: [] as Testimonial[],
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const s = settings.testimonial || {};
        setForm({
          show: (s.show as boolean) ?? true,
          title: (s.title as string) || "Testimoni Klien",
          testimonials:
            (s.testimonials as Testimonial[])?.length
              ? (s.testimonials as Testimonial[])
              : [{ name: "", role: "", company: "", quote: "", avatar_url: "" }],
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

  const handleItemChange = (
    idx: number,
    field: keyof Testimonial,
    value: string
  ) => {
    const updated = [...form.testimonials];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, testimonials: updated });
  };

  const addItem = () => {
    setForm({
      ...form,
      testimonials: [...form.testimonials, { ...defaultItem }],
    });
  };

  const removeItem = (idx: number) => {
    if (form.testimonials.length <= 1) return;
    setForm({
      ...form,
      testimonials: form.testimonials.filter((_, i) => i !== idx),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings(
        "testimonial",
        form as Record<string, unknown>
      );
      if ("error" in res) setError(res.error);
      else {
        setSuccess("Testimonial section berhasil disimpan.");
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
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit Testimonial Section</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit judul dan daftar testimoni klien.
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
          <h2 className="text-lg font-bold text-[#1A2530]">Pengaturan Testimonial</h2>
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
              placeholder="Testimoni Klien"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Testimoni</label>
              <button
                onClick={addItem}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                <Plus size={14} /> Tambah Testimoni
              </button>
            </div>
            {form.testimonials.map((t, idx) => (
              <div
                key={t.name}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Testimoni #{idx + 1}</span>
                  {form.testimonials.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Nama klien"
                  value={t.name}
                  onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Jabatan / Role"
                  value={t.role}
                  onChange={(e) => handleItemChange(idx, "role", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Perusahaan"
                  value={t.company}
                  onChange={(e) => handleItemChange(idx, "company", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <textarea
                  rows={3}
                  placeholder="Isi testimoni"
                  value={t.quote}
                  onChange={(e) => handleItemChange(idx, "quote", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                />
                <ImageUploadField
                  label="Avatar (opsional)"
                  value={t.avatar_url}
                  onChange={(url) => handleItemChange(idx, "avatar_url", url)}
                  folder="testimonial"
                  placeholder="URL Avatar (opsional)"
                />
              </div>
            ))}
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
                <Save size={16} /> Simpan Testimonial Section
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
