"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";
import { ImageUploadField } from "../_lib/ImageUploadField";

interface CertItem {
  name: string;
  issuer: string;
  logo: string;
}

const defaultCertItem: CertItem = { name: "", issuer: "", logo: "" };

function ItemList({
  items,
  label,
  addLabel,
  onChange,
  onAdd,
  onRemove,
}: {
  items: CertItem[];
  label: string;
  addLabel: string;
  onChange: (idx: number, field: keyof CertItem, value: string) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
        >
          <Plus size={14} /> {addLabel}
        </button>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
            {items.length > 1 && (
              <button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Nama (misal: ISO 9001, NIB)"
            value={item.name}
            onChange={(e) => onChange(idx, "name", e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
          <input
            type="text"
            placeholder="Penerbit / keterangan (opsional)"
            value={item.issuer}
            onChange={(e) => onChange(idx, "issuer", e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
          <ImageUploadField
            label="Gambar / Logo (opsional)"
            value={item.logo}
            onChange={(url) => onChange(idx, "logo", url)}
            folder="certification"
            placeholder="URL Gambar / Logo (opsional)"
          />
        </div>
      ))}
    </div>
  );
}

export default function CertificationCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    show: true,
    title: "",
    subtitle: "",
    certifications: [] as CertItem[],
    legal_title: "",
    legal_items: [] as CertItem[],
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const s = settings.certification || {};

        const mapItems = (arr: unknown): CertItem[] => {
          if (!Array.isArray(arr) || arr.length === 0) return [{ ...defaultCertItem }];
          return arr.map((x: Record<string, unknown>) => ({
            name: (x.name as string) || "",
            issuer: (x.issuer as string) || "",
            logo: (x.logo as string) || (x.logo_url as string) || "",
          }));
        };

        setForm({
          show: (s.show as boolean) ?? true,
          title: (s.title as string) || "Sertifikasi & Legalitas",
          subtitle: (s.subtitle as string) || "Kepercayaan Anda Prioritas Kami",
          certifications: mapItems(s.certifications),
          legal_title: (s.legal_title as string) || "Legalitas Perusahaan",
          legal_items: mapItems(s.legal_items),
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const makeHandlers = (list: "certifications" | "legal_items") => ({
    onChange: (idx: number, field: keyof CertItem, value: string) => {
      const updated = [...form[list]];
      updated[idx] = { ...updated[idx], [field]: value };
      setForm({ ...form, [list]: updated });
    },
    onAdd: () => setForm({ ...form, [list]: [...form[list], { ...defaultCertItem }] }),
    onRemove: (idx: number) => {
      if (form[list].length <= 1) return;
      setForm({ ...form, [list]: form[list].filter((_, i) => i !== idx) });
    },
  });

  const certHandlers = makeHandlers("certifications");
  const legalHandlers = makeHandlers("legal_items");

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("certification", form as Record<string, unknown>);
      if ("error" in res) setError(res.error);
      else {
        setSuccess("Sertifikasi & Legalitas berhasil disimpan.");
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
        <Link href="/superadmin" className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit Sertifikasi & Legalitas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit sertifikasi dan dokumen legalitas perusahaan. Gambar logo bisa ditempel via URL atau diunggah langsung dari perangkat.
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-base font-bold text-[#1A2530]">Pengaturan Umum</h2>
            <button
              onClick={() => setForm({ ...form, show: !form.show })}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.show ? "bg-amber-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.show ? "left-[26px]" : "left-0.5"}`} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Judul Seksi</label>
              <input type="text" name="title" value={form.title} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Sertifikasi & Legalitas" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Subtitle</label>
              <input type="text" name="subtitle" value={form.subtitle} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Kepercayaan Anda Prioritas Kami" />
            </div>
          </div>
        </div>

        {/* Sertifikasi */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-bold text-[#1A2530]">Sertifikasi</h2>
            <p className="text-xs text-gray-400 mt-0.5">ISO, sertifikasi industri, dll. Kosongkan URL gambar untuk pakai ikon default.</p>
          </div>
          <div className="p-5">
            <ItemList
              items={form.certifications}
              label="Daftar Sertifikasi"
              addLabel="Tambah Sertifikasi"
              onChange={certHandlers.onChange}
              onAdd={certHandlers.onAdd}
              onRemove={certHandlers.onRemove}
            />
          </div>
        </div>

        {/* Legalitas */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-base font-bold text-[#1A2530]">Legalitas Perusahaan</h2>
            <p className="text-xs text-gray-400 mt-0.5">NIB, NPWP, SIUP, TDP, dll.</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Label Sub-judul Legalitas</label>
              <input type="text" name="legal_title" value={form.legal_title} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                placeholder="Legalitas Perusahaan" />
            </div>
            <ItemList
              items={form.legal_items}
              label="Daftar Dokumen Legalitas"
              addLabel="Tambah Dokumen"
              onChange={legalHandlers.onChange}
              onAdd={legalHandlers.onAdd}
              onRemove={legalHandlers.onRemove}
            />
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
            <><Save size={16} /> Simpan Sertifikasi & Legalitas</>
          )}
        </button>
      </div>
    </div>
  );
}
