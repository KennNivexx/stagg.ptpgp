import { getSettings } from "@/app/actions/admin";
import SettingsClient from "./SettingsClient";
import CompanyContactForm from "@/components/settings/CompanyContactForm";

export default async function PengaturanPerusahaan() {
  const settings = await getSettings().catch(() => ({} as Record<string, string>));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengaturan Perusahaan</h1>
        <p className="text-sm text-gray-500">Konfigurasi informasi perusahaan, jam kerja, dan kebijakan cuti.</p>
      </div>
      <SettingsClient initialSettings={settings} />

      <div>
        <h2 className="text-lg font-extrabold text-[#1A2530] mb-1">Profil Kantor</h2>
        <p className="text-sm text-gray-500 mb-4">Foto kantor dan alamat PGP yang tampil di website publik — bagian ini sama dengan Superadmin → Manajemen Website → Kontak.</p>
        <CompanyContactForm />
      </div>
    </div>
  );
}
