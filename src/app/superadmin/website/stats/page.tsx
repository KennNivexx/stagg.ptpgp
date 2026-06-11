"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";

interface Stat {
  label: string;
  value: string;
  icon: string;
}

const defaultStat: Stat = { label: "", value: "", icon: "" };

export default function StatsCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    show: true,
    title: "",
    stats: [] as Stat[],
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const s = settings.stats || {};
        setForm({
          show: (s.show as boolean) ?? true,
          title: (s.title as string) || "Statistik Kami",
          stats:
            (s.stats as Stat[])?.length
              ? (s.stats as Stat[])
              : [{ label: "", value: "", icon: "" }],
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

  const handleStatChange = (
    idx: number,
    field: keyof Stat,
    value: string
  ) => {
    const updated = [...form.stats];
    updated[idx] = { ...updated[idx], [field]: value };
    setForm({ ...form, stats: updated });
  };

  const addStat = () => {
    setForm({ ...form, stats: [...form.stats, { ...defaultStat }] });
  };

  const removeStat = (idx: number) => {
    if (form.stats.length <= 1) return;
    setForm({ ...form, stats: form.stats.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("stats", form as Record<string, unknown>);
      if (res.error) setError(res.error);
      else {
        setSuccess("Stats section berhasil disimpan.");
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
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit Stats Section</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit judul dan daftar statistik perusahaan.
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
          <h2 className="text-lg font-bold text-[#1A2530]">Pengaturan Stats</h2>
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
              placeholder="Statistik Kami"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Statistik</label>
              <button
                onClick={addStat}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                <Plus size={14} /> Tambah Statistik
              </button>
            </div>
            {form.stats.map((stat, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Stat #{idx + 1}</span>
                  {form.stats.length > 1 && (
                    <button
                      onClick={() => removeStat(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Label (contoh: Proyek Selesai)"
                  value={stat.label}
                  onChange={(e) => handleStatChange(idx, "label", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Nilai (contoh: 500+)"
                  value={stat.value}
                  onChange={(e) => handleStatChange(idx, "value", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Icon (emoji / class)"
                  value={stat.icon}
                  onChange={(e) => handleStatChange(idx, "icon", e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
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
                <Save size={16} /> Simpan Stats Section
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
