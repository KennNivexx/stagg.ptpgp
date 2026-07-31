"use client";

import { useState, useEffect } from "react";
import { Save, RefreshCw } from "lucide-react";
import { getWebsiteSettings, saveWebsiteSettings } from "@/app/actions/settings";
import { ImageUploadField } from "@/app/superadmin/website/_lib/ImageUploadField";

// Shared by /superadmin/website/contact and /hrd/admin/company-profile —
// same underlying "contact" CMS section (address + office photo shown on
// the public website), editable from either role per the user's request.
export default function CompanyContactForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    contact_title: "Kirim Pesan",
    office_photo: "",
    address1_label: "Kantor Pusat",
    address1: "Jl. Raya Anyer KM. 10, Cilegon, Banten",
    address2_label: "Kantor Operasional",
    address2: "Jakarta Utara, Indonesia",
    phone: "(0254) 570700",
    email: "admin@ptpgp.co.id",
    hours_weekday: "08:00 - 17:00",
    hours_saturday: "08:00 - 12:00",
    hours_sunday: "Tutup",
    map_city: "Cilegon, Banten",
    map_address: "Jl. Raya Anyer KM. 10",
  });

  useEffect(() => {
    getWebsiteSettings()
      .then((settings) => {
        const s = settings.contact || {};
        setForm({
          contact_title: (s.contact_title as string) || "Kirim Pesan",
          office_photo: (s.office_photo as string) || "",
          address1_label: (s.address1_label as string) || "Kantor Pusat",
          address1: (s.address1 as string) || "Jl. Raya Anyer KM. 10, Cilegon, Banten",
          address2_label: (s.address2_label as string) || "Kantor Operasional",
          address2: (s.address2 as string) || "Jakarta Utara, Indonesia",
          phone: (s.phone as string) || "(0254) 570700",
          email: (s.email as string) || "admin@ptpgp.co.id",
          hours_weekday: (s.hours_weekday as string) || "08:00 - 17:00",
          hours_saturday: (s.hours_saturday as string) || "08:00 - 12:00",
          hours_sunday: (s.hours_sunday as string) || "Tutup",
          map_city: (s.map_city as string) || "Cilegon, Banten",
          map_address: (s.map_address as string) || "Jl. Raya Anyer KM. 10",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await saveWebsiteSettings("contact", form as Record<string, unknown>);
      if ("error" in res && res.error) setError(res.error);
      else {
        setSuccess("Informasi kantor berhasil disimpan.");
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
      <div className="bg-white rounded-2xl border border-slate-100 p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  const field = (label: string, name: keyof typeof form, placeholder?: string) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-2">{label}</label>
      <input
        type="text"
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}

      {/* Foto Kantor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-[#1A2530]">Foto Kantor</h2>
        </div>
        <div className="p-5">
          <ImageUploadField
            label="Foto Kantor PGP"
            value={form.office_photo}
            onChange={(url) => setForm((f) => ({ ...f, office_photo: url }))}
            folder="office"
            hint="Tampil di halaman Tentang Kami / Kontak website publik."
          />
        </div>
      </div>

      {/* Alamat */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-[#1A2530]">Alamat</h2>
        </div>
        <div className="p-5 space-y-4">
          {field("Label Alamat 1", "address1_label", "Kantor Pusat")}
          {field("Alamat 1", "address1", "Jl. Raya Anyer KM. 10, Cilegon, Banten")}
          {field("Label Alamat 2 (opsional)", "address2_label", "Kantor Operasional")}
          {field("Alamat 2 (kosongkan jika tidak ada)", "address2", "Jakarta Utara, Indonesia")}
        </div>
      </div>

      {/* Kontak */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-[#1A2530]">Telepon & Email</h2>
        </div>
        <div className="p-5 space-y-4">
          {field("Nomor Telepon", "phone", "(0254) 570700")}
          {field("Email", "email", "admin@ptpgp.co.id")}
        </div>
      </div>

      {/* Jam Operasional */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-[#1A2530]">Jam Operasional</h2>
        </div>
        <div className="p-5 space-y-4">
          {field("Senin - Jumat", "hours_weekday", "08:00 - 17:00")}
          {field("Sabtu", "hours_saturday", "08:00 - 12:00")}
          {field("Minggu", "hours_sunday", "Tutup")}
        </div>
      </div>

      {/* Peta */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-base font-bold text-[#1A2530]">Peta Lokasi</h2>
        </div>
        <div className="p-5 space-y-4">
          {field("Kota / Wilayah", "map_city", "Cilegon, Banten")}
          {field("Alamat Singkat", "map_address", "Jl. Raya Anyer KM. 10")}
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
          <><Save size={16} /> Simpan Informasi Kantor</>
        )}
      </button>
    </div>
  );
}
