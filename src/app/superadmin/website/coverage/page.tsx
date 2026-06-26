"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";

interface CoverageItem {
  region: string;
}

const defaultItem: CoverageItem = { region: "" };

export default function CoverageCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    show: true,
    title: "",
    subtitle: "",
    domestic: [] as CoverageItem[],
    international: [] as CoverageItem[],
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const s = settings.coverage || {};
        setForm({
          show: (s.show as boolean) ?? true,
          title: (s.title as string) || "Area Layanan",
          subtitle: (s.subtitle as string) || "Cakupan Pengiriman",
          domestic:
            (s.domestic as CoverageItem[])?.length
              ? (s.domestic as CoverageItem[])
              : [{ region: "Jakarta" }, { region: "Surabaya" }, { region: "Medan" }],
          international:
            (s.international as CoverageItem[])?.length
              ? (s.international as CoverageItem[])
              : [{ region: "Singapura" }, { region: "Malaysia" }, { region: "China" }],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleItemChange = (
    list: "domestic" | "international",
    idx: number,
    value: string
  ) => {
    const updated = [...form[list]];
    updated[idx] = { region: value };
    setForm({ ...form, [list]: updated });
  };

  const addItem = (list: "domestic" | "international") => {
    setForm({ ...form, [list]: [...form[list], { ...defaultItem }] });
  };

  const removeItem = (list: "domestic" | "international", idx: number) => {
    if (form[list].length <= 1) return;
    setForm({ ...form, [list]: form[list].filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("coverage", form as Record<string, unknown>);
      if (res.error) setError(res.error);
      else {
        setSuccess("Coverage section berhasil disimpan.");
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

  const renderList = (list: "domestic" | "international", label: string) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <button
          onClick={() => addItem(list)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
        >
          <Plus size={14} /> Tambah Wilayah
        </button>
      </div>
      {form[list].map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nama wilayah / negara"
            value={item.region}
            onChange={(e) => handleItemChange(list, idx, e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
          {form[list].length > 1 && (
            <button
              onClick={() => removeItem(list, idx)}
              className="text-red-400 hover:text-red-600 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/superadmin"
          className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit Coverage Section</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit judul dan daftar cakupan wilayah domestik & internasional.
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
          <h2 className="text-lg font-bold text-[#1A2530]">Pengaturan Coverage</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Tampilkan Seksi</p>
              <p className="text-xs text-slate-500">Toggle untuk menampilkan/menyembunyikan seksi ini</p>
            </div>
            <button
              onClick={() => setForm({ ...form, show: !form.show })}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.show ? "bg-amber-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.show ? "left-[26px]" : "left-0.5"}`} />
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
              placeholder="Area Layanan"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Subtitle</label>
            <input
              type="text"
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              placeholder="Cakupan Pengiriman"
            />
          </div>

          <div className="border border-orange-100 rounded-xl p-4 bg-orange-50/20">
            <p className="text-xs font-bold text-orange-700 mb-4 uppercase tracking-wider">Wilayah Domestik (Indonesia)</p>
            {renderList("domestic", "Daftar Kota/Provinsi")}
          </div>

          <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/20">
            <p className="text-xs font-bold text-blue-700 mb-4 uppercase tracking-wider">Wilayah Internasional</p>
            {renderList("international", "Daftar Negara")}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-[#D97706] hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><RefreshCw size={16} className="animate-spin" /> Menyimpan...</>
            ) : (
              <><Save size={16} /> Simpan Coverage Section</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
